import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

const playthroughSchema = z.object({
  storyId: z.string(),
  endingType: z.string(),
  durationSec: z.number().int().min(0),
  choices: z.record(z.any()),
  startedAt: z.number().int()
});

statsRouter.post('/playthrough', (req, res) => {
  const parsed = playthroughSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });
  const { storyId, endingType, durationSec, choices, startedAt } = parsed.data;
  const now = Date.now();

  db.prepare(`
    INSERT INTO playthroughs (user_id, story_id, ending_type, duration_sec, choices_json, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, storyId, endingType, durationSec, JSON.stringify(choices), startedAt, now);

  // Обновляем сводную статистику
  const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(req.user.id) || {};
  const endings = JSON.parse(stats.endings_json || '{}');
  endings[endingType] = (endings[endingType] || 0) + 1;

  db.prepare(`
    UPDATE user_stats SET
      total_plays = total_plays + 1,
      total_time_sec = total_time_sec + ?,
      endings_json = ?
    WHERE user_id = ?
  `).run(durationSec, JSON.stringify(endings), req.user.id);

  res.json({ ok: true });
});

statsRouter.get('/me', (req, res) => {
  const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(req.user.id);
  const recent = db.prepare(`
    SELECT story_id, ending_type, duration_sec, finished_at
    FROM playthroughs WHERE user_id = ? ORDER BY finished_at DESC LIMIT 10
  `).all(req.user.id);
  const achievements = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?').all(req.user.id);

  res.json({
    stats: stats ? { ...stats, endings: JSON.parse(stats.endings_json), endings_json: undefined } : null,
    recent,
    achievements
  });
});

statsRouter.post('/achievement', (req, res) => {
  const { key } = req.body || {};
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key required' });
  try {
    db.prepare('INSERT INTO achievements (user_id, achievement_key, unlocked_at) VALUES (?, ?, ?)').run(req.user.id, key, Date.now());
    res.json({ ok: true, unlocked: true });
  } catch {
    res.json({ ok: true, unlocked: false }); // уже была получена
  }
});

// Лидерборд (опционально)
statsRouter.get('/leaderboard', (req, res) => {
  const rows = db.prepare(`
    SELECT u.username, s.total_plays, s.total_time_sec
    FROM user_stats s JOIN users u ON u.id = s.user_id
    ORDER BY s.total_plays DESC LIMIT 20
  `).all();
  res.json({ leaderboard: rows });
});
