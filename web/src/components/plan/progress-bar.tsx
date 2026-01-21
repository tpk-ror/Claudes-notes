"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/store";

export interface ProgressBarProps {
  /** Tasks to calculate progress from */
  tasks?: Task[];
  /** Alternatively, provide progress directly (0-100) */
  progress?: number;
  /** Show the percentage text */
  showPercentage?: boolean;
  /** Show task count (e.g., "3/10 tasks") */
  showTaskCount?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Calculates progress statistics from a list of tasks
 */
export function calculateTaskProgress(tasks: Task[]): {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percent: number;
} {
  if (!tasks || tasks.length === 0) {
    return { total: 0, completed: 0, inProgress: 0, pending: 0, percent: 0 };
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const percent = Math.round((completed / total) * 100);

  return { total, completed, inProgress, pending, percent };
}

/**
 * Returns the appropriate color class for the progress bar based on completion
 */
function getProgressColor(percent: number): string {
  if (percent === 100) {
    return "bg-green-500";
  }
  if (percent >= 75) {
    return "bg-blue-500";
  }
  if (percent >= 50) {
    return "bg-yellow-500";
  }
  if (percent >= 25) {
    return "bg-orange-500";
  }
  return "bg-primary";
}

/**
 * Returns height class based on size variant
 */
function getSizeClass(size: ProgressBarProps["size"]): string {
  switch (size) {
    case "sm":
      return "h-1";
    case "lg":
      return "h-3";
    case "md":
    default:
      return "h-2";
  }
}

/**
 * ProgressBar displays plan completion progress as a horizontal bar.
 *
 * Can be used in two ways:
 * 1. Pass `tasks` array to automatically calculate progress
 * 2. Pass `progress` directly as a percentage (0-100)
 *
 * Features:
 * - Visual progress bar with animated fill
 * - Optional percentage text display
 * - Optional task count display
 * - Color changes based on progress level
 * - Multiple size variants
 * - Full accessibility support
 */
export function ProgressBar({
  tasks,
  progress: providedProgress,
  showPercentage = true,
  showTaskCount = false,
  className,
  size = "md",
}: ProgressBarProps) {
  // Calculate progress from tasks if provided, otherwise use provided progress
  const stats = React.useMemo(() => {
    if (tasks) {
      return calculateTaskProgress(tasks);
    }
    return null;
  }, [tasks]);

  const percent = stats ? stats.percent : providedProgress ?? 0;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const progressColor = getProgressColor(clampedPercent);
  const heightClass = getSizeClass(size);

  return (
    <div
      className={cn("w-full", className)}
      data-testid="progress-bar"
      data-progress={clampedPercent}
    >
      {/* Labels row */}
      {(showPercentage || showTaskCount) && (
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          {showTaskCount && stats ? (
            <span data-testid="progress-task-count">
              {stats.completed}/{stats.total} tasks
            </span>
          ) : (
            <span />
          )}
          {showPercentage && (
            <span data-testid="progress-percentage">{clampedPercent}%</span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          heightClass
        )}
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clampedPercent}%`}
      >
        {/* Progress bar fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            progressColor
          )}
          style={{ width: `${clampedPercent}%` }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
}
