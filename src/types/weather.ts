export interface WeatherData {
  list: {
    dt_txt: string;
    main: {
      temp: number;
      humidity: number;
      feels_like: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
  }[];
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
  };
}