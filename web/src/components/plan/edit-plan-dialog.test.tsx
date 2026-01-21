import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditPlanDialog } from "./edit-plan-dialog";

describe("EditPlanDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    planId: "plan-123",
    initialContent: "# My Plan\n\n- [ ] Task 1\n- [ ] Task 2",
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders dialog when open is true", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-dialog")).toBeInTheDocument();
    });

    it("does not render dialog when open is false", () => {
      render(<EditPlanDialog {...defaultProps} open={false} />);
      expect(screen.queryByTestId("edit-plan-dialog")).not.toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<EditPlanDialog {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId("edit-plan-dialog")).toHaveClass("custom-class");
    });

    it("renders dialog title", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByRole("heading", { name: "Edit Plan" })).toBeInTheDocument();
    });

    it("renders dialog description", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(
        screen.getByText(/Edit the plan content in markdown format/)
      ).toBeInTheDocument();
    });

    it("has wider dialog for markdown editing", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-dialog")).toHaveClass("sm:max-w-2xl");
    });
  });

  describe("content input", () => {
    it("renders content textarea", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-content")).toBeInTheDocument();
    });

    it("displays initial content", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(
        "# My Plan\n\n- [ ] Task 1\n- [ ] Task 2"
      );
    });

    it("has aria-label for accessibility", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveAttribute(
        "aria-label",
        "Plan content in markdown format"
      );
    });

    it("updates value when typing", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "# Updated Plan" } });
      expect(textarea).toHaveValue("# Updated Plan");
    });

    it("uses monospace font for code editing", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveClass("font-mono");
    });

    it("has small text size", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveClass("text-sm");
    });
  });

  describe("cancel button", () => {
    it("renders cancel button", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-cancel-button")).toBeInTheDocument();
    });

    it("displays Cancel text", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-cancel-button")).toHaveTextContent("Cancel");
    });

    it("uses outline variant", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const button = screen.getByTestId("edit-plan-cancel-button");
      expect(button).toHaveClass("border");
    });

    it("closes dialog when clicked", () => {
      const onOpenChange = vi.fn();
      render(<EditPlanDialog {...defaultProps} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByTestId("edit-plan-cancel-button"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("reverts content to initial value when clicked", () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <EditPlanDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      // Modify the content
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Modified content" } });

      // Click cancel
      fireEvent.click(screen.getByTestId("edit-plan-cancel-button"));

      // Reopen dialog
      rerender(<EditPlanDialog {...defaultProps} open={true} />);

      // Content should be back to initial
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(
        "# My Plan\n\n- [ ] Task 1\n- [ ] Task 2"
      );
    });
  });

  describe("save button", () => {
    it("renders save button", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-save-button")).toBeInTheDocument();
    });

    it("displays Save text", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-save-button")).toHaveTextContent("Save");
    });

    it("displays checkmark icon", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const button = screen.getByTestId("edit-plan-save-button");
      expect(button.querySelector('[aria-hidden="true"]')).toHaveTextContent("✓");
    });

    it("has aria-hidden on icon", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const icon = screen.getByText("✓");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("has aria-label for accessibility", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-save-button")).toHaveAttribute(
        "aria-label",
        "Save plan changes"
      );
    });

    it("is disabled when content has not changed", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-save-button")).toBeDisabled();
    });

    it("is enabled when content has changed", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Updated content" } });
      expect(screen.getByTestId("edit-plan-save-button")).not.toBeDisabled();
    });

    it("is disabled when content changes back to initial", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Modified" } });
      fireEvent.change(textarea, { target: { value: defaultProps.initialContent } });
      expect(screen.getByTestId("edit-plan-save-button")).toBeDisabled();
    });
  });

  describe("save behavior", () => {
    it("calls onSave with planId and content when saved", () => {
      const onSave = vi.fn();
      render(<EditPlanDialog {...defaultProps} onSave={onSave} />);

      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "# Updated Plan" } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith("plan-123", "# Updated Plan");
    });

    it("closes dialog after saving", () => {
      const onOpenChange = vi.fn();
      render(<EditPlanDialog {...defaultProps} onOpenChange={onOpenChange} />);

      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Updated" } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("uses correct planId for different plans", () => {
      const onSave = vi.fn();
      render(
        <EditPlanDialog
          {...defaultProps}
          planId="different-plan"
          onSave={onSave}
        />
      );

      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Content" } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onSave).toHaveBeenCalledWith("different-plan", "Content");
    });

    it("preserves empty content if saved", () => {
      const onSave = vi.fn();
      render(<EditPlanDialog {...defaultProps} onSave={onSave} />);

      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "" } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onSave).toHaveBeenCalledWith("plan-123", "");
    });

    it("preserves whitespace in content", () => {
      const onSave = vi.fn();
      render(<EditPlanDialog {...defaultProps} onSave={onSave} />);

      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "  indented\n\nspaced  " } });
      fireEvent.click(screen.getByTestId("edit-plan-save-button"));

      expect(onSave).toHaveBeenCalledWith("plan-123", "  indented\n\nspaced  ");
    });
  });

  describe("initial content reset", () => {
    it("resets content when dialog reopens with new initial content", async () => {
      const { rerender } = render(
        <EditPlanDialog {...defaultProps} />
      );

      // Modify content
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Modified" } });

      // Close dialog
      rerender(<EditPlanDialog {...defaultProps} open={false} />);

      // Reopen with different initial content
      rerender(
        <EditPlanDialog
          {...defaultProps}
          open={true}
          initialContent="# New Plan"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("edit-plan-content")).toHaveValue("# New Plan");
      });
    });

    it("resets to initial content when reopened after cancel", async () => {
      const { rerender } = render(<EditPlanDialog {...defaultProps} />);

      // Modify and cancel
      const textarea = screen.getByTestId("edit-plan-content");
      fireEvent.change(textarea, { target: { value: "Modified" } });
      fireEvent.click(screen.getByTestId("edit-plan-cancel-button"));

      // Reopen
      rerender(<EditPlanDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-plan-content")).toHaveValue(
          "# My Plan\n\n- [ ] Task 1\n- [ ] Task 2"
        );
      });
    });
  });

  describe("accessibility", () => {
    it("has aria-describedby on dialog content", () => {
      render(<EditPlanDialog {...defaultProps} />);
      expect(screen.getByTestId("edit-plan-dialog")).toHaveAttribute(
        "aria-describedby",
        "edit-plan-description"
      );
    });

    it("description has matching id", () => {
      render(<EditPlanDialog {...defaultProps} />);
      const description = screen.getByText(
        /Edit the plan content in markdown format/
      );
      expect(description).toHaveAttribute("id", "edit-plan-description");
    });
  });

  describe("edge cases", () => {
    it("handles empty initial content", () => {
      render(<EditPlanDialog {...defaultProps} initialContent="" />);
      expect(screen.getByTestId("edit-plan-content")).toHaveValue("");
    });

    it("handles very long content", () => {
      const longContent = "- [ ] Task\n".repeat(100);
      render(<EditPlanDialog {...defaultProps} initialContent={longContent} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(longContent);
    });

    it("handles special characters in content", () => {
      const specialContent = "## Code `example`\n\n```js\nconst x = 1;\n```";
      render(<EditPlanDialog {...defaultProps} initialContent={specialContent} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(specialContent);
    });

    it("handles unicode in content", () => {
      const unicodeContent = "# 计划\n\n- [ ] 任务一 ✓\n- [ ] 任务二 🚀";
      render(<EditPlanDialog {...defaultProps} initialContent={unicodeContent} />);
      expect(screen.getByTestId("edit-plan-content")).toHaveValue(unicodeContent);
    });
  });
});
