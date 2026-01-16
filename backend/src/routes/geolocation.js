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
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  // Docker/local development
  if (ip.startsWith('172.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return true;

  // IPv6 local
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;

  return false;
}

// Get client IP from request
function getClientIP(req) {
  // Check common headers (from reverse proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // Return the first non-private IP
    for (const ip of ips) {
      if (!isPrivateIP(ip)) return ip;
    }
  }

  // Other common headers
  const realIP = req.headers['x-real-ip'];
  if (realIP && !isPrivateIP(realIP)) return realIP;

  // Connection remote address
  const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;
  return remoteAddr;
}

// Fetch geolocation from ip-api.com
async function fetchGeolocation(ip) {
  try {
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=status,city,country,countryCode,timezone,lat,lon`
      : `http://ip-api.com/json/?fields=status,city,country,countryCode,timezone,lat,lon`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
        timezone: data.timezone,
        lat: data.lat,
        lon: data.lon,
      };
    }

    return null;
  } catch (error) {
    console.error('Geolocation fetch error:', error);
    return null;
  }
}

// GET /api/geolocation
geolocationRouter.get('/', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    const usePrivateFallback = isPrivateIP(clientIP);

    // For private IPs, try to get location from ip-api without IP (uses their server's outbound IP)
    const cacheKey = usePrivateFallback ? 'server-ip' : clientIP;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Fetch from ip-api.com
    // For private IPs, don't pass IP to let ip-api use their detected IP
    const location = await fetchGeolocation(usePrivateFallback ? null : clientIP);

    if (location) {
      // Cache the result
      cache.set(cacheKey, {
        data: location,
        timestamp: Date.now(),
      });

      return res.json(location);
    }

    // Fallback to default
    return res.json(DEFAULT_LOCATION);
  } catch (error) {
    console.error('Geolocation error:', error);
    res.json(DEFAULT_LOCATION);
  }
});
