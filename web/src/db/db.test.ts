import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { migrate, migrateDatabase } from './migrate';
import * as schema from './schema';
import { createDatabase, closeDatabase, resetDatabase } from './index';

describe('Database Schema', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    // Create in-memory database for testing
    sqlite = migrate({ inMemory: true });
    db = drizzle(sqlite, { schema });
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('sessions table', () => {
    it('should create a session', () => {
      const now = new Date();
      const session: schema.NewSessionRecord = {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
        messageCount: 0,
        totalCostUsd: '0.00',
      };

      db.insert(schema.sessions).values(session).run();

      const result = db.select().from(schema.sessions).where(eq(schema.sessions.id, 'session-1')).get();
      expect(result).toBeDefined();
      expect(result?.slug).toBe('test-session');
      expect(result?.projectPath).toBe('/path/to/project');
      expect(result?.model).toBe('claude-3-opus');
    });

    it('should update session message count', () => {
      const now = new Date();
      db.insert(schema.sessions).values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      }).run();

      db.update(schema.sessions)
        .set({ messageCount: 5 })
        .where(eq(schema.sessions.id, 'session-1'))
        .run();

      const result = db.select().from(schema.sessions).where(eq(schema.sessions.id, 'session-1')).get();
      expect(result?.messageCount).toBe(5);
    });

    it('should delete a session', () => {
      const now = new Date();
      db.insert(schema.sessions).values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      }).run();

      db.delete(schema.sessions).where(eq(schema.sessions.id, 'session-1')).run();

      const result = db.select().from(schema.sessions).where(eq(schema.sessions.id, 'session-1')).get();
      expect(result).toBeUndefined();
    });
  });

  describe('plans table', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions).values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      }).run();
    });

    it('should create a plan', () => {
      const now = new Date();
      const plan: schema.NewPlanRecord = {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        status: 'draft',
        createdAt: now,
      };

      db.insert(schema.plans).values(plan).run();

      const result = db.select().from(schema.plans).where(eq(schema.plans.id, 'plan-1')).get();
      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Plan');
      expect(result?.status).toBe('draft');
    });

    it('should update plan status to approved', () => {
      const now = new Date();
      db.insert(schema.plans).values({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        createdAt: now,
      }).run();

      db.update(schema.plans)
        .set({ status: 'approved', approvedAt: new Date() })
        .where(eq(schema.plans.id, 'plan-1'))
        .run();

      const result = db.select().from(schema.plans).where(eq(schema.plans.id, 'plan-1')).get();
      expect(result?.status).toBe('approved');
      expect(result?.approvedAt).toBeDefined();
    });

    it('should cascade delete plans when session is deleted', () => {
      const now = new Date();
      db.insert(schema.plans).values({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        createdAt: now,
      }).run();

      db.delete(schema.sessions).where(eq(schema.sessions.id, 'session-1')).run();

      const result = db.select().from(schema.plans).where(eq(schema.plans.id, 'plan-1')).get();
      expect(result).toBeUndefined();
    });
  });

  describe('tasks table', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions).values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      }).run();

      db.insert(schema.plans).values({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        createdAt: now,
      }).run();
    });

    it('should create a task', () => {
      const task: schema.NewTaskRecord = {
        id: 'task-1',
        planId: 'plan-1',
        content: 'Implement feature',
        status: 'pending',
        sortOrder: 0,
      };

      db.insert(schema.tasks).values(task).run();

      const result = db.select().from(schema.tasks).where(eq(schema.tasks.id, 'task-1')).get();
      expect(result).toBeDefined();
      expect(result?.content).toBe('Implement feature');
      expect(result?.status).toBe('pending');
    });

    it('should create a nested task with parentId', () => {
      db.insert(schema.tasks).values({
        id: 'task-1',
        planId: 'plan-1',
        content: 'Parent task',
        sortOrder: 0,
      }).run();

      db.insert(schema.tasks).values({
        id: 'task-2',
        planId: 'plan-1',
        parentId: 'task-1',
        content: 'Child task',
        sortOrder: 0,
      }).run();

      const result = db.select().from(schema.tasks).where(eq(schema.tasks.id, 'task-2')).get();
      expect(result?.parentId).toBe('task-1');
    });

    it('should update task status', () => {
      db.insert(schema.tasks).values({
        id: 'task-1',
        planId: 'plan-1',
        content: 'Implement feature',
        sortOrder: 0,
      }).run();

      db.update(schema.tasks)
        .set({ status: 'completed' })
        .where(eq(schema.tasks.id, 'task-1'))
        .run();

      const result = db.select().from(schema.tasks).where(eq(schema.tasks.id, 'task-1')).get();
      expect(result?.status).toBe('completed');
    });

    it('should cascade delete tasks when plan is deleted', () => {
      db.insert(schema.tasks).values({
        id: 'task-1',
        planId: 'plan-1',
        content: 'Implement feature',
        sortOrder: 0,
      }).run();

      db.delete(schema.plans).where(eq(schema.plans.id, 'plan-1')).run();

      const result = db.select().from(schema.tasks).where(eq(schema.tasks.id, 'task-1')).get();
      expect(result).toBeUndefined();
    });
  });

  describe('messages table', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions).values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      }).run();
    });

    it('should create a user message', () => {
      const now = new Date();
      const message: schema.NewMessageRecord = {
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'user',
        content: 'Hello, Claude!',
        timestamp: now,
      };

      db.insert(schema.messages).values(message).run();

      const result = db.select().from(schema.messages).where(eq(schema.messages.id, 'msg-1')).get();
      expect(result).toBeDefined();
      expect(result?.role).toBe('user');
      expect(result?.content).toBe('Hello, Claude!');
    });

    it('should create an assistant message with tool calls', () => {
      const now = new Date();
      const toolCalls = [{ id: 'tc-1', name: 'read_file', arguments: { path: '/test.txt' }, result: 'content' }];

      db.insert(schema.messages).values({
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        content: 'I will read that file.',
        toolCalls: toolCalls,
        timestamp: now,
      }).run();

      const result = db.select().from(schema.messages).where(eq(schema.messages.id, 'msg-1')).get();
      expect(result?.toolCalls).toEqual(toolCalls);
    });

    it('should create an assistant message with thinking blocks', () => {
      const now = new Date();
      const thinkingBlocks = [{ id: 'tb-1', content: 'Let me think about this...' }];

      db.insert(schema.messages).values({
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'assistant',
        content: 'Here is my response.',
        thinkingBlocks: thinkingBlocks,
        timestamp: now,
      }).run();

      const result = db.select().from(schema.messages).where(eq(schema.messages.id, 'msg-1')).get();
      expect(result?.thinkingBlocks).toEqual(thinkingBlocks);
    });

    it('should cascade delete messages when session is deleted', () => {
      const now = new Date();
      db.insert(schema.messages).values({
        id: 'msg-1',
        sessionId: 'session-1',
        role: 'user',
        content: 'Hello!',
        timestamp: now,
      }).run();

      db.delete(schema.sessions).where(eq(schema.sessions.id, 'session-1')).run();

      const result = db.select().from(schema.messages).where(eq(schema.messages.id, 'msg-1')).get();
      expect(result).toBeUndefined();
    });
  });
});

describe('Database Migration', () => {
  it('should create all tables with migrate function', () => {
    const sqlite = migrate({ inMemory: true });

    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('plans');
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('messages');

    sqlite.close();
  });

  it('should create indexes', () => {
    const sqlite = migrate({ inMemory: true });

    const indexes = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const indexNames = indexes.map((i) => i.name);
    expect(indexNames).toContain('idx_plans_session_id');
    expect(indexNames).toContain('idx_tasks_plan_id');
    expect(indexNames).toContain('idx_messages_session_id');
    expect(indexNames).toContain('idx_sessions_last_active');

    sqlite.close();
  });

  it('should enable foreign keys', () => {
    const sqlite = migrate({ inMemory: true });

    const result = sqlite.pragma('foreign_keys') as { foreign_keys: number }[];
    expect(result[0].foreign_keys).toBe(1);

    sqlite.close();
  });

  it('should run migrateDatabase on existing connection', () => {
    const sqlite = new Database(':memory:');
    migrateDatabase(sqlite);

    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    expect(tables.length).toBe(4);
    sqlite.close();
  });
});

describe('Database Connection', () => {
  afterEach(() => {
    resetDatabase();
  });

  it('should create an in-memory database', () => {
    const { db, sqlite } = createDatabase({ inMemory: true });
    expect(db).toBeDefined();
    expect(sqlite).toBeDefined();
    sqlite.close();
  });

  it('should enable foreign keys on new connection', () => {
    const { sqlite } = createDatabase({ inMemory: true });

    const result = sqlite.pragma('foreign_keys') as { foreign_keys: number }[];
    expect(result[0].foreign_keys).toBe(1);

    sqlite.close();
  });
});
