import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../../data/apps.json');

export const appsRouter = express.Router();

const readData = () => {
  if (!existsSync(DATA_PATH)) {
    return { appGroups: [] };
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

// Get all apps
appsRouter.get('/', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read apps data' });
  }
});

// Update all apps
appsRouter.put('/', requireAuth, (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.appGroups)) {
      return res.status(400).json({ error: 'Invalid apps payload' });
    }
    writeData({ appGroups: data.appGroups });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update apps data' });
  }
});

// Add a single app to a group
appsRouter.post('/group/:groupId/app', requireAuth, (req, res) => {
  try {
    const { groupId } = req.params;
    const app = req.body;
    const data = readData();

    const group = data.appGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    app.id = Date.now().toString();
    group.apps.push(app);
    writeData(data);

    res.json({ success: true, app });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add app' });
  }
});

// Delete an app
appsRouter.delete('/group/:groupId/app/:appId', requireAuth, (req, res) => {
  try {
    const { groupId, appId } = req.params;
    const data = readData();

    const group = data.appGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.apps = group.apps.filter(a => a.id !== appId);
    writeData(data);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete app' });
  }
});
