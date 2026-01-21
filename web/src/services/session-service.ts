// Session service for database operations
// Handles CRUD operations for sessions

import { eq, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import type { Session } from '../store/types';

type Database = BetterSQLite3Database<typeof schema>;

/**
 * Convert a database session record to the store Session type
 */
export function sessionRecordToSession(record: schema.SessionRecord): Session {
  return {
    id: record.id,
    slug: record.slug,
    projectPath: record.projectPath,
    model: record.model,
    createdAt: record.createdAt,
    lastActiveAt: record.lastActiveAt,
    messageCount: record.messageCount,
    totalCostUsd: record.totalCostUsd,
    cliSessionId: record.cliSessionId ?? undefined,
  };
}

/**
 * Get all sessions ordered by lastActiveAt descending
 */
export function getAllSessions(db: Database): Session[] {
  const records = db
    .select()
    .from(schema.sessions)
    .orderBy(desc(schema.sessions.lastActiveAt))
    .all();

  return records.map(sessionRecordToSession);
}

/**
 * Get a single session by ID
 */
export function getSessionById(db: Database, sessionId: string): Session | undefined {
  const record = db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .get();

  if (!record) {
    return undefined;
  }

  return sessionRecordToSession(record);
}

/**
 * Create a new session in the database
 */
export function createSession(
  db: Database,
  session: {
    id: string;
    slug: string;
    projectPath: string;
    model?: string;
    messageCount?: number;
    totalCostUsd?: string;
    cliSessionId?: string;
  }
): Session {
  const now = new Date();

  db.insert(schema.sessions)
    .values({
      id: session.id,
      slug: session.slug,
      projectPath: session.projectPath,
      model: session.model ?? 'claude-sonnet-4-20250514',
      createdAt: now,
      lastActiveAt: now,
      messageCount: session.messageCount ?? 0,
      totalCostUsd: session.totalCostUsd ?? '0.00',
      cliSessionId: session.cliSessionId ?? null,
    })
    .run();

  return {
    id: session.id,
    slug: session.slug,
    projectPath: session.projectPath,
    model: session.model ?? 'claude-sonnet-4-20250514',
    createdAt: now,
    lastActiveAt: now,
    messageCount: session.messageCount ?? 0,
    totalCostUsd: session.totalCostUsd ?? '0.00',
    cliSessionId: session.cliSessionId,
  };
}

/**
 * Update a session in the database
 */
export function updateSession(
  db: Database,
  sessionId: string,
  updates: Partial<Pick<Session, 'slug' | 'model' | 'lastActiveAt' | 'messageCount' | 'totalCostUsd' | 'cliSessionId'>>
): boolean {
  const updateValues: Record<string, unknown> = {};

  if (updates.slug !== undefined) {
    updateValues.slug = updates.slug;
  }
  if (updates.model !== undefined) {
    updateValues.model = updates.model;
  }
  if (updates.lastActiveAt !== undefined) {
    updateValues.lastActiveAt = updates.lastActiveAt;
  }
  if (updates.messageCount !== undefined) {
    updateValues.messageCount = updates.messageCount;
  }
  if (updates.totalCostUsd !== undefined) {
    updateValues.totalCostUsd = updates.totalCostUsd;
  }
  if (updates.cliSessionId !== undefined) {
    updateValues.cliSessionId = updates.cliSessionId;
  }

  if (Object.keys(updateValues).length === 0) {
    return false;
  }

  const result = db
    .update(schema.sessions)
    .set(updateValues)
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Update the lastActiveAt timestamp for a session
 */
export function touchSession(db: Database, sessionId: string): boolean {
  const result = db
    .update(schema.sessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Delete a session from the database
 * Note: This will cascade delete related plans, tasks, and messages
 */
export function deleteSession(db: Database, sessionId: string): boolean {
  const result = db
    .delete(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Increment the message count for a session
 */
export function incrementMessageCount(
  db: Database,
  sessionId: string,
  count: number = 1
): boolean {
  const session = getSessionById(db, sessionId);
  if (!session) {
    return false;
  }

  const result = db
    .update(schema.sessions)
    .set({
      messageCount: session.messageCount + count,
      lastActiveAt: new Date(),
    })
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Update the total cost for a session
 */
export function updateSessionCost(
  db: Database,
  sessionId: string,
  totalCostUsd: string
): boolean {
  const result = db
    .update(schema.sessions)
    .set({
      totalCostUsd,
      lastActiveAt: new Date(),
    })
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Set the CLI session ID for a session (used for --resume flag)
 */
export function setCliSessionId(
  db: Database,
  sessionId: string,
  cliSessionId: string
): boolean {
  const result = db
    .update(schema.sessions)
    .set({
      cliSessionId,
      lastActiveAt: new Date(),
    })
    .where(eq(schema.sessions.id, sessionId))
    .run();

  return result.changes > 0;
}

/**
 * Get the CLI session ID for a session
 */
export function getCliSessionId(db: Database, sessionId: string): string | undefined {
  const session = getSessionById(db, sessionId);
  return session?.cliSessionId;
}
