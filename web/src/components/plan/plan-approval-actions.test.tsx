import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanApprovalActions } from "./plan-approval-actions";
import type { PlanStatus } from "@/store/types";

describe("PlanApprovalActions", () => {
  const defaultProps = {
    planId: "plan-123",
    status: "draft" as PlanStatus,
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with data-testid when plan is draft", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("plan-approval-actions")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<PlanApprovalActions {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId("plan-approval-actions")).toHaveClass(
        "custom-class"
      );
    });

    it("has flex layout", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("plan-approval-actions")).toHaveClass("flex");
    });

    it("has items-center for vertical alignment", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("plan-approval-actions")).toHaveClass(
        "items-center"
      );
    });

    it("has gap-2 between buttons", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("plan-approval-actions")).toHaveClass("gap-2");
    });
  });

  describe("approve button", () => {
    it("renders approve button for draft plans", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("approve-plan-button")).toBeInTheDocument();
    });

    it("displays Approve text", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    it("displays checkmark icon", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("approve-plan-button")).toHaveAttribute(
        "aria-label",
        "Approve plan"
      );
    });

    it("calls onApprove with planId when clicked", () => {
      const onApprove = vi.fn();
      render(<PlanApprovalActions {...defaultProps} onApprove={onApprove} />);

      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(onApprove).toHaveBeenCalledWith("plan-123");
    });

    it("calls onApprove with correct planId for different plans", () => {
      const onApprove = vi.fn();
      render(
        <PlanApprovalActions
          {...defaultProps}
          planId="different-plan"
          onApprove={onApprove}
        />
      );

      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).toHaveBeenCalledWith("different-plan");
    });
  });

  describe("disabled state", () => {
    it("disables approve button when disabled prop is true", () => {
      render(<PlanApprovalActions {...defaultProps} disabled={true} />);
      expect(screen.getByTestId("approve-plan-button")).toBeDisabled();
    });

    it("enables approve button when disabled prop is false", () => {
      render(<PlanApprovalActions {...defaultProps} disabled={false} />);
      expect(screen.getByTestId("approve-plan-button")).not.toBeDisabled();
    });

    it("does not call onApprove when button is disabled", () => {
      const onApprove = vi.fn();
      render(
        <PlanApprovalActions {...defaultProps} onApprove={onApprove} disabled={true} />
      );

      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  describe("visibility based on status", () => {
    it("renders for draft status", () => {
      render(<PlanApprovalActions {...defaultProps} status="draft" />);
      expect(screen.getByTestId("plan-approval-actions")).toBeInTheDocument();
    });

    it("does not render for approved status", () => {
      render(<PlanApprovalActions {...defaultProps} status="approved" />);
      expect(screen.queryByTestId("plan-approval-actions")).not.toBeInTheDocument();
    });

    it("does not render for executed status", () => {
      render(<PlanApprovalActions {...defaultProps} status="executed" />);
      expect(screen.queryByTestId("plan-approval-actions")).not.toBeInTheDocument();
    });

    it("does not render for archived status", () => {
      render(<PlanApprovalActions {...defaultProps} status="archived" />);
      expect(screen.queryByTestId("plan-approval-actions")).not.toBeInTheDocument();
    });

    it("does not render approve button for approved status", () => {
      render(<PlanApprovalActions {...defaultProps} status="approved" />);
      expect(screen.queryByTestId("approve-plan-button")).not.toBeInTheDocument();
    });

    it("does not render approve button for executed status", () => {
      render(<PlanApprovalActions {...defaultProps} status="executed" />);
      expect(screen.queryByTestId("approve-plan-button")).not.toBeInTheDocument();
    });

    it("does not render approve button for archived status", () => {
      render(<PlanApprovalActions {...defaultProps} status="archived" />);
      expect(screen.queryByTestId("approve-plan-button")).not.toBeInTheDocument();
    });
  });

  describe("button styling", () => {
    it("uses default variant for approve button", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const button = screen.getByTestId("approve-plan-button");
      expect(button).toHaveClass("bg-primary");
    });

    it("uses sm size for approve button", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const button = screen.getByTestId("approve-plan-button");
      expect(button).toHaveClass("h-8");
    });
  });

  describe("multiple clicks", () => {
    it("calls onApprove each time button is clicked", () => {
      const onApprove = vi.fn();
      render(<PlanApprovalActions {...defaultProps} onApprove={onApprove} />);

      fireEvent.click(screen.getByTestId("approve-plan-button"));
      fireEvent.click(screen.getByTestId("approve-plan-button"));
      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).toHaveBeenCalledTimes(3);
    });
  });

  describe("icon accessibility", () => {
    it("has aria-hidden on checkmark icon", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const icon = screen.getByText("✓");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("has aria-hidden on X icon", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const icon = screen.getByText("✗");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("reject button", () => {
    it("renders reject button for draft plans", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("reject-plan-button")).toBeInTheDocument();
    });

    it("displays Reject text", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    it("displays X icon", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByText("✗")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.getByTestId("reject-plan-button")).toHaveAttribute(
        "aria-label",
        "Reject plan"
      );
    });

    it("uses outline variant", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const button = screen.getByTestId("reject-plan-button");
      expect(button).toHaveClass("border");
    });

    it("uses sm size", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      const button = screen.getByTestId("reject-plan-button");
      expect(button).toHaveClass("h-8");
    });

    it("opens reject dialog when clicked", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      fireEvent.click(screen.getByTestId("reject-plan-button"));
      expect(screen.getByTestId("reject-plan-dialog")).toBeInTheDocument();
    });

    it("does not render for approved status", () => {
      render(<PlanApprovalActions {...defaultProps} status="approved" />);
      expect(screen.queryByTestId("reject-plan-button")).not.toBeInTheDocument();
    });

    it("does not render for executed status", () => {
      render(<PlanApprovalActions {...defaultProps} status="executed" />);
      expect(screen.queryByTestId("reject-plan-button")).not.toBeInTheDocument();
    });

    it("does not render for archived status", () => {
      render(<PlanApprovalActions {...defaultProps} status="archived" />);
      expect(screen.queryByTestId("reject-plan-button")).not.toBeInTheDocument();
    });

    it("is disabled when disabled prop is true", () => {
      render(<PlanApprovalActions {...defaultProps} disabled={true} />);
      expect(screen.getByTestId("reject-plan-button")).toBeDisabled();
    });
  });

  describe("reject dialog integration", () => {
    it("calls onReject when dialog submits feedback", () => {
      const onReject = vi.fn();
      render(<PlanApprovalActions {...defaultProps} onReject={onReject} />);

      // Open dialog
      fireEvent.click(screen.getByTestId("reject-plan-button"));

      // Enter feedback
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Please add tests" } });

      // Submit
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onReject).toHaveBeenCalledWith("plan-123", "Please add tests");
    });

    it("closes dialog when cancel is clicked", () => {
      render(<PlanApprovalActions {...defaultProps} />);

      // Open dialog
      fireEvent.click(screen.getByTestId("reject-plan-button"));
      expect(screen.getByTestId("reject-plan-dialog")).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByTestId("reject-cancel-button"));
      expect(screen.queryByTestId("reject-plan-dialog")).not.toBeInTheDocument();
    });

    it("passes correct planId to dialog", () => {
      const onReject = vi.fn();
      render(
        <PlanApprovalActions
          {...defaultProps}
          planId="different-plan"
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByTestId("reject-plan-button"));
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).toHaveBeenCalledWith("different-plan", "Feedback");
    });
  });

  describe("edit button", () => {
    const editProps = {
      ...defaultProps,
      planContent: "# My Plan\n\n- [ ] Task 1",
      onEdit: vi.fn(),
    };

    it("renders edit button when onEdit is provided for draft plans", () => {
      render(<PlanApprovalActions {...editProps} />);
      expect(screen.getByTestId("edit-plan-button")).toBeInTheDocument();
    });

    it("does not render edit button when onEdit is not provided", () => {
      render(<PlanApprovalActions {...defaultProps} />);
      expect(screen.queryByTestId("edit-plan-button")).not.toBeInTheDocument();
    });

    it("displays Edit text", () => {
      render(<PlanApprovalActions {...editProps} />);
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("displays pencil icon", () => {
      render(<PlanApprovalActions {...editProps} />);
      expect(screen.getByText("✎")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(<PlanApprovalActions {...editProps} />);
      expect(screen.getByTestId("edit-plan-button")).toHaveAttribute(
        "aria-label",
        "Edit plan"
      );
    });

    it("has aria-hidden on pencil icon", () => {
      render(<PlanApprovalActions {...editProps} />);
      const icon = screen.getByText("✎");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("uses outline variant", () => {
      render(<PlanApprovalActions {...editProps} />);
      const button = screen.getByTestId("edit-plan-button");
      expect(button).toHaveClass("border");
    });

    it("uses sm size", () => {
      render(<PlanApprovalActions {...editProps} />);
      const button = screen.getByTestId("edit-plan-button");
      expect(button).toHaveClass("h-8");
    });

    it("opens edit dialog when clicked", () => {
      render(<PlanApprovalActions {...editProps} />);
      fireEvent.click(screen.getByTestId("edit-plan-button"));
      expect(screen.getByTestId("edit-plan-dialog")).toBeInTheDocument();
    });

    it("does not render for approved status", () => {
      render(<PlanApprovalActions {...editProps} status="approved" />);
      expect(screen.queryByTestId("edit-plan-button")).not.toBeInTheDocument();
    });

    it("does not render for executed status", () => {
      render(<PlanApprovalActions {...editProps} status="executed" />);
      expect(screen.queryByTestId("edit-plan-button")).not.toBeInTheDocument();
    });

    it("does not render for archived status", () => {
      render(<PlanApprovalActions {...editProps} status="archived" />);
      expect(screen.queryByTestId("edit-plan-button")).not.toBeInTheDocument();
    });

    it("is disabled when disabled prop is true", () => {
      render(<PlanApprovalActions {...editProps} disabled={true} />);
      expect(screen.getByTestId("edit-plan-button")).toBeDisabled();
    });
  });

  describe("edit dialog integration", () => {
    const editProps = {
      ...defaultProps,
      planContent: "# My Plan\n\n- [ ] Task 1",
      onEdit: vi.fn(),
    };

    it("calls onEdit when dialog saves content", () => {
      const onEdit = vi.fn();
      render(<PlanApprovalActions {...editProps} onEdit={onEdit} />);

      // Open dialog
      fireEvent.click(screen.getByTestId("edit-plan-button"));

      // Edit content
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "# Updated Plan" } });

      // Save
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith("plan-123", "# Updated Plan");
    });

    it("closes dialog when cancel is clicked", () => {
      render(<PlanApprovalActions {...editProps} />);

      // Open dialog
      fireEvent.click(screen.getByTestId("edit-plan-button"));
      expect(screen.getByTestId("edit-plan-dialog")).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByTestId("edit-plan-cancel-button"));
      expect(screen.queryByTestId("edit-plan-dialog")).not.toBeInTheDocument();
    });

    it("passes correct planId to dialog", () => {
      const onEdit = vi.fn();
      render(
        <PlanApprovalActions
          {...editProps}
          planId="different-plan"
          onEdit={onEdit}
        />
      );

      fireEvent.click(screen.getByTestId("edit-plan-button"));
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Content" } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onEdit).toHaveBeenCalledWith("different-plan", "Content");
    });

    it("shows initial content in dialog", () => {
      render(<PlanApprovalActions {...editProps} />);
      fireEvent.click(screen.getByTestId("edit-plan-button"));
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(
        "# My Plan\n\n- [ ] Task 1"
      );
    });

    it("handles empty planContent", () => {
      render(<PlanApprovalActions {...editProps} planContent="" />);
      fireEvent.click(screen.getByTestId("edit-plan-button"));
      expect(screen.getByTestId("edit-plan-content")).toHaveValue("");
    });

    it("handles undefined planContent", () => {
      render(<PlanApprovalActions {...editProps} planContent={undefined} />);
      fireEvent.click(screen.getByTestId("edit-plan-button"));
      expect(screen.getByTestId("edit-plan-content")).toHaveValue("");
    });
  });
});
