import { useState, useEffect } from "react";
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

export interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  initialContent: string;
  onSave: (planId: string, content: string) => void;
  className?: string;
}

/**
 * EditPlanDialog allows editing a plan's markdown content.
 *
 * Opens with the current plan content pre-filled in a textarea.
 * When the user saves, it calls onSave with the planId and updated content.
 */
export function EditPlanDialog({
  open,
  onOpenChange,
  planId,
  initialContent,
  onSave,
  className,
}: EditPlanDialogProps) {
  const [content, setContent] = useState(initialContent);

  // Reset content when dialog opens with new initial content
  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSave = () => {
    onSave(planId, content);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    onOpenChange(false);
  };

  const hasChanges = content !== initialContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="edit-plan-dialog"
        className={cn("sm:max-w-2xl", className)}
        aria-describedby="edit-plan-description"
      >
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription id="edit-plan-description">
            Edit the plan content in markdown format. Changes will update the task list.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            data-testid="edit-plan-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            aria-label="Plan content in markdown format"
          />
        </div>
        <DialogFooter>
          <Button
            data-testid="edit-plan-cancel-button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            data-testid="edit-plan-save-button"
            onClick={handleSave}
            disabled={!hasChanges}
            aria-label="Save plan changes"
          >
            <span aria-hidden="true">✓</span>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
