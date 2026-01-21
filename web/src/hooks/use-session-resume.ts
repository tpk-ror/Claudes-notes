// React hook for session resume functionality
// Manages CLI session ID storage for resuming conversations with --resume flag

import { useCallback } from 'react';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';
import type { Session } from '../store/types';

export interface UseSessionResumeReturn {
  /**
   * Get the CLI session ID for a session, if available
   * This ID is used with the --resume flag when continuing a conversation
   */
  getCliSessionId: (sessionId: string) => string | undefined;

  /**
   * Set the CLI session ID for a session
   * Called when receiving a system.init event from the CLI
   */
  setCliSessionId: (sessionId: string, cliSessionId: string) => Promise<void>;

  /**
   * Check if a session can be resumed (has a CLI session ID)
   */
  canResumeSession: (sessionId: string) => boolean;

  /**
   * Get the current session's CLI session ID for resuming
   */
  getCurrentSessionCliId: () => string | undefined;
}

/**
 * Hook that provides session resume functionality
 *
 * This hook:
 * - Stores CLI session IDs from system.init events
 * - Provides methods to check if sessions can be resumed
 * - Synchronizes CLI session IDs with the database
 */
export function useSessionResume(): UseSessionResumeReturn {
  const sessions = useSessionStore((state) => state.sessions);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const storeUpdateSession = useSessionStore((state) => state.updateSession);

  /**
   * Get the CLI session ID for a session
   */
  const getCliSessionId = useCallback(
    (sessionId: string): string | undefined => {
      const session = sessions.find((s) => s.id === sessionId);
      return session?.cliSessionId;
    },
    [sessions]
  );

  /**
   * Set the CLI session ID for a session
   * Updates both the store and the database
   */
  const setCliSessionId = useCallback(
    async (sessionId: string, cliSessionId: string): Promise<void> => {
      // Update the store
      storeUpdateSession(sessionId, { cliSessionId });

      // Persist to the database
      try {
        await sessionApi.setCliSessionId(sessionId, cliSessionId);
      } catch (err) {
        console.error('Failed to persist CLI session ID:', err);
        // Note: We don't throw here because the store was already updated
        // The next session load will overwrite with the database value
      }
    },
    [storeUpdateSession]
  );

  /**
   * Check if a session can be resumed
   */
  const canResumeSession = useCallback(
    (sessionId: string): boolean => {
      const cliSessionId = getCliSessionId(sessionId);
      return cliSessionId !== undefined && cliSessionId.length > 0;
    },
    [getCliSessionId]
  );

  /**
   * Get the current session's CLI session ID
   */
  const getCurrentSessionCliId = useCallback((): string | undefined => {
    if (!currentSessionId) {
      return undefined;
    }
    return getCliSessionId(currentSessionId);
  }, [currentSessionId, getCliSessionId]);

  return {
    getCliSessionId,
    setCliSessionId,
    canResumeSession,
    getCurrentSessionCliId,
  };
}
