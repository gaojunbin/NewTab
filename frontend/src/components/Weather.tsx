import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, MapPin } from 'lucide-react';
import { useSettingsStore, rgba } from '../stores/useSettingsStore';
import { weatherApi, type WeatherResponse } from '../services/api';

function Weather() {
  const { settings } = useSettingsStore();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await weatherApi.getWeather(settings.weatherCity);
        if (active) setWeather(data);
      } catch {
        if (active) {
          setWeather({
            city: settings.weatherCity,
            temp: 26,
            condition: 'Partly Cloudy',
            humidity: 68,
            icon: 'cloudy',
            feelsLike: 28,
            high: 29,
            low: 23,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [settings.weatherCity]);

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    const key = `${condition} ${iconCode || ''}`.toLowerCase();
    const iconStyle = { color: settings.textColor };
    if (key.includes('clear') || key.includes('sunny')) return <Sun className="w-4 h-4 opacity-85" style={iconStyle} />;
    if (key.includes('rain') || key.includes('drizzle')) return <CloudRain className="w-4 h-4 opacity-85" style={iconStyle} />;
    if (key.includes('snow')) return <CloudSnow className="w-4 h-4 opacity-85" style={iconStyle} />;
    if (key.includes('thunder') || key.includes('storm')) return <CloudLightning className="w-4 h-4 opacity-85" style={iconStyle} />;
    return <Cloud className="w-4 h-4 opacity-85" style={iconStyle} />;
  };

  if (loading) {
    return (
      <div
        className="rounded-full px-4 py-1.5 animate-pulse inline-flex items-center gap-2"
        style={{
          background: rgba(settings.textColor, 0.04),
          border: `1px solid ${rgba(settings.textColor, 0.06)}`,
        }}
      >
        <div className="w-36 h-4 rounded-full" style={{ background: rgba(settings.textColor, 0.07) }} />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.button
      layout
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-full px-3.5 sm:px-4 py-1.5 backdrop-blur-xl inline-flex items-center gap-2.5 sm:gap-3 text-xs select-none transition-colors duration-200 cursor-pointer"
      style={{
        background: rgba(settings.textColor, expanded ? 0.06 : 0.035),
        border: `1px solid ${rgba(settings.textColor, expanded ? 0.14 : 0.08)}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        {getWeatherIcon(weather.condition, weather.icon)}
        <span
          className="text-sm font-medium tabular-nums tracking-tight"
          style={{ color: settings.textColor }}
        >
          {weather.temp}°
        </span>
      </div>

      <span className="opacity-25" style={{ color: settings.accentColor }}>
        |
      </span>

      <div className="flex items-center gap-2.5" style={{ color: settings.accentColor }}>
        <span className="capitalize font-normal" style={{ color: settings.textColor, opacity: 0.8 }}>
          {weather.condition}
        </span>

        <span className="hidden xs:inline-flex items-center gap-1 tabular-nums opacity-80">
          <Droplets className="w-3 h-3" />
          {weather.humidity}%
        </span>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:inline-flex items-center gap-2.5 overflow-hidden whitespace-nowrap"
            >
              {weather.feelsLike != null && (
                <span className="tabular-nums opacity-80">
                  Feels {weather.feelsLike}°
                </span>
              )}
              {weather.high != null && weather.low != null && (
                <span className="tabular-nums opacity-80">
                  H:{weather.high}° L:{weather.low}°
                </span>
              )}
              {weather.windSpeed != null && (
                <span className="inline-flex items-center gap-1 tabular-nums opacity-80">
                  <Wind className="w-3 h-3" />
                  {weather.windSpeed}km/h
                </span>
              )}
            </motion.span>
          )}
        </AnimatePresence>

        <span className="inline-flex items-center gap-1 opacity-80">
          <MapPin className="w-3 h-3 opacity-70" />
          {weather.city}
        </span>
      </div>
    </motion.button>
  );
}

export default Weather;
