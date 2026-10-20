import express from 'express';

export const geolocationRouter = express.Router();

// Cache for IP geolocation results (1 hour TTL)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Default fallback location
const DEFAULT_LOCATION = {
  city: 'Singapore',
  country: 'Singapore',
  countryCode: 'SG',
  timezone: 'Asia/Singapore',
  lat: 1.3521,
  lon: 103.8198,
};

// Check if IP is private/local
function isPrivateIP(ip) {
  if (!ip) return true;

  // Localhost and common private ranges
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1') return true;

  const normalized = ip.replace(/^::ffff:/, '');
  if (normalized.startsWith('172.') || normalized.startsWith('192.168.') || normalized.startsWith('10.')) return true;

  // IPv6 local
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;

  return false;
}

// Get client IP from request
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    for (const ip of ips) {
      if (!isPrivateIP(ip)) return ip;
    }
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP && !isPrivateIP(realIP)) return realIP;

  const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;
  return remoteAddr;
}

async function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Fetch geolocation from ip-api.com with ipwho.is fallback
async function fetchGeolocation(ip) {
  try {
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=status,city,country,countryCode,timezone,lat,lon`
      : `http://ip-api.com/json/?fields=status,city,country,countryCode,timezone,lat,lon`;

    const response = await fetchWithTimeout(url, 3500);
    const data = await response.json();

    if (data.status === 'success' && data.city) {
      return {
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
        timezone: data.timezone,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch {
    // Fallback to ipwho.is below
  }

  try {
    const fallbackUrl = ip ? `https://ipwho.is/${ip}` : `https://ipwho.is/`;
    const response = await fetchWithTimeout(fallbackUrl, 3500);
    const data = await response.json();
    if (data.success && data.city) {
      return {
        city: data.city,
        country: data.country,
        countryCode: data.country_code,
        timezone: data.timezone?.id || 'Asia/Singapore',
        lat: data.latitude,
        lon: data.longitude,
      };
    }
  } catch (error) {
    console.error('Geolocation fetch error:', error);
  }

  return null;
}

// GET /api/geolocation
geolocationRouter.get('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const usePrivateFallback = isPrivateIP(clientIP);
    const cacheKey = usePrivateFallback ? 'server-ip' : clientIP;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const location = await fetchGeolocation(usePrivateFallback ? null : clientIP);

    if (location) {
      cache.set(cacheKey, {
        data: location,
        timestamp: Date.now(),
      });

      return res.json(location);
    }

    return res.json(DEFAULT_LOCATION);
  } catch (error) {
    console.error('Geolocation error:', error);
    res.json(DEFAULT_LOCATION);
  }
});
