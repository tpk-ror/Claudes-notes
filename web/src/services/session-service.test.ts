import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from '../db/migrate';
import * as schema from '../db/schema';
import * as sessionService from './session-service';

describe('Session Service', () => {
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

  describe('sessionRecordToSession', () => {
    it('should convert a session record to a Session type', () => {
      const now = new Date();
      const lastActive = new Date(now.getTime() + 1000);
      const record: schema.SessionRecord = {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: lastActive,
        messageCount: 10,
        totalCostUsd: '1.50',
      };

      const session = sessionService.sessionRecordToSession(record);

      expect(session.id).toBe('session-1');
      expect(session.slug).toBe('test-session');
      expect(session.projectPath).toBe('/path/to/project');
      expect(session.model).toBe('claude-3-opus');
      expect(session.createdAt).toEqual(now);
      expect(session.lastActiveAt).toEqual(lastActive);
      expect(session.messageCount).toBe(10);
      expect(session.totalCostUsd).toBe('1.50');
    });
  });

  describe('createSession', () => {
    it('should create a session in the database', () => {
      const session = sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
      });

      expect(session.id).toBe('session-1');
      expect(session.slug).toBe('test-session');
      expect(session.projectPath).toBe('/path/to/project');
      expect(session.model).toBe('claude-sonnet-4-20250514');
      expect(session.messageCount).toBe(0);
      expect(session.totalCostUsd).toBe('0.00');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastActiveAt).toBeInstanceOf(Date);
    });

    it('should create a session with custom model', () => {
      const session = sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-opus-4-5',
      });

      expect(session.model).toBe('claude-opus-4-5');
    });

    it('should create a session with custom message count and cost', () => {
      const session = sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        messageCount: 5,
        totalCostUsd: '0.50',
      });

      expect(session.messageCount).toBe(5);
      expect(session.totalCostUsd).toBe('0.50');
    });

    it('should persist session to database', () => {
      sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
      });

      const dbSession = db.select().from(schema.sessions).all();
      expect(dbSession).toHaveLength(1);
      expect(dbSession[0].id).toBe('session-1');
    });
  });

  describe('getSessionById', () => {
    it('should return a session by ID', () => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
        })
        .run();

      const session = sessionService.getSessionById(db, 'session-1');

      expect(session).toBeDefined();
      expect(session?.id).toBe('session-1');
      expect(session?.slug).toBe('test-session');
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionService.getSessionById(db, 'non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions ordered by lastActiveAt descending', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 10000);
      const later = new Date(now.getTime() + 10000);

      db.insert(schema.sessions)
        .values([
          {
            id: 'session-1',
            slug: 'session-1',
            projectPath: '/path/1',
            model: 'claude-3-opus',
            createdAt: now,
            lastActiveAt: earlier,
          },
          {
            id: 'session-2',
            slug: 'session-2',
            projectPath: '/path/2',
            model: 'claude-3-opus',
            createdAt: now,
            lastActiveAt: later,
          },
          {
            id: 'session-3',
            slug: 'session-3',
            projectPath: '/path/3',
            model: 'claude-3-opus',
            createdAt: now,
            lastActiveAt: now,
          },
        ])
        .run();

      const sessions = sessionService.getAllSessions(db);

      expect(sessions).toHaveLength(3);
      expect(sessions[0].id).toBe('session-2'); // Most recent
      expect(sessions[1].id).toBe('session-3');
      expect(sessions[2].id).toBe('session-1'); // Oldest
    });

    it('should return empty array when no sessions exist', () => {
      const sessions = sessionService.getAllSessions(db);
      expect(sessions).toEqual([]);
    });
  });

  describe('updateSession', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
          messageCount: 0,
          totalCostUsd: '0.00',
        })
        .run();
    });

    it('should update session slug', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        slug: 'updated-slug',
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.slug).toBe('updated-slug');
    });

    it('should update session model', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        model: 'claude-opus-4-5',
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.model).toBe('claude-opus-4-5');
    });

    it('should update session messageCount', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        messageCount: 15,
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.messageCount).toBe(15);
    });

    it('should update session totalCostUsd', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        totalCostUsd: '2.50',
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.totalCostUsd).toBe('2.50');
    });

    it('should update multiple fields at once', () => {
      const newLastActiveAt = new Date();
      const success = sessionService.updateSession(db, 'session-1', {
        slug: 'updated-slug',
        messageCount: 20,
        lastActiveAt: newLastActiveAt,
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.slug).toBe('updated-slug');
      expect(session?.messageCount).toBe(20);
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.updateSession(db, 'non-existent', {
        slug: 'new-slug',
      });
      expect(success).toBe(false);
    });

    it('should return false when no updates provided', () => {
      const success = sessionService.updateSession(db, 'session-1', {});
      expect(success).toBe(false);
    });
  });

  describe('touchSession', () => {
    beforeEach(() => {
      const now = new Date(Date.now() - 60000); // 1 minute ago
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
        })
        .run();
    });

    it('should update lastActiveAt to now', () => {
      const beforeTouch = sessionService.getSessionById(db, 'session-1');
      const oldLastActiveAt = beforeTouch?.lastActiveAt;

      const success = sessionService.touchSession(db, 'session-1');

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.lastActiveAt.getTime()).toBeGreaterThan(
        oldLastActiveAt!.getTime()
      );
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.touchSession(db, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('deleteSession', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
        })
        .run();
    });

    it('should delete a session', () => {
      const success = sessionService.deleteSession(db, 'session-1');

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.deleteSession(db, 'non-existent');
      expect(success).toBe(false);
    });

    it('should cascade delete related plans', () => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan',
          createdAt: now,
        })
        .run();

      sessionService.deleteSession(db, 'session-1');

      const plans = db.select().from(schema.plans).all();
      expect(plans).toHaveLength(0);
    });

    it('should cascade delete related messages', () => {
      const now = new Date();
      db.insert(schema.messages)
        .values({
          id: 'message-1',
          sessionId: 'session-1',
          role: 'user',
          content: 'Hello',
          timestamp: now,
        })
        .run();

      sessionService.deleteSession(db, 'session-1');

      const messages = db.select().from(schema.messages).all();
      expect(messages).toHaveLength(0);
    });
  });

  describe('incrementMessageCount', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
          messageCount: 5,
        })
        .run();
    });

    it('should increment message count by 1 by default', () => {
      const success = sessionService.incrementMessageCount(db, 'session-1');

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.messageCount).toBe(6);
    });

    it('should increment message count by specified amount', () => {
      const success = sessionService.incrementMessageCount(db, 'session-1', 3);

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.messageCount).toBe(8);
    });

    it('should also update lastActiveAt', () => {
      const beforeIncrement = sessionService.getSessionById(db, 'session-1');
      const oldLastActiveAt = beforeIncrement?.lastActiveAt;

      // Wait a small amount to ensure time difference
      sessionService.incrementMessageCount(db, 'session-1');

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        oldLastActiveAt!.getTime()
      );
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.incrementMessageCount(db, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('updateSessionCost', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
          totalCostUsd: '0.00',
        })
        .run();
    });

    it('should update total cost', () => {
      const success = sessionService.updateSessionCost(db, 'session-1', '3.75');

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.totalCostUsd).toBe('3.75');
    });

    it('should also update lastActiveAt', () => {
      const beforeUpdate = sessionService.getSessionById(db, 'session-1');
      const oldLastActiveAt = beforeUpdate?.lastActiveAt;

      sessionService.updateSessionCost(db, 'session-1', '1.00');

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        oldLastActiveAt!.getTime()
      );
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.updateSessionCost(db, 'non-existent', '1.00');
      expect(success).toBe(false);
    });
  });

  describe('sessionRecordToSession with cliSessionId', () => {
    it('should convert cliSessionId from null to undefined', () => {
      const now = new Date();
      const record: schema.SessionRecord = {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
        messageCount: 0,
        totalCostUsd: '0.00',
        cliSessionId: null,
      };

      const session = sessionService.sessionRecordToSession(record);
      expect(session.cliSessionId).toBeUndefined();
    });

    it('should preserve cliSessionId when present', () => {
      const now = new Date();
      const record: schema.SessionRecord = {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
        messageCount: 0,
        totalCostUsd: '0.00',
        cliSessionId: 'cli-session-abc123',
      };

      const session = sessionService.sessionRecordToSession(record);
      expect(session.cliSessionId).toBe('cli-session-abc123');
    });
  });

  describe('createSession with cliSessionId', () => {
    it('should create a session with cliSessionId', () => {
      const session = sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        cliSessionId: 'cli-session-xyz789',
      });

      expect(session.cliSessionId).toBe('cli-session-xyz789');
    });

    it('should create a session without cliSessionId', () => {
      const session = sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
      });

      expect(session.cliSessionId).toBeUndefined();
    });

    it('should persist cliSessionId to database', () => {
      sessionService.createSession(db, {
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        cliSessionId: 'cli-session-persist',
      });

      const dbSession = db.select().from(schema.sessions).all();
      expect(dbSession[0].cliSessionId).toBe('cli-session-persist');
    });
  });

  describe('updateSession with cliSessionId', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
        })
        .run();
    });

    it('should update cliSessionId', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        cliSessionId: 'new-cli-session-id',
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.cliSessionId).toBe('new-cli-session-id');
    });

    it('should update cliSessionId along with other fields', () => {
      const success = sessionService.updateSession(db, 'session-1', {
        slug: 'updated-slug',
        cliSessionId: 'cli-session-combined',
      });

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.slug).toBe('updated-slug');
      expect(session?.cliSessionId).toBe('cli-session-combined');
    });
  });

  describe('setCliSessionId', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
        })
        .run();
    });

    it('should set CLI session ID for a session', () => {
      const success = sessionService.setCliSessionId(db, 'session-1', 'cli-session-new');

      expect(success).toBe(true);

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.cliSessionId).toBe('cli-session-new');
    });

    it('should update lastActiveAt when setting CLI session ID', () => {
      const beforeSet = sessionService.getSessionById(db, 'session-1');
      const oldLastActiveAt = beforeSet?.lastActiveAt;

      sessionService.setCliSessionId(db, 'session-1', 'cli-session-update');

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        oldLastActiveAt!.getTime()
      );
    });

    it('should return false for non-existent session', () => {
      const success = sessionService.setCliSessionId(db, 'non-existent', 'cli-session-fail');
      expect(success).toBe(false);
    });

    it('should overwrite existing CLI session ID', () => {
      sessionService.setCliSessionId(db, 'session-1', 'first-cli-session');
      sessionService.setCliSessionId(db, 'session-1', 'second-cli-session');

      const session = sessionService.getSessionById(db, 'session-1');
      expect(session?.cliSessionId).toBe('second-cli-session');
    });
  });

  describe('getCliSessionId', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.sessions)
        .values({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
          cliSessionId: 'existing-cli-session',
        })
        .run();

      db.insert(schema.sessions)
        .values({
          id: 'session-2',
          slug: 'test-session-2',
          projectPath: '/path/to/project2',
          model: 'claude-3-opus',
          createdAt: now,
          lastActiveAt: now,
          // No cliSessionId
        })
        .run();
    });

    it('should return CLI session ID for a session', () => {
      const cliSessionId = sessionService.getCliSessionId(db, 'session-1');
      expect(cliSessionId).toBe('existing-cli-session');
    });

    it('should return undefined for session without CLI session ID', () => {
      const cliSessionId = sessionService.getCliSessionId(db, 'session-2');
      expect(cliSessionId).toBeUndefined();
    });

    it('should return undefined for non-existent session', () => {
      const cliSessionId = sessionService.getCliSessionId(db, 'non-existent');
      expect(cliSessionId).toBeUndefined();
    });
  });
});
