// Database connection and client for Claude's Notes
// Uses better-sqlite3 with Drizzle ORM

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Default database path - can be overridden for testing
const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'claude-browser.db');

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

export interface DatabaseOptions {
  dbPath?: string;
  inMemory?: boolean;
}

// Create a new database connection
export function createDatabase(options: DatabaseOptions = {}) {
  const { dbPath = DEFAULT_DB_PATH, inMemory = false } = options;

  // Create the SQLite database instance
  const sqlite = inMemory ? new Database(':memory:') : new Database(dbPath);

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Create Drizzle instance with schema
  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}

// Get or create the singleton database instance
export function getDatabase(options: DatabaseOptions = {}) {
  if (!dbInstance) {
    const { db, sqlite } = createDatabase(options);
    dbInstance = db;
    sqliteInstance = sqlite;
  }
  return dbInstance;
}

// Close the database connection
export function closeDatabase() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}

// Reset the singleton for testing purposes
export function resetDatabase() {
  closeDatabase();
}

// Export schema and types
export * from './schema';
export type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
