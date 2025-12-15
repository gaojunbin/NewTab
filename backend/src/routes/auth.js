import express from 'express';

export const authRouter = express.Router();

// Verify edit password
authRouter.post('/verify', (req, res) => {
  const { password } = req.body;
  const editPassword = process.env.EDIT_PASSWORD || '';

  // If no password is set, allow access
  if (!editPassword) {
    return res.json({ success: true, message: 'No password required' });
  }

  if (password === editPassword) {
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, message: 'Invalid password' });
});

// Check if password is required
authRouter.get('/required', (req, res) => {
  const editPassword = process.env.EDIT_PASSWORD || '';
  res.json({ required: !!editPassword });
});
