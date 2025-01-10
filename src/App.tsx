import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Cloud, 
  Search, 
  Wind, 
  Droplets, 
  Thermometer, 
  Sunrise, 
  Sunset, 
  Navigation, 
  MapPin,
  AlertTriangle,
  RefreshCw,
  History,
  Moon,
  Sun,
  Info
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import type { WeatherData } from './types/weather';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const API_KEY = 'your_api_key';

  // Fetch current time in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' };
      const time = new Intl.DateTimeFormat('en-IN', options).format(now);
      setCurrentTime(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load recent searches and user's location
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await axios.get<WeatherData>(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${API_KEY}&units=metric`
            );
            setWeather(response.data);
          } catch (err) {
            setError('Failed to fetch weather for your location.');
          }
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  // Fetch weather data
  const fetchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowRecentSearches(false);
    
    try {
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},${country}&appid=${API_KEY}&units=metric`
      );
      setWeather(response.data);
      
      const searchTerm = `${city}, ${country}`;
      const updatedSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (err) {
      setError('City not found. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = async (search: string) => {
    const [cityName, countryCode] = search.split(', ');
    setCity(cityName);
    setCountry(countryCode);
    setShowRecentSearches(false);
    
    try {
      setLoading(true);
      const response = await axios.get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName},${countryCode}&appid=${API_KEY}&units=metric`
      );
      setWeather(response.data);
    } catch (err) {
      setError('Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  // Group forecast by day
  const groupForecastByDay = () => {
    if (!weather) return [];
    
    const dailyForecasts = weather.list.reduce((acc: any[], forecast) => {
      const date = forecast.dt_txt.split(' ')[0];
      if (!acc.find(item => item.date === date)) {
        acc.push({
          date,
          ...forecast
        });
      }
      return acc;
    }, []).slice(0, 5);

    return dailyForecasts;
  };

  // Get background gradient based on time of day and theme
  const getBackgroundGradient = () => {
    if (!weather) return isDarkTheme ? 'from-gray-900 to-black' : 'from-orange-400 to-yellow-300';
    const hour = new Date().getHours();
    if (isDarkTheme) {
      return 'from-gray-900 to-black'; // Dark theme background
    } else {
      if (hour >= 6 && hour < 12) return 'from-orange-400 to-yellow-300'; // Morning
      if (hour >= 12 && hour < 17) return 'from-blue-400 to-cyan-300'; // Afternoon
      if (hour >= 17 && hour < 20) return 'from-orange-500 to-red-500'; // Evening
      return 'from-blue-900 to-purple-900'; // Night
    }
  };

  // Convert Celsius to Fahrenheit
  const convertCelsiusToFahrenheit = (celsius: number) => {
    return (celsius * 1.8 + 32).toFixed(1);
  };

  // Convert Fahrenheit to Celsius
  const convertFahrenheitToCelsius = (fahrenheit: number) => {
    return ((fahrenheit - 32) / 1.8).toFixed(1);
  };

  // Get temperature based on selected unit
  const getTemperature = (temp: number) => {
    return unit === 'metric' ? Math.round(temp) : Math.round(parseFloat(convertCelsiusToFahrenheit(temp)));
  };

  // Get chart data
  const getChartData = () => {
    if (!weather) return { labels: [], datasets: [] };

    const labels = weather.list.map(forecast => new Date(forecast.dt * 1000).toLocaleTimeString());
    const temperatures = weather.list.map(forecast => getTemperature(forecast.main.temp));
    const humidities = weather.list.map(forecast => forecast.main.humidity);
    const windSpeeds = weather.list.map(forecast => forecast.wind.speed);

    return {
      labels,
      datasets: [
        {
          label: `Temperature (°${unit === 'metric' ? 'C' : 'F'})`,
          data: temperatures,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
        {
          label: 'Humidity (%)',
          data: humidities,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        },
        {
          label: `Wind Speed (${unit === 'metric' ? 'm/s' : 'mph'})`,
          data: windSpeeds,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
      ],
    };
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Toggle unit
  const toggleUnit = () => {
    setUnit(unit === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} p-6 transition-colors duration-1000 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className={`${isDarkTheme ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-xl p-8 shadow-lg`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Cloud className="w-12 h-12" />
              <h1 className="text-5xl font-bold">Weather Forecast</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">
                IST: {currentTime}
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
              >
                {isDarkTheme ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
          </div>

          <form onSubmit={fetchWeather} className="relative mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  className={`w-full px-4 py-3 rounded-lg ${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50`}
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg">
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-3 py-2 text-gray-600">
                        <History size={16} />
                        <span className="font-semibold">Recent Searches</span>
                      </div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full text-left px-3 py-2 hover:bg-white/60 rounded transition-colors"
                        >
                          <MapPin className="inline-block w-4 h-4 mr-2 text-gray-600" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Enter country code"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg ${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleUnit}
                  className={`px-4 py-3 ${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} hover:bg-white/30 rounded-lg transition-colors duration-200`}
                >
                  {unit === 'metric' ? '°C' : '°F'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 ${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} hover:bg-white/30 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px]`}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2" size={20} />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className={`flex items-center justify-center gap-2 text-center mb-6 p-4 rounded-lg ${isDarkTheme ? 'bg-red-500/20 text-red-200' : 'bg-red-200/90 text-red-800'}`}>
              <AlertTriangle />
              {error}
            </div>
          )}

          {weather && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="w-6 h-6" />
                  <h2 className="text-4xl font-bold">
                    {weather.city.name}, {weather.city.country}
                  </h2>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Sunrise size={16} />
                    <span>Sunrise: {new Date(weather.city.sunrise * 1000).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sunset size={16} />
                    <span>Sunset: {new Date(weather.city.sunset * 1000).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {groupForecastByDay().map((day, index) => (
                  <div
                    key={index}
                    className={`${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} rounded-lg p-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:bg-white/30`}
                  >
                    <div className="text-center">
                      <p className="font-semibold text-lg mb-2">
                        {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="relative">
                        <img
                          src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png`}
                          alt={day.weather[0].description}
                          className="mx-auto w-24 h-24 transform hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                      <p className="text-3xl font-bold mb-2">
                        {getTemperature(day.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
                      </p>
                      <p className="capitalize text-sm mb-4 font-medium">
                        {day.weather[0].description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-center gap-1 bg-black/20 rounded-lg p-2">
                          <Wind size={16} />
                          <span>{Math.round(day.wind.speed)} {unit === 'metric' ? 'm/s' : 'mph'}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 bg-black/20 rounded-lg p-2">
                          <Droplets size={16} />
                          <span>{day.main.humidity}%</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1 bg-black/20 rounded-lg p-2 text-sm">
                        <Thermometer size={16} />
                        <span>Feels like: {getTemperature(day.main.feels_like)}°{unit === 'metric' ? 'C' : 'F'}</span>
                      </div>
                      <div className="mt-4 text-sm text-gray-400">
                        <Info size={16} className="inline-block mr-2" />
                        {unit === 'metric' ? (
                          <span>{Math.round(day.main.temp)}°C = {convertCelsiusToFahrenheit(day.main.temp)}°F</span>
                        ) : (
                          <span>{Math.round(day.main.temp)}°F = {convertFahrenheitToCelsius(day.main.temp)}°C</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${isDarkTheme ? 'bg-gray-700/90 text-white' : 'bg-white/90 text-gray-900'} rounded-lg p-6 backdrop-blur-sm`}>
                <Line data={getChartData()} />
              </div>

              {weather.list[0].weather[0].main === 'Rain' && (
                <div className={`text-center ${isDarkTheme ? 'bg-blue-500/20 text-white' : 'bg-blue-200/90 text-blue-900'} p-4 rounded-lg`}>
                  <AlertTriangle className="inline-block mr-2" />
                  Don't forget your umbrella today!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;