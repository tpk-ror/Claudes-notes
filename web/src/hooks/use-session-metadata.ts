// React hook for session metadata management
// Handles updating model, cost, and message count from CLI stream events

import { useCallback } from 'react';
import { useSessionStore } from '../store';
import * as sessionApi from '../lib/session-api';
import type { Session } from '../store/types';

export interface UseSessionMetadataReturn {
  /**
   * Update the model for a session
   * Called when receiving system.init event from CLI
   */
  updateModel: (sessionId: string, model: string) => Promise<void>;

  /**
   * Update the total cost for a session
   * Called when receiving result.success event from CLI with total_cost_usd
   */
  updateCost: (sessionId: string, totalCostUsd: number) => Promise<void>;

  /**
   * Increment the message count for a session
   * Called when a new message is sent or received
   */
  incrementMessageCount: (sessionId: string, count?: number) => Promise<void>;

  /**
   * Update multiple metadata fields at once
   */
  updateMetadata: (
    sessionId: string,
    metadata: Partial<Pick<Session, 'model' | 'totalCostUsd' | 'messageCount'>>
  ) => Promise<void>;

  /**
   * Get the current metadata for a session
   */
  getSessionMetadata: (sessionId: string) => {
    model: string;
    totalCostUsd: string;
    messageCount: number;
  } | undefined;
}

/**
 * Hook that provides session metadata management
 *
 * This hook:
 * - Updates model when receiving system.init events
 * - Updates cost when receiving result.success events
 * - Increments message count when messages are sent/received
 * - Synchronizes metadata with the database
 */
export function useSessionMetadata(): UseSessionMetadataReturn {
  const sessions = useSessionStore((state) => state.sessions);
  const storeUpdateSession = useSessionStore((state) => state.updateSession);

  /**
   * Get the current metadata for a session
   */
  const getSessionMetadata = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        return undefined;
      }
      return {
        model: session.model,
        totalCostUsd: session.totalCostUsd,
        messageCount: session.messageCount,
      };
    },
    [sessions]
  );

  /**
   * Update the model for a session
   */
  const updateModel = useCallback(
    async (sessionId: string, model: string): Promise<void> => {
      // Update the store
      storeUpdateSession(sessionId, { model });

      // Persist to the database
      try {
        await sessionApi.updateSession(sessionId, { model });
      } catch (err) {
        console.error('Failed to persist model update:', err);
      }
    },
    [storeUpdateSession]
  );

  /**
   * Update the total cost for a session
   * Converts number to string with 2 decimal places
   */
  const updateCost = useCallback(
    async (sessionId: string, totalCostUsd: number): Promise<void> => {
      // Format as string with 2 decimal places
      const costString = totalCostUsd.toFixed(2);

      // Update the store
      storeUpdateSession(sessionId, { totalCostUsd: costString });

      // Persist to the database
      try {
        await sessionApi.updateSession(sessionId, { totalCostUsd: costString });
      } catch (err) {
        console.error('Failed to persist cost update:', err);
      }
    },
    [storeUpdateSession]
  );

  /**
   * Increment the message count for a session
   */
  const incrementMessageCount = useCallback(
    async (sessionId: string, count: number = 1): Promise<void> => {
      // Get current count from store
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        console.error('Session not found for message count increment:', sessionId);
        return;
      }

      const newCount = session.messageCount + count;

      // Update the store
      storeUpdateSession(sessionId, { messageCount: newCount });

      // Persist to the database
      try {
        await sessionApi.updateSession(sessionId, { messageCount: newCount });
      } catch (err) {
        console.error('Failed to persist message count update:', err);
      }
    },
    [sessions, storeUpdateSession]
  );

  /**
   * Update multiple metadata fields at once
   */
  const updateMetadata = useCallback(
    async (
      sessionId: string,
      metadata: Partial<Pick<Session, 'model' | 'totalCostUsd' | 'messageCount'>>
    ): Promise<void> => {
      // Update the store
      storeUpdateSession(sessionId, metadata);

      // Persist to the database
      try {
        await sessionApi.updateSession(sessionId, metadata);
      } catch (err) {
        console.error('Failed to persist metadata update:', err);
      }
    },
    [storeUpdateSession]
  );

  return {
    updateModel,
    updateCost,
    incrementMessageCount,
    updateMetadata,
    getSessionMetadata,
  };
}
