import { create } from 'zustand';
import type { Session } from './types';
import { createNewSession as createSession, type CreateSessionInput } from '../lib/session-utils';

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  createNewSession: (input: CreateSessionInput) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setCurrentSession: (id: string | null) => void;
  getCurrentSession: () => Session | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),

  createNewSession: (input) => {
    const session = createSession(input);
    set((state) => ({
      sessions: [...state.sessions, session],
      currentSessionId: session.id,
    }));
    return session;
  },

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
    })),

  setCurrentSession: (id) => set({ currentSessionId: id }),

  getCurrentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId);
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
