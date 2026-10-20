import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/links.json');

export const linksRouter = express.Router();

const readData = () => {
  if (!existsSync(DATA_PATH)) {
    return { bookmarks: [] };
  }
  return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
};

const writeData = (data) => {
  const dir = dirname(DATA_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

// Get all bookmarks
linksRouter.get('/', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read links data' });
  }
});

// Update all bookmarks
linksRouter.put('/', requireAuth, (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.bookmarks)) {
      return res.status(400).json({ error: 'Invalid bookmarks payload' });
    }
    writeData({ bookmarks: data.bookmarks });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update links data' });
  }
});
