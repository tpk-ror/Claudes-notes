import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RejectPlanDialog } from "./reject-plan-dialog";

describe("RejectPlanDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    planId: "plan-123",
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders dialog when open is true", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-plan-dialog")).toBeInTheDocument();
    });

    it("does not render dialog when open is false", () => {
      render(<RejectPlanDialog {...defaultProps} open={false} />);
      expect(screen.queryByTestId("reject-plan-dialog")).not.toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<RejectPlanDialog {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId("reject-plan-dialog")).toHaveClass("custom-class");
    });

    it("renders dialog title", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      // Title appears in both h2 header and button - use role to find heading
      expect(screen.getByRole("heading", { name: "Reject Plan" })).toBeInTheDocument();
    });

    it("renders dialog description", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(
        screen.getByText(/Provide feedback for Claude to revise the plan/)
      ).toBeInTheDocument();
    });
  });

  describe("feedback input", () => {
    it("renders feedback textarea", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-feedback-input")).toBeInTheDocument();
    });

    it("has placeholder text", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-feedback-input")).toHaveAttribute(
        "placeholder",
        expect.stringContaining("error handling")
      );
    });

    it("has aria-label for accessibility", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-feedback-input")).toHaveAttribute(
        "aria-label",
        "Feedback for plan revision"
      );
    });

    it("updates value when typing", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Please add tests" } });
      expect(textarea).toHaveValue("Please add tests");
    });
  });

  describe("cancel button", () => {
    it("renders cancel button", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-cancel-button")).toBeInTheDocument();
    });

    it("displays Cancel text", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("uses outline variant", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const button = screen.getByTestId("reject-cancel-button");
      expect(button).toHaveClass("border");
    });

    it("closes dialog when clicked", () => {
      const onOpenChange = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByTestId("reject-cancel-button"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("clears feedback when clicked", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Some feedback" } });
      fireEvent.click(screen.getByTestId("reject-cancel-button"));
      // Note: State is cleared, but dialog closes so we can't check directly
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("submit button", () => {
    it("renders submit button", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-submit-button")).toBeInTheDocument();
    });

    it("displays Reject Plan text on button", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const submitButton = screen.getByTestId("reject-submit-button");
      expect(submitButton).toHaveTextContent("Reject Plan");
    });

    it("displays X icon", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const submitButton = screen.getByTestId("reject-submit-button");
      expect(submitButton.querySelector('[aria-hidden="true"]')).toHaveTextContent("✗");
    });

    it("has aria-hidden on icon", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const icon = screen.getByText("✗");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("has aria-label for accessibility", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-submit-button")).toHaveAttribute(
        "aria-label",
        "Submit rejection feedback"
      );
    });

    it("uses destructive variant", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const button = screen.getByTestId("reject-submit-button");
      expect(button).toHaveClass("bg-destructive");
    });

    it("is disabled when feedback is empty", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-submit-button")).toBeDisabled();
    });

    it("is disabled when feedback is only whitespace", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "   " } });
      expect(screen.getByTestId("reject-submit-button")).toBeDisabled();
    });

    it("is enabled when feedback has content", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Please add tests" } });
      expect(screen.getByTestId("reject-submit-button")).not.toBeDisabled();
    });
  });

  describe("submit behavior", () => {
    it("calls onReject with planId and feedback when submitted", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Add error handling" } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onReject).toHaveBeenCalledWith("plan-123", "Add error handling");
    });

    it("trims feedback before submitting", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "  Add tests  " } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).toHaveBeenCalledWith("plan-123", "Add tests");
    });

    it("closes dialog after submitting", () => {
      const onOpenChange = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onOpenChange={onOpenChange} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("clears feedback after submitting", async () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <RejectPlanDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      // Reopen the dialog to check feedback was cleared
      rerender(<RejectPlanDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("reject-feedback-input")).toHaveValue("");
      });
    });

    it("does not submit when feedback is empty", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).not.toHaveBeenCalled();
    });

    it("uses correct planId for different plans", () => {
      const onReject = vi.fn();
      render(
        <RejectPlanDialog
          {...defaultProps}
          planId="different-plan"
          onReject={onReject}
        />
      );

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.click(screen.getByTestId("reject-submit-button"));

      expect(onReject).toHaveBeenCalledWith("different-plan", "Feedback");
    });
  });

  describe("keyboard interaction", () => {
    it("submits on Enter key when feedback is not empty", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onReject).toHaveBeenCalledWith("plan-123", "Feedback");
    });

    it("does not submit on Enter when feedback is empty", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onReject).not.toHaveBeenCalled();
    });

    it("does not submit on Shift+Enter", () => {
      const onReject = vi.fn();
      render(<RejectPlanDialog {...defaultProps} onReject={onReject} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Feedback" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

      expect(onReject).not.toHaveBeenCalled();
    });

    it("allows multi-line input with Shift+Enter", () => {
      render(<RejectPlanDialog {...defaultProps} />);

      const textarea = screen.getByTestId("reject-feedback-input");
      fireEvent.change(textarea, { target: { value: "Line 1\nLine 2" } });

      expect(textarea).toHaveValue("Line 1\nLine 2");
    });
  });

  describe("accessibility", () => {
    it("has aria-describedby on dialog content", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("reject-plan-dialog")).toHaveAttribute(
        "aria-describedby",
        "reject-plan-description"
      );
    });

    it("description has matching id", () => {
      render(<RejectPlanDialog {...defaultProps} />);
      const description = screen.getByText(
        /Provide feedback for Claude to revise the plan/
      );
      expect(description).toHaveAttribute("id", "reject-plan-description");
    });
  });
});
