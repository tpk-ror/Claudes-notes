import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { canApprovePlan, canRejectPlan, canEditPlan } from "./plan-status-badge";
import { RejectPlanDialog } from "./reject-plan-dialog";
import { EditPlanDialog } from "./edit-plan-dialog";
import type { PlanStatus } from "@/store/types";

export interface PlanApprovalActionsProps {
  planId: string;
  status: PlanStatus;
  planContent?: string;
  onApprove: (planId: string) => void;
  onReject: (planId: string, feedback: string) => void;
  onEdit?: (planId: string, content: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * PlanApprovalActions provides action buttons for plan approval workflow.
 *
 * Supports:
 * - Edit button: Opens plan in editable markdown view (only visible for draft plans)
 * - Approve button: Sets plan status to approved (only visible for draft plans)
 * - Reject button: Opens feedback dialog, sends feedback to Claude for revision
 *
 * All buttons are only shown when the plan is in draft status.
 */
export function PlanApprovalActions({
  planId,
  status,
  planContent = "",
  onApprove,
  onReject,
  onEdit,
  className,
  disabled = false,
}: PlanApprovalActionsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const canApprove = canApprovePlan(status);
  const canReject = canRejectPlan(status);
  const canEdit = canEditPlan(status);

  // Don't render anything if no actions are available
  if (!canApprove && !canReject && !canEdit) {
    return null;
  }

  const handleApprove = () => {
    onApprove(planId);
  };

  const handleRejectClick = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = (id: string, feedback: string) => {
    onReject(id, feedback);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditSave = (id: string, content: string) => {
    onEdit?.(id, content);
  };

  return (
    <>
      <div
        data-testid="plan-approval-actions"
        className={cn("flex items-center gap-2", className)}
      >
        {canEdit && onEdit && (
          <Button
            data-testid="edit-plan-button"
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            disabled={disabled}
            aria-label="Edit plan"
          >
            <span aria-hidden="true">✎</span>
            Edit
          </Button>
        )}
        {canReject && (
          <Button
            data-testid="reject-plan-button"
            variant="outline"
            size="sm"
            onClick={handleRejectClick}
            disabled={disabled}
            aria-label="Reject plan"
          >
            <span aria-hidden="true">✗</span>
            Reject
          </Button>
        )}
        {canApprove && (
          <Button
            data-testid="approve-plan-button"
            variant="default"
            size="sm"
            onClick={handleApprove}
            disabled={disabled}
            aria-label="Approve plan"
          >
            <span aria-hidden="true">✓</span>
            Approve
          </Button>
        )}
      </div>
      <RejectPlanDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        planId={planId}
        onReject={handleRejectSubmit}
      />
      {onEdit && (
        <EditPlanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          planId={planId}
          initialContent={planContent}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
