import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/providers.json');

export const providersRouter = express.Router();

// Get all providers
providersRouter.get('/', (req, res) => {
  try {
    if (!existsSync(DATA_PATH)) {
      return res.json({ providers: [] });
    }
    const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read providers data' });
  }
});
