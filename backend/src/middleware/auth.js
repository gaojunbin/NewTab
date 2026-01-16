import crypto from 'crypto';

// Simple token storage (in production, use Redis or database)
const validTokens = new Set();

// Token expiry time (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

// Generate a new auth token
export function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);

  // Auto-expire token
  setTimeout(() => {
    validTokens.delete(token);
  }, TOKEN_EXPIRY);

  return token;
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
  if (!validTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  next();
}
