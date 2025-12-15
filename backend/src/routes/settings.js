import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const SETTINGS_PATH = join(DATA_DIR, 'settings.json');

export const settingsRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const ensureDataDir = () => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readSettings = () => {
  ensureDataDir();
  if (!existsSync(SETTINGS_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
};

const writeSettings = (data) => {
  ensureDataDir();
  writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
};

// Get settings
settingsRouter.get('/', (req, res) => {
  try {
    res.json(readSettings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// Update settings
settingsRouter.put('/', (req, res) => {
  try {
    writeSettings(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Export all config
settingsRouter.get('/export', (req, res) => {
  try {
    const apps = existsSync(join(DATA_DIR, 'apps.json'))
      ? JSON.parse(readFileSync(join(DATA_DIR, 'apps.json'), 'utf-8'))
      : { appGroups: [] };
    const links = existsSync(join(DATA_DIR, 'links.json'))
      ? JSON.parse(readFileSync(join(DATA_DIR, 'links.json'), 'utf-8'))
      : { bookmarks: [] };
    const settings = readSettings();

    const exportData = { apps, links, settings, exportedAt: new Date().toISOString() };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=newtab-backup.json');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export config' });
  }
});

// Import config
settingsRouter.post('/import', upload.single('config'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = JSON.parse(req.file.buffer.toString());

    if (data.apps) {
      writeFileSync(join(DATA_DIR, 'apps.json'), JSON.stringify(data.apps, null, 2));
    }
    if (data.links) {
      writeFileSync(join(DATA_DIR, 'links.json'), JSON.stringify(data.links, null, 2));
    }
    if (data.settings) {
      writeSettings(data.settings);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import config' });
  }
});
