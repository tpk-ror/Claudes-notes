import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/store/types";

export interface PlanStatusBadgeProps {
  status: PlanStatus;
  className?: string;
}

const statusConfig: Record<
  PlanStatus,
  { label: string; className: string; icon: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
    icon: "✎",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
    icon: "✓",
  },
  executed: {
    label: "Executed",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
    icon: "●",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
    icon: "▫",
  },
};

/**
 * PlanStatusBadge displays the current status of a plan with visual styling.
 *
 * Status types:
 * - draft: Yellow - Plan is newly created and awaiting approval
 * - approved: Green - Plan has been approved for execution
 * - executed: Blue - Plan has been executed
 * - archived: Gray - Plan has been archived
 */
export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      data-testid="plan-status-badge"
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
      aria-label={`Plan status: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

/**
 * Helper function to check if a plan is in draft status
 */
export function isDraftPlan(status: PlanStatus): boolean {
  return status === "draft";
}

/**
 * Helper function to check if a plan can be approved (only drafts can be approved)
 */
export function canApprovePlan(status: PlanStatus): boolean {
  return status === "draft";
}

/**
 * Helper function to check if a plan can be rejected (only drafts can be rejected)
 */
export function canRejectPlan(status: PlanStatus): boolean {
  return status === "draft";
}

/**
 * Helper function to check if a plan can be edited (only drafts can be edited)
 */
export function canEditPlan(status: PlanStatus): boolean {
  return status === "draft";
}
