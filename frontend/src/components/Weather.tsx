import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Droplets } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { weatherApi, type WeatherResponse } from '../services/api';

function Weather() {
  const { settings } = useSettingsStore();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await weatherApi.getWeather(settings.weatherCity);
        setWeather(data);
      } catch {
        setWeather({
          city: settings.weatherCity,
          temp: 28,
          condition: 'cloudy',
          humidity: 75,
          icon: 'cloudy',
          feelsLike: 30,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.weatherCity]);

  const getWeatherIcon = (condition: string) => {
    const key = condition.toLowerCase();
    const iconStyle = { color: settings.accentColor };
    if (key.includes('clear') || key.includes('sunny')) return <Sun className="w-5 h-5" style={iconStyle} />;
    if (key.includes('rain') || key.includes('drizzle')) return <CloudRain className="w-5 h-5" style={iconStyle} />;
    if (key.includes('snow')) return <CloudSnow className="w-5 h-5" style={iconStyle} />;
    if (key.includes('thunder') || key.includes('storm')) return <CloudLightning className="w-5 h-5" style={iconStyle} />;
    return <Cloud className="w-5 h-5" style={iconStyle} />;
  };

  if (loading) {
    return (
      <div
        className="rounded-lg px-4 py-2 animate-pulse"
        style={{
          background: settings.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        }}
      >
        <div className="w-32 h-6 rounded" style={{ background: `${settings.accentColor}20` }} />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg px-3 sm:px-4 py-2 backdrop-blur-[12px] inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-4"
      style={{
        background: settings.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${settings.theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div className="flex items-center gap-2">
        {getWeatherIcon(weather.condition)}
        <span className="text-lg sm:text-xl font-light" style={{ color: settings.textColor }}>{weather.temp}°C</span>
        <span className="capitalize text-xs sm:hidden" style={{ color: settings.accentColor }}>{weather.condition}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs" style={{ color: settings.accentColor }}>
        <span className="capitalize hidden sm:inline">{weather.condition}</span>
        <span className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          {weather.humidity}%
        </span>
        <span>{weather.city}</span>
      </div>
    </motion.div>
  );
}

export default Weather;
