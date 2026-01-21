import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sessionApi from './session-api';
import type { Session } from '../store/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Session API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSession: Session = {
    id: 'session-1',
    slug: 'test-session',
    projectPath: '/path/to/project',
    model: 'claude-3-opus',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    lastActiveAt: new Date('2024-01-02T00:00:00.000Z'),
    messageCount: 10,
    totalCostUsd: '1.50',
  };

  describe('fetchAllSessions', () => {
    it('should fetch all sessions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              ...mockSession,
              createdAt: '2024-01-01T00:00:00.000Z',
              lastActiveAt: '2024-01-02T00:00:00.000Z',
            },
          ],
        }),
      });

      const sessions = await sessionApi.fetchAllSessions();

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].createdAt).toBeInstanceOf(Date);
      expect(sessions[0].lastActiveAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(sessionApi.fetchAllSessions()).rejects.toThrow('Server error');
    });

    it('should return empty array when no sessions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const sessions = await sessionApi.fetchAllSessions();

      expect(sessions).toEqual([]);
    });
  });

  describe('fetchSessionById', () => {
    it('should fetch a session by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.fetchSessionById('session-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1');
      expect(session.id).toBe('session-1');
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Session not found' }),
      });

      await expect(sessionApi.fetchSessionById('session-1')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should URL encode session ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            id: 'session with spaces',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      await sessionApi.fetchSessionById('session with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions/session%20with%20spaces'
      );
    });
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.createSession({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
        }),
      });
      expect(session.id).toBe('session-1');
    });

    it('should create a session with custom model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            model: 'claude-opus-4-5',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      await sessionApi.createSession({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-opus-4-5',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-opus-4-5',
        }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create session' }),
      });

      await expect(
        sessionApi.createSession({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
        })
      ).rejects.toThrow('Failed to create session');
    });
  });

  describe('updateSession', () => {
    it('should update session fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            slug: 'updated-slug',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.updateSession('session-1', {
        slug: 'updated-slug',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: 'updated-slug' }),
      });
      expect(session.slug).toBe('updated-slug');
    });

    it('should update multiple fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            messageCount: 20,
            totalCostUsd: '2.50',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      await sessionApi.updateSession('session-1', {
        messageCount: 20,
        totalCostUsd: '2.50',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageCount: 20, totalCostUsd: '2.50' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update session' }),
      });

      await expect(
        sessionApi.updateSession('session-1', { slug: 'new-slug' })
      ).rejects.toThrow('Failed to update session');
    });
  });

  describe('touchSession', () => {
    it('should touch a session', async () => {
      const newLastActiveAt = '2024-01-03T00:00:00.000Z';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            lastActiveAt: newLastActiveAt,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.touchSession('session-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ touch: true }),
      });
      expect(session.lastActiveAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to touch session' }),
      });

      await expect(sessionApi.touchSession('session-1')).rejects.toThrow(
        'Failed to touch session'
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const success = await sessionApi.deleteSession('session-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'DELETE',
      });
      expect(success).toBe(true);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete session' }),
      });

      await expect(sessionApi.deleteSession('session-1')).rejects.toThrow(
        'Failed to delete session'
      );
    });
  });

  describe('date parsing', () => {
    it('should parse createdAt date string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            createdAt: '2024-06-15T12:30:00.000Z',
            lastActiveAt: '2024-06-16T08:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.fetchSessionById('session-1');

      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.createdAt.toISOString()).toBe('2024-06-15T12:30:00.000Z');
    });

    it('should parse lastActiveAt date string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            createdAt: '2024-06-15T12:30:00.000Z',
            lastActiveAt: '2024-06-16T08:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.fetchSessionById('session-1');

      expect(session.lastActiveAt).toBeInstanceOf(Date);
      expect(session.lastActiveAt.toISOString()).toBe('2024-06-16T08:00:00.000Z');
    });
  });

  describe('setCliSessionId', () => {
    it('should set CLI session ID for a session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            cliSessionId: 'cli-session-abc123',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.setCliSessionId('session-1', 'cli-session-abc123');

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cliSessionId: 'cli-session-abc123' }),
      });
      expect(session.cliSessionId).toBe('cli-session-abc123');
    });

    it('should URL encode session ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            id: 'session with spaces',
            cliSessionId: 'cli-session-encoded',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      await sessionApi.setCliSessionId('session with spaces', 'cli-session-encoded');

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session%20with%20spaces', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cliSessionId: 'cli-session-encoded' }),
      });
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to set CLI session ID' }),
      });

      await expect(
        sessionApi.setCliSessionId('session-1', 'cli-session-fail')
      ).rejects.toThrow('Failed to set CLI session ID');
    });
  });

  describe('updateSession with cliSessionId', () => {
    it('should update cliSessionId field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            cliSessionId: 'updated-cli-session',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      const session = await sessionApi.updateSession('session-1', {
        cliSessionId: 'updated-cli-session',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cliSessionId: 'updated-cli-session' }),
      });
      expect(session.cliSessionId).toBe('updated-cli-session');
    });

    it('should update cliSessionId with other fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            ...mockSession,
            slug: 'new-slug',
            cliSessionId: 'new-cli-session',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-01-02T00:00:00.000Z',
          },
        }),
      });

      await sessionApi.updateSession('session-1', {
        slug: 'new-slug',
        cliSessionId: 'new-cli-session',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: 'new-slug', cliSessionId: 'new-cli-session' }),
      });
    });
  });
});
