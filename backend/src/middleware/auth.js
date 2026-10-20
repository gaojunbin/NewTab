import crypto from 'crypto';

// Simple token storage (in production, use Redis or database)
const validTokens = new Map();

// Token expiry time (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

// Clean up expired tokens periodically
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiresAt] of validTokens.entries()) {
    if (now > expiresAt) {
      validTokens.delete(token);
    }
  }
}

// Generate a new auth token
export function generateToken() {
  cleanupExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.set(token, Date.now() + TOKEN_EXPIRY);

  // Auto-expire token
  setTimeout(() => {
    validTokens.delete(token);
  }, TOKEN_EXPIRY).unref?.();

  return token;
}

// Check if a token is valid
export function isTokenValid(token) {
  const editPassword = process.env.EDIT_PASSWORD || '';
  if (!editPassword) return true;
  if (!token) return false;
  cleanupExpiredTokens();
  const expiresAt = validTokens.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    validTokens.delete(token);
    return false;
  }
  return true;
}

// Middleware to require authentication
export function requireAuth(req, res, next) {
  // If no password is set, allow all requests
  const editPassword = process.env.EDIT_PASSWORD || '';
  if (!editPassword) {
    return next();
  }

  // Check for Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  if (!isTokenValid(token)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  next();
}
