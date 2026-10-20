import express from 'express';
import { generateToken, isTokenValid } from '../middleware/auth.js';

export const authRouter = express.Router();

// Verify edit password and return token
authRouter.post('/verify', (req, res) => {
  const { password } = req.body;
  const editPassword = process.env.EDIT_PASSWORD || '';

  // If no password is set, return token directly
  if (!editPassword) {
    const token = generateToken();
    return res.json({ success: true, token, message: 'No password required' });
  }

  if (password === editPassword) {
    const token = generateToken();
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Invalid password' });
});

// Check if password is required and if current token is valid
authRouter.get('/required', (req, res) => {
  const editPassword = process.env.EDIT_PASSWORD || '';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  res.json({
    required: !!editPassword,
    authenticated: isTokenValid(token),
  });
});
