import express from 'express';

export const weatherRouter = express.Router();

// Weather cache
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Get weather data
weatherRouter.get('/', async (req, res) => {
  const { city = 'Singapore' } = req.query;

  // Check cache
  const cacheKey = city.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    // Try wttr.in API (no key required)
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = await response.json();
    const current = data.current_condition[0];

    const weatherData = {
      city: data.nearest_area[0].areaName[0].value,
      temp: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      icon: mapWeatherIcon(current.weatherCode),
    };

    // Cache the result
    cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    res.json(weatherData);
  } catch (err) {
    // Return mock data if API fails
    const mockData = {
      city,
      temp: 28,
      feelsLike: 30,
      condition: 'Partly Cloudy',
      humidity: 75,
      icon: 'cloudy',
    };
    res.json(mockData);
  }
});

function mapWeatherIcon(code) {
  const codeNum = parseInt(code);
  if (codeNum === 113) return 'sunny';
  if (codeNum === 116) return 'cloudy';
  if ([119, 122].includes(codeNum)) return 'overcast';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 317, 353, 356, 359].includes(codeNum)) return 'rain';
  if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(codeNum)) return 'snow';
  if ([200, 386, 389, 392, 395].includes(codeNum)) return 'thunder';
  return 'cloudy';
}
