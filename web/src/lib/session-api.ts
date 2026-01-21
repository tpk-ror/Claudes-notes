// Client-side API functions for session operations
// These functions call the API routes and handle responses

import type { Session } from '../store/types';

const API_BASE = '/api/sessions';

export interface ApiError {
  error: string;
  status: number;
}

export interface GetSessionsResponse {
  sessions: Session[];
}

export interface GetSessionResponse {
  session: Session;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface UpdateSessionResponse {
  session: Session;
}

export interface DeleteSessionResponse {
  success: boolean;
}

/**
 * Fetch all sessions
 */
export async function fetchAllSessions(): Promise<Session[]> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sessions');
  }

  const data: GetSessionsResponse = await response.json();

  // Convert date strings back to Date objects
  return data.sessions.map(parseSessionDates);
}

/**
 * Fetch a single session by ID
 */
export async function fetchSessionById(sessionId: string): Promise<Session> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(sessionId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session');
  }

  const data: GetSessionResponse = await response.json();
  return parseSessionDates(data.session);
}

/**
 * Create a new session
 */
export async function createSession(session: {
  id: string;
  slug: string;
  projectPath: string;
  model?: string;
}): Promise<Session> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  const data: CreateSessionResponse = await response.json();
  return parseSessionDates(data.session);
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'slug' | 'model' | 'lastActiveAt' | 'messageCount' | 'totalCostUsd' | 'cliSessionId'>>
): Promise<Session> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update session');
  }

  const data: UpdateSessionResponse = await response.json();
  return parseSessionDates(data.session);
}

/**
 * Touch a session (update lastActiveAt)
 */
export async function touchSession(sessionId: string): Promise<Session> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ touch: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to touch session');
  }

  const data: UpdateSessionResponse = await response.json();
  return parseSessionDates(data.session);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete session');
  }

  const data: DeleteSessionResponse = await response.json();
  return data.success;
}

/**
 * Set the CLI session ID for a session (used for --resume flag)
 */
export async function setCliSessionId(
  sessionId: string,
  cliSessionId: string
): Promise<Session> {
  return updateSession(sessionId, { cliSessionId });
}

/**
 * Parse date strings in a session back to Date objects
 */
function parseSessionDates(session: Session): Session {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    lastActiveAt: new Date(session.lastActiveAt),
  };
}
