import express from 'express';
import { generateToken } from '../middleware/auth.js';

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

// Check if password is required
authRouter.get('/required', (req, res) => {
  const editPassword = process.env.EDIT_PASSWORD || '';
  res.json({ required: !!editPassword });
});
