import { createClient } from '@libsql/client';
import { AppError } from './http.js';

// Communities are not a table: they come from communities.json, so users.community_id
// is validated in code. Removing a community from the file locks its members out
// without deleting their data.
export const SCHEMA = [
  // Finishing a course lesson marks it complete; checkpoints are optional and teacher-assigned.
  `CREATE TABLE IF NOT EXISTS course_completions (
    user_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (user_id, lesson_id))`,
  // Every checkpoint attempt is kept so lesson accuracy can be analyzed later.
  `CREATE TABLE IF NOT EXISTS checkpoint_attempts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, lesson_id TEXT NOT NULL, assignment_id TEXT,
    mcq_correct INTEGER NOT NULL, mcq_total INTEGER NOT NULL, frq_score INTEGER,
    accuracy INTEGER NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
    response TEXT NOT NULL, grade TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_checkpoint_attempts_user ON checkpoint_attempts(user_id, lesson_id)',
  'CREATE INDEX IF NOT EXISTS idx_checkpoint_attempts_assignment ON checkpoint_attempts(assignment_id, user_id)',
  // Every submitted practice test. Answers are kept so students can review past attempts.
  `CREATE TABLE IF NOT EXISTS practice_attempts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, test_id TEXT NOT NULL, event TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('check','exam')),
    correct INTEGER NOT NULL, total INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    seconds INTEGER NOT NULL, timed_out INTEGER NOT NULL DEFAULT 0, answers TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON practice_attempts(user_id, created_at)',
  // Links a "Lesson checkpoint" assignment to its course lesson (a side table avoids an ALTER migration).
  `CREATE TABLE IF NOT EXISTS assignment_lessons (
    assignment_id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL)`,
  // How an assignment counts as done: finishing it, or reaching a target accuracy. Also links practice tests.
  `CREATE TABLE IF NOT EXISTS assignment_goals (
    assignment_id TEXT PRIMARY KEY,
    goal TEXT NOT NULL DEFAULT 'completion' CHECK (goal IN ('completion','accuracy')),
    target INTEGER CHECK (target BETWEEN 1 AND 100),
    test_id TEXT)`,
  // Teacher-given scores for work Valus cannot grade itself (skills, online submissions, reflections).
  `CREATE TABLE IF NOT EXISTS submission_scores (
    assignment_id TEXT NOT NULL, user_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    scored_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (assignment_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student','instructor')),
    community_id TEXT NOT NULL,
    event TEXT,
    event_selected_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_users_community ON users(community_id, role)',
  `CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    event TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    instructions TEXT NOT NULL DEFAULT '',
    due TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_assignments_community ON assignments(community_id, due)',
  `CREATE TABLE IF NOT EXISTS submissions (
    assignment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (assignment_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id, created_at)',
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (user_id, lesson_id))`,
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, created_at)',
  `CREATE TABLE IF NOT EXISTS enrollment_limits (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    expires_at INTEGER NOT NULL)`,
];

export function createDb(env = process.env) {
  const url = env.TURSO_DATABASE_URL;
  if (!url) throw new AppError(503, 'The Valus database is not configured yet.');
  if (!url.startsWith('file:') && !env.TURSO_AUTH_TOKEN) throw new AppError(503, 'The Valus database is not configured yet.');
  return createClient({ url, authToken: env.TURSO_AUTH_TOKEN });
}

// One schema batch per cold start. Every statement is IF NOT EXISTS, so it is safe to repeat.
const ready = new WeakMap();
export function ensureSchema(db) {
  if (!ready.has(db)) {
    ready.set(db, db.batch(SCHEMA, 'write').catch((error) => {
      ready.delete(db);
      throw error;
    }));
  }
  return ready.get(db);
}

export const rows = (result) => result.rows.map((row) => ({ ...row }));
export const one = (result) => (result.rows[0] ? { ...result.rows[0] } : null);
