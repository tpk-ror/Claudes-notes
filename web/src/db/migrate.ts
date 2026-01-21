// Database migration script for Claude's Notes
// Creates tables based on Drizzle schema

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'claude-browser.db');

// SQL statements to create tables
const CREATE_TABLES_SQL = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  project_path TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  total_cost_usd TEXT NOT NULL DEFAULT '0.00',
  cli_session_id TEXT
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'executed', 'archived')),
  created_at INTEGER NOT NULL,
  approved_at INTEGER
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  parent_id TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls TEXT,
  thinking_blocks TEXT,
  timestamp INTEGER NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plans_session_id ON plans(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at DESC);
`;

export interface MigrateOptions {
  dbPath?: string;
  inMemory?: boolean;
}

// Run migrations on a database
export function migrate(options: MigrateOptions = {}) {
  const { dbPath = DEFAULT_DB_PATH, inMemory = false } = options;

  // Ensure data directory exists (unless in-memory)
  if (!inMemory) {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Create database connection
  const sqlite = inMemory ? new Database(':memory:') : new Database(dbPath);

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Run migration
  sqlite.exec(CREATE_TABLES_SQL);

  // Run incremental migrations for existing databases
  runIncrementalMigrations(sqlite);

  return sqlite;
}

// Run incremental migrations to handle schema changes
function runIncrementalMigrations(sqlite: Database.Database) {
  // Migration: Add cli_session_id column to sessions table
  const hasCliSessionIdColumn = sqlite
    .prepare("SELECT COUNT(*) as count FROM pragma_table_info('sessions') WHERE name = 'cli_session_id'")
    .get() as { count: number };

  if (hasCliSessionIdColumn.count === 0) {
    sqlite.exec('ALTER TABLE sessions ADD COLUMN cli_session_id TEXT');
  }
}

// Run migrations on an existing database instance
export function migrateDatabase(sqlite: Database.Database) {
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_TABLES_SQL);
  runIncrementalMigrations(sqlite);
}

// CLI entry point
if (require.main === module) {
  console.log('Running database migrations...');
  const sqlite = migrate();
  console.log('Migrations complete.');
  sqlite.close();
}
