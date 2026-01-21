// React hook for session persistence
// Synchronizes session data between the Zustand store and the database via API

import { useCallback, useEffect, useState } from 'react';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';
import type { Session } from '../store/types';

export interface UseSessionPersistenceOptions {
  autoLoad?: boolean;
}

export interface UseSessionPersistenceReturn {
  loading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  createSession: (session: {
    id: string;
    slug: string;
    projectPath: string;
    model?: string;
  }) => Promise<Session>;
  updateSession: (
    sessionId: string,
    updates: Partial<Pick<Session, 'slug' | 'model' | 'lastActiveAt' | 'messageCount' | 'totalCostUsd' | 'cliSessionId'>>
  ) => Promise<void>;
  touchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

/**
 * Hook that provides session persistence with database synchronization
 *
 * This hook:
 * - Loads sessions from the database on mount (if autoLoad is true)
 * - Provides methods that update both the store and the database
 * - Handles loading and error states
 */
export function useSessionPersistence(
  options: UseSessionPersistenceOptions = {}
): UseSessionPersistenceReturn {
  const { autoLoad = true } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeSetSessions = useSessionStore((state) => state.setSessions);
  const storeAddSession = useSessionStore((state) => state.addSession);
  const storeUpdateSession = useSessionStore((state) => state.updateSession);
  const storeRemoveSession = useSessionStore((state) => state.removeSession);
  const storeCurrentSessionId = useSessionStore((state) => state.currentSessionId);
  const storeSetCurrentSession = useSessionStore((state) => state.setCurrentSession);

  /**
   * Load sessions from the database and update the store
   */
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sessions = await sessionApi.fetchAllSessions();
      storeSetSessions(sessions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [storeSetSessions]);

  /**
   * Create a new session in both the database and store
   */
  const createSession = useCallback(
    async (session: {
      id: string;
      slug: string;
      projectPath: string;
      model?: string;
    }): Promise<Session> => {
      setError(null);

      try {
        const createdSession = await sessionApi.createSession(session);
        storeAddSession(createdSession);
        return createdSession;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create session';
        setError(message);
        throw err;
      }
    },
    [storeAddSession]
  );

  /**
   * Update a session in both the database and store
   */
  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: Partial<Pick<Session, 'slug' | 'model' | 'lastActiveAt' | 'messageCount' | 'totalCostUsd' | 'cliSessionId'>>
    ): Promise<void> => {
      setError(null);

      try {
        const updatedSession = await sessionApi.updateSession(sessionId, updates);
        storeUpdateSession(sessionId, updatedSession);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update session';
        setError(message);
        throw err;
      }
    },
    [storeUpdateSession]
  );

  /**
   * Touch a session (update lastActiveAt) in both the database and store
   */
  const touchSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setError(null);

      try {
        const updatedSession = await sessionApi.touchSession(sessionId);
        storeUpdateSession(sessionId, { lastActiveAt: updatedSession.lastActiveAt });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to touch session';
        setError(message);
        throw err;
      }
    },
    [storeUpdateSession]
  );

  /**
   * Delete a session from both the database and store
   */
  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setError(null);

      try {
        await sessionApi.deleteSession(sessionId);
        storeRemoveSession(sessionId);

        // If we deleted the current session, clear the selection
        if (storeCurrentSessionId === sessionId) {
          storeSetCurrentSession(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete session';
        setError(message);
        throw err;
      }
    },
    [storeRemoveSession, storeCurrentSessionId, storeSetCurrentSession]
  );

  // Auto-load sessions on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadSessions();
    }
  }, [autoLoad, loadSessions]);

  return {
    loading,
    error,
    loadSessions,
    createSession,
    updateSession,
    touchSession,
    deleteSession,
  };
}
