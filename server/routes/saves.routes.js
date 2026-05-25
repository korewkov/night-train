import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const savesRouter = Router();
savesRouter.use(requireAuth);

const saveSchema = z.object({
  slot: z.number().int().min(0).max(3), // 0 = autosave, 1-3 = ручные
  storyId: z.string(),
  sceneId: z.string(),
  state: z.record(z.any())
});

savesRouter.get('/', (req, res) => {
  const saves = db.prepare('SELECT slot, story_id, scene_id, state_json, updated_at FROM saves WHERE user_id = ? ORDER BY slot').all(req.user.id);
  res.json({ saves: saves.map(s => ({ ...s, state: JSON.parse(s.state_json), state_json: undefined })) });
});

savesRouter.put('/', (req, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });
  const { slot, storyId, sceneId, state } = parsed.data;

  db.prepare(`
    INSERT INTO saves (user_id, slot, story_id, scene_id, state_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, slot) DO UPDATE SET
      story_id = excluded.story_id,
      scene_id = excluded.scene_id,
      state_json = excluded.state_json,
      updated_at = excluded.updated_at
  `).run(req.user.id, slot, storyId, sceneId, JSON.stringify(state), Date.now());

  res.json({ ok: true });
});

savesRouter.delete('/:slot', (req, res) => {
  const slot = parseInt(req.params.slot, 10);
  db.prepare('DELETE FROM saves WHERE user_id = ? AND slot = ?').run(req.user.id, slot);
  res.json({ ok: true });
});
