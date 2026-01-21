// Markdown task parser - extracts tasks from markdown lists into structured data
// Based on PRD FR-2.1: Markdown lists become task tree items

import type { Task, TaskStatus } from '../store/types';

/**
 * Represents a parsed task from markdown content
 */
export interface ParsedTask {
  content: string;
  status: TaskStatus;
  depth: number; // 0 = root, 1 = nested, etc.
  rawLine: string;
  lineNumber: number;
}

/**
 * Represents the result of parsing markdown for tasks
 */
export interface TaskExtractionResult {
  tasks: Task[];
  parsedTasks: ParsedTask[];
}

// Regex patterns for different list item types
const UNORDERED_LIST_REGEX = /^(\s*)([-*+])\s+(.+)$/;
const ORDERED_LIST_REGEX = /^(\s*)(\d+)[.)]\s+(.+)$/;
const CHECKBOX_UNCHECKED_REGEX = /^\[[ ]\]\s+(.+)$/;
const CHECKBOX_CHECKED_REGEX = /^\[[xX]\]\s+(.+)$/;
const CHECKBOX_IN_PROGRESS_REGEX = /^\[[-~]\]\s+(.+)$/;

/**
 * Calculates indentation level based on leading whitespace
 * Treats 2 spaces or 1 tab as one level of indentation
 */
function calculateDepth(leadingWhitespace: string): number {
  if (!leadingWhitespace) return 0;

  // Count tabs as 1 level each, and every 2 spaces as 1 level
  let depth = 0;
  let spaceCount = 0;

  for (const char of leadingWhitespace) {
    if (char === '\t') {
      depth += 1;
      spaceCount = 0; // Reset space count after tab
    } else if (char === ' ') {
      spaceCount += 1;
      if (spaceCount >= 2) {
        depth += 1;
        spaceCount = 0;
      }
    }
  }

  return depth;
}

/**
 * Determines task status from checkbox-style markdown
 * - [ ] = pending
 * - [x] or [X] = completed
 * - [-] or [~] = in_progress
 */
function parseCheckboxStatus(content: string): { status: TaskStatus; content: string } {
  const uncheckedMatch = content.match(CHECKBOX_UNCHECKED_REGEX);
  if (uncheckedMatch) {
    return { status: 'pending', content: uncheckedMatch[1].trim() };
  }

  const checkedMatch = content.match(CHECKBOX_CHECKED_REGEX);
  if (checkedMatch) {
    return { status: 'completed', content: checkedMatch[1].trim() };
  }

  const inProgressMatch = content.match(CHECKBOX_IN_PROGRESS_REGEX);
  if (inProgressMatch) {
    return { status: 'in_progress', content: inProgressMatch[1].trim() };
  }

  // No checkbox, default to pending
  return { status: 'pending', content: content.trim() };
}

/**
 * Parses a single line to extract task information
 * Returns null if the line is not a list item
 */
function parseListItem(line: string, lineNumber: number): ParsedTask | null {
  // Try unordered list
  const unorderedMatch = line.match(UNORDERED_LIST_REGEX);
  if (unorderedMatch) {
    const [, leadingWhitespace, , itemContent] = unorderedMatch;
    const depth = calculateDepth(leadingWhitespace);
    const { status, content } = parseCheckboxStatus(itemContent);

    return {
      content,
      status,
      depth,
      rawLine: line,
      lineNumber,
    };
  }

  // Try ordered list
  const orderedMatch = line.match(ORDERED_LIST_REGEX);
  if (orderedMatch) {
    const [, leadingWhitespace, , itemContent] = orderedMatch;
    const depth = calculateDepth(leadingWhitespace);
    const { status, content } = parseCheckboxStatus(itemContent);

    return {
      content,
      status,
      depth,
      rawLine: line,
      lineNumber,
    };
  }

  return null;
}

/**
 * Generates a unique ID for a task based on plan ID and sort order
 */
function generateTaskId(planId: string, sortOrder: number): string {
  return `${planId}-task-${sortOrder}`;
}

/**
 * Builds parent-child relationships based on indentation depth
 * Returns an array of parent IDs for each task (index-aligned with parsedTasks)
 */
function buildTaskHierarchy(parsedTasks: ParsedTask[], planId: string): (string | undefined)[] {
  const parentIds: (string | undefined)[] = [];
  const depthStack: { depth: number; taskId: string }[] = [];

  parsedTasks.forEach((task, index) => {
    const taskId = generateTaskId(planId, index);

    // Pop items from stack until we find a parent with lower depth
    while (depthStack.length > 0 && depthStack[depthStack.length - 1].depth >= task.depth) {
      depthStack.pop();
    }

    // The parent is the top of the stack (if any)
    const parentId = depthStack.length > 0 ? depthStack[depthStack.length - 1].taskId : undefined;
    parentIds.push(parentId);

    // Push current task onto stack
    depthStack.push({ depth: task.depth, taskId });
  });

  return parentIds;
}

/**
 * Normalizes line endings to LF (Unix style)
 */
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Extracts tasks from markdown content
 *
 * Supports:
 * - Unordered lists (-, *, +)
 * - Ordered lists (1., 2., etc.)
 * - Checkbox syntax ([ ], [x], [-])
 * - Nested lists via indentation
 *
 * @param markdown - The markdown content to parse
 * @param planId - The ID of the plan these tasks belong to
 * @returns TaskExtractionResult with structured Task objects and parsed metadata
 */
export function extractTasksFromMarkdown(markdown: string, planId: string): TaskExtractionResult {
  const normalizedMarkdown = normalizeLineEndings(markdown);
  const lines = normalizedMarkdown.split('\n');
  const parsedTasks: ParsedTask[] = [];

  lines.forEach((line, index) => {
    const parsed = parseListItem(line, index + 1); // 1-indexed line numbers
    if (parsed) {
      parsedTasks.push(parsed);
    }
  });

  // Build parent-child relationships
  const parentIds = buildTaskHierarchy(parsedTasks, planId);

  // Convert to Task objects
  const tasks: Task[] = parsedTasks.map((parsed, index) => ({
    id: generateTaskId(planId, index),
    planId,
    parentId: parentIds[index],
    content: parsed.content,
    status: parsed.status,
    sortOrder: index,
  }));

  return { tasks, parsedTasks };
}

/**
 * Extracts only the raw task content strings from markdown
 * Useful for simpler use cases that don't need full Task objects
 */
export function extractTaskContents(markdown: string): string[] {
  const normalizedMarkdown = normalizeLineEndings(markdown);
  const lines = normalizedMarkdown.split('\n');
  const contents: string[] = [];

  for (const line of lines) {
    const parsed = parseListItem(line, 0);
    if (parsed) {
      contents.push(parsed.content);
    }
  }

  return contents;
}

/**
 * Checks if markdown content contains any extractable tasks
 */
export function hasExtractableTasks(markdown: string): boolean {
  const normalizedMarkdown = normalizeLineEndings(markdown);
  const lines = normalizedMarkdown.split('\n');

  for (const line of lines) {
    if (parseListItem(line, 0)) {
      return true;
    }
  }

  return false;
}

/**
 * Gets statistics about tasks in markdown content
 */
export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  progressPercent: number;
}

export function getTaskStats(markdown: string, planId: string = 'temp'): TaskStats {
  const { tasks } = extractTasksFromMarkdown(markdown, planId);

  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, pending, inProgress, completed, progressPercent };
}
