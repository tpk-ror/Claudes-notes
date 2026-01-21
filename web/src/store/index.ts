// Zustand stores for Claude's Notes state management
export { useSessionStore } from './session-store';
export { useMessageStore } from './message-store';
export { usePlanStore } from './plan-store';
export { usePlanEditorStore } from './plan-editor-store';
export { useThemeStore, THEME_STORAGE_KEY } from './theme-store';

// Type exports
export type {
  Session,
  Plan,
  PlanStatus,
  Task,
  TaskStatus,
  Message,
  MessageRole,
  ToolCall,
  ThinkingBlock,
} from './types';

export type { SessionStore } from './session-store';
export type { MessageStore } from './message-store';
export type { PlanStore, CreateDraftPlanInput } from './plan-store';
export type { PlanEditorStore } from './plan-editor-store';
export type { ThemeStore, ThemeMode, ResolvedTheme } from './theme-store';

// Re-export session utility types
export type { CreateSessionInput } from '../lib/session-utils';
