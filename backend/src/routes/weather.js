import express from 'express';

export const weatherRouter = express.Router();

// Weather cache
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function mapWmoWeather(wmoCode) {
  const code = Number(wmoCode);
  if (code === 0) return { condition: 'Clear Sky', icon: 'sunny' };
  if (code === 1) return { condition: 'Mainly Clear', icon: 'sunny' };
  if (code === 2) return { condition: 'Partly Cloudy', icon: 'cloudy' };
  if (code === 3) return { condition: 'Overcast', icon: 'overcast' };
  if ([45, 48].includes(code)) return { condition: 'Foggy', icon: 'cloudy' };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: 'Light Drizzle', icon: 'rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: 'Rain', icon: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snow', icon: 'snow' };
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', icon: 'thunder' };
  return { condition: 'Partly Cloudy', icon: 'cloudy' };
}

async function fetchFromOpenMeteo(city) {
  const geoRes = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    4000
  );
  if (!geoRes.ok) throw new Error('Geocoding API failed');
  const geoData = await geoRes.json();
  const place = geoData.results?.[0];
  if (!place) throw new Error('City not found');

  const weatherRes = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
    4000
  );
  if (!weatherRes.ok) throw new Error('Forecast API failed');
  const weatherJson = await weatherRes.json();
  const current = weatherJson.current;
  const daily = weatherJson.daily;
  const mapped = mapWmoWeather(current.weather_code);

  return {
    city: place.name || city,
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    condition: mapped.condition,
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    high: daily?.temperature_2m_max?.[0] != null ? Math.round(daily.temperature_2m_max[0]) : undefined,
    low: daily?.temperature_2m_min?.[0] != null ? Math.round(daily.temperature_2m_min[0]) : undefined,
    icon: mapped.icon,
  };
}

async function fetchFromWttr(city) {
  const response = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, 4500);
  if (!response.ok) {
    throw new Error('wttr.in error');
  }
  const data = await response.json();
  const current = data.current_condition[0];
  const today = data.weather?.[0];

  return {
    city: data.nearest_area?.[0]?.areaName?.[0]?.value || city,
    temp: parseInt(current.temp_C, 10),
    feelsLike: parseInt(current.FeelsLikeC, 10),
    condition: current.weatherDesc[0].value,
    humidity: parseInt(current.humidity, 10),
    windSpeed: parseInt(current.windspeedKmph, 10),
    high: today?.maxtempC != null ? parseInt(today.maxtempC, 10) : undefined,
    low: today?.mintempC != null ? parseInt(today.mintempC, 10) : undefined,
    icon: mapWttrIcon(current.weatherCode),
  };
}

// Get weather data
weatherRouter.get('/', async (req, res) => {
  const city = String(req.query.city || 'Singapore').trim() || 'Singapore';

  // Check cache
  const cacheKey = city.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    let weatherData;
    try {
      weatherData = await fetchFromOpenMeteo(city);
    } catch {
      weatherData = await fetchFromWttr(city);
    }

    cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    res.json(weatherData);
  } catch (err) {
    // Return mock data if APIs fail
    const mockData = {
      city,
      temp: 26,
      feelsLike: 28,
      condition: 'Partly Cloudy',
      humidity: 68,
      windSpeed: 12,
      high: 29,
      low: 23,
      icon: 'cloudy',
    };
    res.json(mockData);
  }
});

function mapWttrIcon(code) {
  const codeNum = parseInt(code, 10);
  if (codeNum === 113) return 'sunny';
  if (codeNum === 116) return 'cloudy';
  if ([119, 122].includes(codeNum)) return 'overcast';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 317, 353, 356, 359].includes(codeNum)) return 'rain';
  if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(codeNum)) return 'snow';
  if ([200, 386, 389, 392, 395].includes(codeNum)) return 'thunder';
  return 'cloudy';
}
