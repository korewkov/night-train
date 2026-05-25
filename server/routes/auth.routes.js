import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[\w-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(8)
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  const { username, email, password } = parsed.data;
  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const hash = await hashPassword(password);
  const now = Date.now();
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, created_at, last_login) VALUES (?, ?, ?, ?, ?)'
  ).run(username, email, hash, now, now);

  db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(result.lastInsertRowid);
  const token = signToken({ id: result.lastInsertRowid, username });
  res.json({ token, user: { id: result.lastInsertRowid, username, email } });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  const { login, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Date.now(), user.id);
  const token = signToken({ id: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
});

authRouter.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  // Используем verifyToken внутри обработчика
  import('../auth.js').then(({ verifyToken }) => {
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });
});
