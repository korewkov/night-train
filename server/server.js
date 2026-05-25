import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import './db.js';
import { authRouter } from './routes/auth.routes.js';
import { savesRouter } from './routes/saves.routes.js';
import { statsRouter } from './routes/stats.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/saves', apiLimiter, savesRouter);
app.use('/api/stats', apiLimiter, statsRouter);

// Раздача статики клиента
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// SPA fallback: всё, что не /api, отдаём index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚂 Night Train server on http://localhost:${PORT}`);
});
