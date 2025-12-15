import express from 'express';
import cors from 'cors';
import { appsRouter } from './routes/apps.js';
import { linksRouter } from './routes/links.js';
import { providersRouter } from './routes/providers.js';
import { settingsRouter } from './routes/settings.js';
import { weatherRouter } from './routes/weather.js';
import { searchRouter } from './routes/search.js';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/apps', appsRouter);
app.use('/api/links', linksRouter);
app.use('/api/providers', providersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/search', searchRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
