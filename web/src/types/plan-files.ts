// Type definitions for plan file management
// Supports interactive planning experience with file-based storage

/**
 * Information about a plan file stored on disk
 */
export interface PlanFileInfo {
  /** Full filename including extension (e.g., "plan-todolist-1.20.26-0744.md") */
  fileName: string;
  /** Human-readable display name extracted from filename */
  displayName: string;
  /** When the file was created */
  createdAt: Date;
  /** When the file was last modified */
  modifiedAt: Date;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Mode for the plan editor panel
 */
export type PlanEditorMode = 'empty' | 'viewing' | 'streaming' | 'editing';

/**
 * A parsed option from agent output
 */
export interface ParsedOption {
  /** Unique identifier for this option */
  id: string;
  /** Display label for the option */
  label: string;
  /** Value to send when selected (may differ from label) */
  value: string;
  /** Original index in the list (1-based) */
  index: number;
}

/**
 * A parsed question with selectable options from agent output
 */
export interface ParsedQuestion {
  /** The question text (e.g., "Which approach do you prefer?") */
  questionText: string;
  /** Array of parsed options */
  options: ParsedOption[];
  /** Whether "Other" option should be shown for custom input */
  allowOther: boolean;
}

/**
 * Result of parsing plan filename
 */
export interface ParsedPlanFileName {
  /** The plan name (e.g., "todolist") */
  name: string;
  /** The date from filename (e.g., "1.20.26") */
  date: string;
  /** The time from filename (e.g., "0744") */
  time: string;
}

/**
 * Options for creating a new plan file
 */
export interface CreatePlanFileOptions {
  /** Name for the plan (will be sanitized) */
  name: string;
  /** Initial content for the plan */
  content?: string;
}

/**
 * Response from plan file operations
 */
export interface PlanFileOperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** The file info if operation succeeded */
  file?: PlanFileInfo;
}

/**
 * Context about a loaded plan for agent conversations
 */
export interface PlanContext {
  /** Filename of the loaded plan */
  fileName: string;
  /** Full content of the plan */
  content: string;
  /** When the plan was loaded into context */
  loadedAt: Date;
}
