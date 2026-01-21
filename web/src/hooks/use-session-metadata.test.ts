import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionMetadata } from './use-session-metadata';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';

// Mock the session API
vi.mock('../lib/session-api', () => ({
  updateSession: vi.fn(),
}));

describe('useSessionMetadata', () => {
  const createTestSession = (overrides = {}) => ({
    id: 'session-1',
    slug: 'test-session',
    projectPath: '/path/to/project',
    model: 'claude-sonnet-4-20250514',
    createdAt: new Date(),
    lastActiveAt: new Date(),
    messageCount: 0,
    totalCostUsd: '0.00',
    ...overrides,
  });

  beforeEach(() => {
    // Reset the store before each test
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSessionMetadata', () => {
    it('should return metadata for an existing session', () => {
      useSessionStore.setState({
        sessions: [
          createTestSession({
            model: 'claude-opus-4-5-20251101',
            totalCostUsd: '1.50',
            messageCount: 10,
          }),
        ],
      });

      const { result } = renderHook(() => useSessionMetadata());

      const metadata = result.current.getSessionMetadata('session-1');
      expect(metadata).toEqual({
        model: 'claude-opus-4-5-20251101',
        totalCostUsd: '1.50',
        messageCount: 10,
      });
    });

    it('should return undefined for a non-existent session', () => {
      useSessionStore.setState({
        sessions: [],
      });

      const { result } = renderHook(() => useSessionMetadata());

      expect(result.current.getSessionMetadata('non-existent')).toBeUndefined();
    });

    it('should return default values for a new session', () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const { result } = renderHook(() => useSessionMetadata());

      const metadata = result.current.getSessionMetadata('session-1');
      expect(metadata).toEqual({
        model: 'claude-sonnet-4-20250514',
        totalCostUsd: '0.00',
        messageCount: 0,
      });
    });
  });

  describe('updateModel', () => {
    it('should update the model in the store', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({ model: 'claude-opus-4-5-20251101' })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateModel('session-1', 'claude-opus-4-5-20251101');
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.model).toBe('claude-opus-4-5-20251101');
    });

    it('should call the API to persist the model update', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({ model: 'claude-opus-4-5-20251101' })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateModel('session-1', 'claude-opus-4-5-20251101');
      });

      expect(mockUpdateSession).toHaveBeenCalledWith('session-1', {
        model: 'claude-opus-4-5-20251101',
      });
    });

    it('should not throw when API call fails', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateModel('session-1', 'claude-opus-4-5-20251101');
      });

      // Store should still be updated even if API fails
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.model).toBe('claude-opus-4-5-20251101');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist model update:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateCost', () => {
    it('should update the cost in the store with proper formatting', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({ totalCostUsd: '1.23' })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateCost('session-1', 1.2345);
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.totalCostUsd).toBe('1.23');
    });

    it('should format cost with 2 decimal places', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ totalCostUsd: '5.00' }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateCost('session-1', 5);
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.totalCostUsd).toBe('5.00');
    });

    it('should call the API to persist the cost update', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ totalCostUsd: '2.50' }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateCost('session-1', 2.5);
      });

      expect(mockUpdateSession).toHaveBeenCalledWith('session-1', {
        totalCostUsd: '2.50',
      });
    });

    it('should handle small costs correctly', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ totalCostUsd: '0.01' }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateCost('session-1', 0.005);
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.totalCostUsd).toBe('0.01');
    });

    it('should not throw when API call fails', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateCost('session-1', 3.14);
      });

      // Store should still be updated even if API fails
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.totalCostUsd).toBe('3.14');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist cost update:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('incrementMessageCount', () => {
    it('should increment message count by 1 by default', async () => {
      useSessionStore.setState({
        sessions: [createTestSession({ messageCount: 5 })],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ messageCount: 6 }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('session-1');
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.messageCount).toBe(6);
    });

    it('should increment message count by custom amount', async () => {
      useSessionStore.setState({
        sessions: [createTestSession({ messageCount: 10 })],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ messageCount: 12 }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('session-1', 2);
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.messageCount).toBe(12);
    });

    it('should call the API to persist the message count update', async () => {
      useSessionStore.setState({
        sessions: [createTestSession({ messageCount: 3 })],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ messageCount: 4 }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('session-1');
      });

      expect(mockUpdateSession).toHaveBeenCalledWith('session-1', {
        messageCount: 4,
      });
    });

    it('should not throw when session not found', async () => {
      useSessionStore.setState({
        sessions: [],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('non-existent');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Session not found for message count increment:',
        'non-existent'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not throw when API call fails', async () => {
      useSessionStore.setState({
        sessions: [createTestSession({ messageCount: 5 })],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('session-1');
      });

      // Store should still be updated even if API fails
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.messageCount).toBe(6);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist message count update:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateMetadata', () => {
    it('should update multiple fields at once', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({
          model: 'claude-opus-4-5-20251101',
          totalCostUsd: '5.00',
          messageCount: 15,
        })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateMetadata('session-1', {
          model: 'claude-opus-4-5-20251101',
          totalCostUsd: '5.00',
          messageCount: 15,
        });
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.model).toBe('claude-opus-4-5-20251101');
      expect(session?.totalCostUsd).toBe('5.00');
      expect(session?.messageCount).toBe(15);
    });

    it('should call the API with all metadata fields', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({
          model: 'claude-opus-4-5-20251101',
          totalCostUsd: '2.50',
        })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateMetadata('session-1', {
          model: 'claude-opus-4-5-20251101',
          totalCostUsd: '2.50',
        });
      });

      expect(mockUpdateSession).toHaveBeenCalledWith('session-1', {
        model: 'claude-opus-4-5-20251101',
        totalCostUsd: '2.50',
      });
    });

    it('should update only specified fields', async () => {
      useSessionStore.setState({
        sessions: [
          createTestSession({
            model: 'claude-sonnet-4-20250514',
            totalCostUsd: '1.00',
            messageCount: 5,
          }),
        ],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(
        createTestSession({
          model: 'claude-sonnet-4-20250514',
          totalCostUsd: '2.00',
          messageCount: 5,
        })
      );

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateMetadata('session-1', {
          totalCostUsd: '2.00',
        });
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.model).toBe('claude-sonnet-4-20250514');
      expect(session?.totalCostUsd).toBe('2.00');
      expect(session?.messageCount).toBe(5);
    });

    it('should not throw when API call fails', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.updateMetadata('session-1', {
          model: 'new-model',
        });
      });

      // Store should still be updated even if API fails
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.model).toBe('new-model');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist metadata update:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('reactivity', () => {
    it('should update getSessionMetadata when model changes', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const { result } = renderHook(() => useSessionMetadata());

      expect(result.current.getSessionMetadata('session-1')?.model).toBe(
        'claude-sonnet-4-20250514'
      );

      act(() => {
        useSessionStore.getState().updateSession('session-1', {
          model: 'claude-opus-4-5-20251101',
        });
      });

      await waitFor(() => {
        expect(result.current.getSessionMetadata('session-1')?.model).toBe(
          'claude-opus-4-5-20251101'
        );
      });
    });

    it('should update getSessionMetadata when cost changes', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const { result } = renderHook(() => useSessionMetadata());

      expect(result.current.getSessionMetadata('session-1')?.totalCostUsd).toBe('0.00');

      act(() => {
        useSessionStore.getState().updateSession('session-1', {
          totalCostUsd: '10.50',
        });
      });

      await waitFor(() => {
        expect(result.current.getSessionMetadata('session-1')?.totalCostUsd).toBe('10.50');
      });
    });

    it('should update getSessionMetadata when message count changes', async () => {
      useSessionStore.setState({
        sessions: [createTestSession()],
      });

      const { result } = renderHook(() => useSessionMetadata());

      expect(result.current.getSessionMetadata('session-1')?.messageCount).toBe(0);

      act(() => {
        useSessionStore.getState().updateSession('session-1', {
          messageCount: 25,
        });
      });

      await waitFor(() => {
        expect(result.current.getSessionMetadata('session-1')?.messageCount).toBe(25);
      });
    });
  });

  describe('multiple sessions', () => {
    it('should handle multiple sessions independently', async () => {
      useSessionStore.setState({
        sessions: [
          createTestSession({ id: 'session-1', messageCount: 5 }),
          createTestSession({ id: 'session-2', messageCount: 10 }),
        ],
      });

      const mockUpdateSession = vi.mocked(sessionApi.updateSession);
      mockUpdateSession.mockResolvedValue(createTestSession({ id: 'session-1', messageCount: 6 }));

      const { result } = renderHook(() => useSessionMetadata());

      await act(async () => {
        await result.current.incrementMessageCount('session-1');
      });

      const state = useSessionStore.getState();
      const session1 = state.sessions.find((s) => s.id === 'session-1');
      const session2 = state.sessions.find((s) => s.id === 'session-2');

      expect(session1?.messageCount).toBe(6);
      expect(session2?.messageCount).toBe(10);
    });

    it('should retrieve correct metadata for each session', () => {
      useSessionStore.setState({
        sessions: [
          createTestSession({
            id: 'session-1',
            model: 'model-a',
            totalCostUsd: '1.00',
            messageCount: 5,
          }),
          createTestSession({
            id: 'session-2',
            model: 'model-b',
            totalCostUsd: '2.00',
            messageCount: 10,
          }),
        ],
      });

      const { result } = renderHook(() => useSessionMetadata());

      const metadata1 = result.current.getSessionMetadata('session-1');
      const metadata2 = result.current.getSessionMetadata('session-2');

      expect(metadata1).toEqual({
        model: 'model-a',
        totalCostUsd: '1.00',
        messageCount: 5,
      });

      expect(metadata2).toEqual({
        model: 'model-b',
        totalCostUsd: '2.00',
        messageCount: 10,
      });
    });
  });
});
