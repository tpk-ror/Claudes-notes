import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface RejectPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  onReject: (planId: string, feedback: string) => void;
  className?: string;
}

/**
 * RejectPlanDialog prompts the user for feedback when rejecting a plan.
 *
 * When the user submits feedback, it calls onReject with the planId and feedback message.
 * The feedback is intended to be sent to Claude so it can revise the plan.
 */
export function RejectPlanDialog({
  open,
  onOpenChange,
  planId,
  onReject,
  className,
}: RejectPlanDialogProps) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (feedback.trim()) {
      onReject(planId, feedback.trim());
      setFeedback("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFeedback("");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey && feedback.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="reject-plan-dialog"
        className={cn(className)}
        aria-describedby="reject-plan-description"
      >
        <DialogHeader>
          <DialogTitle>Reject Plan</DialogTitle>
          <DialogDescription id="reject-plan-description">
            Provide feedback for Claude to revise the plan. What changes would you like?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            data-testid="reject-feedback-input"
            placeholder="e.g., The plan is missing error handling. Please add try-catch blocks around the API calls."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            aria-label="Feedback for plan revision"
          />
        </div>
        <DialogFooter>
          <Button
            data-testid="reject-cancel-button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            data-testid="reject-submit-button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            aria-label="Submit rejection feedback"
          >
            <span aria-hidden="true">✗</span>
            Reject Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
