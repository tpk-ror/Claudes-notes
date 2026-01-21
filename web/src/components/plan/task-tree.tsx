"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/store";

export interface TaskTreeItemProps {
  task: Task;
  children?: React.ReactNode;
  className?: string;
}

/**
 * TaskTreeItem displays a single task with its status indicator
 * and supports nested children for hierarchical display.
 */
export function TaskTreeItem({
  task,
  children,
  className,
}: TaskTreeItemProps) {
  return (
    <li
      className={cn("relative", className)}
      data-testid={`task-item-${task.id}`}
      data-status={task.status}
    >
      <div className="flex items-start gap-2 py-1">
        {/* Status indicator */}
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center",
            "text-sm font-medium"
          )}
          aria-label={getStatusLabel(task.status)}
        >
          {getStatusIndicator(task.status)}
        </span>

        {/* Task content */}
        <span
          className={cn(
            "text-sm",
            task.status === "completed" && "text-muted-foreground line-through",
            task.status === "in_progress" && "text-primary font-medium"
          )}
        >
          {task.content}
        </span>
      </div>

      {/* Nested children */}
      {children && (
        <ul className="ml-6 border-l border-border pl-4">{children}</ul>
      )}
    </li>
  );
}

/**
 * Returns the status indicator character based on PRD spec:
 * - ○ pending
 * - ◐ in-progress
 * - ● done
 */
function getStatusIndicator(status: Task["status"]): string {
  switch (status) {
    case "pending":
      return "○";
    case "in_progress":
      return "◐";
    case "completed":
      return "●";
    default:
      return "○";
  }
}

/**
 * Returns the accessible status label
 */
function getStatusLabel(status: Task["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return "Unknown status";
  }
}

export interface TaskTreeProps {
  tasks: Task[];
  className?: string;
}

/**
 * Builds a tree structure from flat task list using parentId relationships
 */
function buildTaskTree(tasks: Task[]): Map<string | undefined, Task[]> {
  const tree = new Map<string | undefined, Task[]>();

  // Sort tasks by sortOrder first
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  // Group tasks by parentId
  for (const task of sortedTasks) {
    const parentId = task.parentId;
    const existing = tree.get(parentId) || [];
    existing.push(task);
    tree.set(parentId, existing);
  }

  return tree;
}

/**
 * Recursively renders task tree items
 */
function renderTaskItems(
  tree: Map<string | undefined, Task[]>,
  parentId: string | undefined
): React.ReactNode {
  const children = tree.get(parentId);
  if (!children || children.length === 0) {
    return null;
  }

  return children.map((task) => {
    const nestedChildren = tree.get(task.id);
    const hasChildren = nestedChildren && nestedChildren.length > 0;

    return (
      <TaskTreeItem key={task.id} task={task}>
        {hasChildren ? renderTaskItems(tree, task.id) : null}
      </TaskTreeItem>
    );
  });
}

/**
 * TaskTree displays a hierarchical tree of tasks with visual nesting.
 * Supports multiple levels of nested tasks based on parentId relationships.
 */
export function TaskTree({ tasks, className }: TaskTreeProps) {
  // Build tree structure - must be called before any early returns per React hooks rules
  const tree = React.useMemo(
    () => (tasks && tasks.length > 0 ? buildTaskTree(tasks) : new Map()),
    [tasks]
  );

  if (!tasks || tasks.length === 0) {
    return (
      <div
        className={cn("text-sm text-muted-foreground italic", className)}
        data-testid="task-tree-empty"
      >
        No tasks available
      </div>
    );
  }

  return (
    <ul
      className={cn("space-y-1", className)}
      role="list"
      aria-label="Task list"
      data-testid="task-tree"
    >
      {renderTaskItems(tree, undefined)}
    </ul>
  );
}
