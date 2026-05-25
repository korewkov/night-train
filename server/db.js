import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DB_PATH || './data/night-train.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL,
    last_login INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL,
    story_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, slot)
  )`,
  `CREATE TABLE IF NOT EXISTS playthroughs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    story_id TEXT NOT NULL,
    ending_type TEXT,
    duration_sec INTEGER,
    choices_json TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    unlocked_at INTEGER NOT NULL,
    UNIQUE(user_id, achievement_key)
  )`,
  `CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_plays INTEGER DEFAULT 0,
    total_time_sec INTEGER DEFAULT 0,
    endings_json TEXT DEFAULT '{}',
    choice_frequency_json TEXT DEFAULT '{}'
  )`,
  `CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_playthroughs_user ON playthroughs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id)`
];

migrations.forEach(sql => db.exec(sql));

console.log(`[db] SQLite ready at ${DB_PATH}`);
