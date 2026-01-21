import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './session-store';
import type { Session } from './types';
import { isValidUUID } from '../lib/session-utils';

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  slug: 'test-session',
  projectPath: '/path/to/project',
  model: 'claude-3-opus',
  createdAt: new Date('2026-01-19T10:00:00Z'),
  lastActiveAt: new Date('2026-01-19T10:00:00Z'),
  messageCount: 0,
  totalCostUsd: '0.00',
  ...overrides,
});

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have empty sessions array', () => {
      expect(useSessionStore.getState().sessions).toEqual([]);
    });

    it('should have null currentSessionId', () => {
      expect(useSessionStore.getState().currentSessionId).toBeNull();
    });

    it('should have isLoading as false', () => {
      expect(useSessionStore.getState().isLoading).toBe(false);
    });

    it('should have error as null', () => {
      expect(useSessionStore.getState().error).toBeNull();
    });
  });

  describe('setSessions', () => {
    it('should set sessions array', () => {
      const sessions = [createMockSession(), createMockSession({ id: 'session-2' })];
      useSessionStore.getState().setSessions(sessions);
      expect(useSessionStore.getState().sessions).toEqual(sessions);
    });
  });

  describe('addSession', () => {
    it('should add a session to the array', () => {
      const session = createMockSession();
      useSessionStore.getState().addSession(session);
      expect(useSessionStore.getState().sessions).toContainEqual(session);
    });

    it('should append to existing sessions', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });
      useSessionStore.getState().addSession(session1);
      useSessionStore.getState().addSession(session2);
      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });
  });

  describe('updateSession', () => {
    it('should update a session by id', () => {
      const session = createMockSession();
      useSessionStore.getState().addSession(session);
      useSessionStore.getState().updateSession('session-1', { messageCount: 5 });
      expect(useSessionStore.getState().sessions[0].messageCount).toBe(5);
    });

    it('should not affect other sessions', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2', messageCount: 10 });
      useSessionStore.getState().setSessions([session1, session2]);
      useSessionStore.getState().updateSession('session-1', { messageCount: 5 });
      expect(useSessionStore.getState().sessions[1].messageCount).toBe(10);
    });
  });

  describe('removeSession', () => {
    it('should remove a session by id', () => {
      const session = createMockSession();
      useSessionStore.getState().addSession(session);
      useSessionStore.getState().removeSession('session-1');
      expect(useSessionStore.getState().sessions).toHaveLength(0);
    });

    it('should clear currentSessionId if removed session was current', () => {
      const session = createMockSession();
      useSessionStore.getState().addSession(session);
      useSessionStore.getState().setCurrentSession('session-1');
      useSessionStore.getState().removeSession('session-1');
      expect(useSessionStore.getState().currentSessionId).toBeNull();
    });

    it('should not affect currentSessionId if different session is removed', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });
      useSessionStore.getState().setSessions([session1, session2]);
      useSessionStore.getState().setCurrentSession('session-1');
      useSessionStore.getState().removeSession('session-2');
      expect(useSessionStore.getState().currentSessionId).toBe('session-1');
    });
  });

  describe('setCurrentSession', () => {
    it('should set currentSessionId', () => {
      useSessionStore.getState().setCurrentSession('session-1');
      expect(useSessionStore.getState().currentSessionId).toBe('session-1');
    });

    it('should allow setting to null', () => {
      useSessionStore.getState().setCurrentSession('session-1');
      useSessionStore.getState().setCurrentSession(null);
      expect(useSessionStore.getState().currentSessionId).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', () => {
      const session = createMockSession();
      useSessionStore.getState().addSession(session);
      useSessionStore.getState().setCurrentSession('session-1');
      expect(useSessionStore.getState().getCurrentSession()).toEqual(session);
    });

    it('should return undefined if no current session', () => {
      expect(useSessionStore.getState().getCurrentSession()).toBeUndefined();
    });

    it('should return undefined if currentSessionId does not match any session', () => {
      useSessionStore.getState().setCurrentSession('non-existent');
      expect(useSessionStore.getState().getCurrentSession()).toBeUndefined();
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true', () => {
      useSessionStore.getState().setLoading(true);
      expect(useSessionStore.getState().isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      useSessionStore.getState().setLoading(true);
      useSessionStore.getState().setLoading(false);
      expect(useSessionStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useSessionStore.getState().setError('Something went wrong');
      expect(useSessionStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error with null', () => {
      useSessionStore.getState().setError('Error');
      useSessionStore.getState().setError(null);
      expect(useSessionStore.getState().error).toBeNull();
    });
  });

  describe('createNewSession', () => {
    it('should create a session with valid UUID', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path/to/project',
      });
      expect(isValidUUID(session.id)).toBe(true);
    });

    it('should add the session to sessions array', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path/to/project',
      });
      expect(useSessionStore.getState().sessions).toContainEqual(session);
    });

    it('should set the new session as current', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path/to/project',
      });
      expect(useSessionStore.getState().currentSessionId).toBe(session.id);
    });

    it('should return the created session', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/my/project',
      });
      expect(session.projectPath).toBe('/my/project');
      expect(session.messageCount).toBe(0);
      expect(session.totalCostUsd).toBe('0.00');
    });

    it('should use provided model', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path',
        model: 'claude-3-opus',
      });
      expect(session.model).toBe('claude-3-opus');
    });

    it('should use provided slug', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path',
        slug: 'my-custom-session',
      });
      expect(session.slug).toBe('my-custom-session');
    });

    it('should generate unique IDs for multiple sessions', () => {
      const session1 = useSessionStore.getState().createNewSession({
        projectPath: '/path/1',
      });
      const session2 = useSessionStore.getState().createNewSession({
        projectPath: '/path/2',
      });
      expect(session1.id).not.toBe(session2.id);
      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });

    it('should switch currentSessionId to newest session', () => {
      const session1 = useSessionStore.getState().createNewSession({
        projectPath: '/path/1',
      });
      expect(useSessionStore.getState().currentSessionId).toBe(session1.id);

      const session2 = useSessionStore.getState().createNewSession({
        projectPath: '/path/2',
      });
      expect(useSessionStore.getState().currentSessionId).toBe(session2.id);
    });

    it('should set timestamps on creation', () => {
      const before = new Date();
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path',
      });
      const after = new Date();

      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(session.lastActiveAt.getTime()).toBe(session.createdAt.getTime());
    });

    it('should generate session slug when not provided', () => {
      const session = useSessionStore.getState().createNewSession({
        projectPath: '/path',
      });
      expect(session.slug).toMatch(/^session-\d{8}-\d{6}$/);
    });
  });
});
