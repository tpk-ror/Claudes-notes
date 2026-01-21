"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TaskTree } from "@/components/plan/task-tree";
import { ProgressBar } from "@/components/plan/progress-bar";
import { PlanStatusBadge } from "@/components/plan/plan-status-badge";
import { PlanApprovalActions } from "@/components/plan/plan-approval-actions";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import type { Plan, Task } from "@/store/types";

export interface PlanPanelProps {
  /** The plan to display (null for empty state) */
  plan: Plan | null;
  /** Called when user approves the plan */
  onApprove?: (planId: string) => void;
  /** Called when user rejects the plan with feedback */
  onReject?: (planId: string, feedback: string) => void;
  /** Called when user edits the plan content */
  onEdit?: (planId: string, content: string) => void;
  /** Custom class name */
  className?: string;
  /** Whether actions should be disabled */
  disabled?: boolean;
}

/**
 * PlanPanel displays plan content, task tree, progress, and approval actions.
 *
 * Features:
 * - Plan title and status badge
 * - Progress bar with task count
 * - Hierarchical task tree with status indicators
 * - Markdown-rendered plan content
 * - Approval actions (Edit, Reject, Approve) for draft plans
 */
export function PlanPanel({
  plan,
  onApprove,
  onReject,
  onEdit,
  className,
  disabled = false,
}: PlanPanelProps) {
  // Empty state when no plan is available
  if (!plan) {
    return (
      <div
        className={cn(
          "flex flex-col h-full items-center justify-center text-muted-foreground",
          className
        )}
        data-testid="plan-panel-empty"
      >
        <div className="text-center">
          <p className="text-lg font-medium">No plan yet</p>
          <p className="text-sm mt-1">
            Start a conversation to generate a plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col h-full", className)}
      data-testid="plan-panel"
    >
      {/* Header with title, status badge, and progress */}
      <div className="shrink-0 border-b border-border p-4 space-y-3">
        {/* Title and status row */}
        <div className="flex items-center justify-between gap-2">
          <h2
            className="text-lg font-semibold truncate"
            data-testid="plan-title"
          >
            {plan.title || "Untitled Plan"}
          </h2>
          <PlanStatusBadge status={plan.status} />
        </div>

        {/* Progress bar with task count */}
        {plan.tasks && plan.tasks.length > 0 && (
          <ProgressBar
            tasks={plan.tasks}
            showPercentage
            showTaskCount
            size="sm"
          />
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {/* Task tree section */}
        {plan.tasks && plan.tasks.length > 0 && (
          <section data-testid="plan-tasks-section">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Tasks
            </h3>
            <TaskTree tasks={plan.tasks} />
          </section>
        )}

        {/* Plan content section */}
        {plan.content && (
          <section data-testid="plan-content-section">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Details
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={plan.content} />
            </div>
          </section>
        )}
      </div>

      {/* Approval actions fixed at bottom */}
      {onApprove && onReject && (
        <div className="shrink-0 border-t border-border p-4">
          <PlanApprovalActions
            planId={plan.id}
            status={plan.status}
            planContent={plan.content}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
