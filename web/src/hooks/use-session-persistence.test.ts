import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionPersistence } from './use-session-persistence';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';
import type { Session } from '../store/types';

// Mock the session API module
vi.mock('../lib/session-api', () => ({
  fetchAllSessions: vi.fn(),
  fetchSessionById: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  touchSession: vi.fn(),
  deleteSession: vi.fn(),
}));

describe('useSessionPersistence', () => {
  const mockSession: Session = {
    id: 'session-1',
    slug: 'test-session',
    projectPath: '/path/to/project',
    model: 'claude-3-opus',
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date('2024-01-02'),
    messageCount: 10,
    totalCostUsd: '1.50',
  };

  beforeEach(() => {
    // Reset the store before each test
    useSessionStore.getState().setSessions([]);
    useSessionStore.getState().setCurrentSession(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state', () => {
      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([]);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should auto-load sessions on mount when autoLoad is true', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([mockSession]);

      renderHook(() => useSessionPersistence({ autoLoad: true }));

      await waitFor(() => {
        expect(sessionApi.fetchAllSessions).toHaveBeenCalled();
      });

      expect(useSessionStore.getState().sessions).toHaveLength(1);
    });

    it('should not auto-load when autoLoad is false', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([]);

      renderHook(() => useSessionPersistence({ autoLoad: false }));

      // Wait a bit to ensure fetch is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(sessionApi.fetchAllSessions).not.toHaveBeenCalled();
    });

    it('should default to autoLoad true', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([]);

      renderHook(() => useSessionPersistence());

      await waitFor(() => {
        expect(sessionApi.fetchAllSessions).toHaveBeenCalled();
      });
    });
  });

  describe('loadSessions', () => {
    it('should load sessions and update store', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([mockSession]);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(useSessionStore.getState().sessions).toEqual([mockSession]);
    });

    it('should set loading state while loading', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      act(() => {
        result.current.loadSessions();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set error state on failure', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error state on successful load', async () => {
      vi.mocked(sessionApi.fetchAllSessions)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBe('Network error');

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBeNull();
    });

    it('should load multiple sessions', async () => {
      const session2: Session = {
        ...mockSession,
        id: 'session-2',
        slug: 'session-two',
      };

      vi.mocked(sessionApi.fetchAllSessions).mockResolvedValueOnce([
        mockSession,
        session2,
      ]);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });
  });

  describe('createSession', () => {
    it('should create session in API and store', async () => {
      vi.mocked(sessionApi.createSession).mockResolvedValueOnce(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      let createdSession: Session | undefined;
      await act(async () => {
        createdSession = await result.current.createSession({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
        });
      });

      expect(sessionApi.createSession).toHaveBeenCalledWith({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
      });
      expect(createdSession).toEqual(mockSession);
      expect(useSessionStore.getState().sessions).toContainEqual(mockSession);
    });

    it('should create session with custom model', async () => {
      const customModelSession = { ...mockSession, model: 'claude-opus-4-5' };
      vi.mocked(sessionApi.createSession).mockResolvedValueOnce(customModelSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.createSession({
          id: 'session-1',
          slug: 'test-session',
          projectPath: '/path/to/project',
          model: 'claude-opus-4-5',
        });
      });

      expect(sessionApi.createSession).toHaveBeenCalledWith({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-opus-4-5',
      });
    });

    it('should set error state on failure', async () => {
      vi.mocked(sessionApi.createSession).mockRejectedValueOnce(
        new Error('Create failed')
      );

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.createSession({
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
          });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Create failed');
    });

    it('should throw error on failure', async () => {
      vi.mocked(sessionApi.createSession).mockRejectedValueOnce(
        new Error('Create failed')
      );

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await expect(
        act(async () => {
          await result.current.createSession({
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
          });
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('updateSession', () => {
    it('should update session in API and store', async () => {
      const updatedSession: Session = {
        ...mockSession,
        slug: 'updated-slug',
      };

      vi.mocked(sessionApi.updateSession).mockResolvedValueOnce(updatedSession);

      // Pre-populate store with the session
      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.updateSession('session-1', { slug: 'updated-slug' });
      });

      expect(sessionApi.updateSession).toHaveBeenCalledWith('session-1', {
        slug: 'updated-slug',
      });

      const storedSession = useSessionStore
        .getState()
        .sessions.find((s) => s.id === 'session-1');
      expect(storedSession?.slug).toBe('updated-slug');
    });

    it('should update multiple fields', async () => {
      const updatedSession: Session = {
        ...mockSession,
        messageCount: 20,
        totalCostUsd: '2.50',
      };

      vi.mocked(sessionApi.updateSession).mockResolvedValueOnce(updatedSession);

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.updateSession('session-1', {
          messageCount: 20,
          totalCostUsd: '2.50',
        });
      });

      expect(sessionApi.updateSession).toHaveBeenCalledWith('session-1', {
        messageCount: 20,
        totalCostUsd: '2.50',
      });
    });

    it('should set error state on failure', async () => {
      vi.mocked(sessionApi.updateSession).mockRejectedValueOnce(
        new Error('Update failed')
      );

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.updateSession('session-1', { slug: 'new-slug' });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('touchSession', () => {
    it('should touch session in API and update store lastActiveAt', async () => {
      const newLastActiveAt = new Date('2024-01-03');
      const touchedSession: Session = {
        ...mockSession,
        lastActiveAt: newLastActiveAt,
      };

      vi.mocked(sessionApi.touchSession).mockResolvedValueOnce(touchedSession);

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.touchSession('session-1');
      });

      expect(sessionApi.touchSession).toHaveBeenCalledWith('session-1');

      const storedSession = useSessionStore
        .getState()
        .sessions.find((s) => s.id === 'session-1');
      expect(storedSession?.lastActiveAt).toEqual(newLastActiveAt);
    });

    it('should set error state on failure', async () => {
      vi.mocked(sessionApi.touchSession).mockRejectedValueOnce(
        new Error('Touch failed')
      );

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.touchSession('session-1');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Touch failed');
    });
  });

  describe('deleteSession', () => {
    it('should delete session in API and store', async () => {
      vi.mocked(sessionApi.deleteSession).mockResolvedValueOnce(true);

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.deleteSession('session-1');
      });

      expect(sessionApi.deleteSession).toHaveBeenCalledWith('session-1');
      expect(useSessionStore.getState().sessions).toHaveLength(0);
    });

    it('should clear current session if deleted session was current', async () => {
      vi.mocked(sessionApi.deleteSession).mockResolvedValueOnce(true);

      useSessionStore.getState().addSession(mockSession);
      useSessionStore.getState().setCurrentSession('session-1');

      expect(useSessionStore.getState().currentSessionId).toBe('session-1');

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.deleteSession('session-1');
      });

      expect(useSessionStore.getState().currentSessionId).toBeNull();
    });

    it('should not clear current session if deleted session was not current', async () => {
      const session2: Session = {
        ...mockSession,
        id: 'session-2',
        slug: 'session-two',
      };

      vi.mocked(sessionApi.deleteSession).mockResolvedValueOnce(true);

      useSessionStore.getState().addSession(mockSession);
      useSessionStore.getState().addSession(session2);
      useSessionStore.getState().setCurrentSession('session-2');

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.deleteSession('session-1');
      });

      expect(useSessionStore.getState().currentSessionId).toBe('session-2');
    });

    it('should set error state on failure', async () => {
      vi.mocked(sessionApi.deleteSession).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      useSessionStore.getState().addSession(mockSession);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.deleteSession('session-1');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Delete failed');
      // Session should still be in store since delete failed
      expect(useSessionStore.getState().sessions).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should clear error on new operation', async () => {
      vi.mocked(sessionApi.fetchAllSessions)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([mockSession]);

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      // First call fails
      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBe('Network error');

      // Second call succeeds, error should be cleared
      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(sessionApi.fetchAllSessions).mockRejectedValueOnce('String error');

      const { result } = renderHook(() =>
        useSessionPersistence({ autoLoad: false })
      );

      await act(async () => {
        await result.current.loadSessions();
      });

      expect(result.current.error).toBe('Failed to load sessions');
    });
  });
});
