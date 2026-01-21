import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionResume } from './use-session-resume';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';

// Mock the session API
vi.mock('../lib/session-api', () => ({
  setCliSessionId: vi.fn(),
}));

describe('useSessionResume', () => {
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

  describe('getCliSessionId', () => {
    it('should return CLI session ID for a session that has one', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
            cliSessionId: 'cli-abc123',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCliSessionId('session-1')).toBe('cli-abc123');
    });

    it('should return undefined for a session without CLI session ID', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCliSessionId('session-1')).toBeUndefined();
    });

    it('should return undefined for a non-existent session', () => {
      useSessionStore.setState({
        sessions: [],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCliSessionId('non-existent')).toBeUndefined();
    });
  });

  describe('setCliSessionId', () => {
    it('should update the store with the CLI session ID', async () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const mockSetCliSessionId = vi.mocked(sessionApi.setCliSessionId);
      mockSetCliSessionId.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        messageCount: 0,
        totalCostUsd: '0.00',
        cliSessionId: 'new-cli-session',
      });

      const { result } = renderHook(() => useSessionResume());

      await act(async () => {
        await result.current.setCliSessionId('session-1', 'new-cli-session');
      });

      // Check the store was updated
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.cliSessionId).toBe('new-cli-session');
    });

    it('should call the API to persist the CLI session ID', async () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const mockSetCliSessionId = vi.mocked(sessionApi.setCliSessionId);
      mockSetCliSessionId.mockResolvedValue({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        messageCount: 0,
        totalCostUsd: '0.00',
        cliSessionId: 'persisted-cli-session',
      });

      const { result } = renderHook(() => useSessionResume());

      await act(async () => {
        await result.current.setCliSessionId('session-1', 'persisted-cli-session');
      });

      expect(mockSetCliSessionId).toHaveBeenCalledWith('session-1', 'persisted-cli-session');
    });

    it('should not throw when API call fails', async () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const mockSetCliSessionId = vi.mocked(sessionApi.setCliSessionId);
      mockSetCliSessionId.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSessionResume());

      // Should not throw
      await act(async () => {
        await result.current.setCliSessionId('session-1', 'cli-session-error');
      });

      // Store should still be updated even if API fails
      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === 'session-1');
      expect(session?.cliSessionId).toBe('cli-session-error');

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist CLI session ID:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('canResumeSession', () => {
    it('should return true for a session with CLI session ID', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
            cliSessionId: 'cli-session-resumable',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.canResumeSession('session-1')).toBe(true);
    });

    it('should return false for a session without CLI session ID', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.canResumeSession('session-1')).toBe(false);
    });

    it('should return false for a session with empty CLI session ID', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
            cliSessionId: '',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.canResumeSession('session-1')).toBe(false);
    });

    it('should return false for a non-existent session', () => {
      useSessionStore.setState({
        sessions: [],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.canResumeSession('non-existent')).toBe(false);
    });
  });

  describe('getCurrentSessionCliId', () => {
    it('should return CLI session ID for current session', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
            cliSessionId: 'current-cli-session',
          },
        ],
        currentSessionId: 'session-1',
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCurrentSessionCliId()).toBe('current-cli-session');
    });

    it('should return undefined when no current session', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
            cliSessionId: 'cli-session-orphan',
          },
        ],
        currentSessionId: null,
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCurrentSessionCliId()).toBeUndefined();
    });

    it('should return undefined when current session has no CLI session ID', () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
        currentSessionId: 'session-1',
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCurrentSessionCliId()).toBeUndefined();
    });
  });

  describe('reactivity', () => {
    it('should update when sessions change', async () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.getCliSessionId('session-1')).toBeUndefined();

      // Update the store
      act(() => {
        useSessionStore.getState().updateSession('session-1', {
          cliSessionId: 'updated-cli-session',
        });
      });

      await waitFor(() => {
        expect(result.current.getCliSessionId('session-1')).toBe('updated-cli-session');
      });
    });

    it('should update canResumeSession when CLI session ID is set', async () => {
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            slug: 'test-session',
            projectPath: '/path/to/project',
            model: 'claude-3-opus',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
            totalCostUsd: '0.00',
          },
        ],
      });

      const { result } = renderHook(() => useSessionResume());

      expect(result.current.canResumeSession('session-1')).toBe(false);

      // Update the store
      act(() => {
        useSessionStore.getState().updateSession('session-1', {
          cliSessionId: 'resumable-cli-session',
        });
      });

      await waitFor(() => {
        expect(result.current.canResumeSession('session-1')).toBe(true);
      });
    });
  });
});
