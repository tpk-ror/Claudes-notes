import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanPanel } from "./plan-panel";
import type { Plan, Task } from "@/store/types";

// Mock shiki to prevent async loading issues
vi.mock("shiki", () => ({
  codeToHtml: vi.fn().mockResolvedValue("<code>mocked code</code>"),
  bundledLanguages: { javascript: {}, typescript: {}, python: {} },
}));

describe("PlanPanel component", () => {
  let onApprove: ReturnType<typeof vi.fn>;
  let onReject: ReturnType<typeof vi.fn>;
  let onEdit: ReturnType<typeof vi.fn>;

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: "task-1",
    planId: "plan-1",
    content: "Test task",
    status: "pending",
    sortOrder: 0,
    ...overrides,
  });

  const createMockPlan = (overrides: Partial<Plan> = {}): Plan => ({
    id: "plan-1",
    sessionId: "session-1",
    title: "Test Plan",
    content: "# Plan Content\n\nThis is the plan details.",
    status: "draft",
    tasks: [
      createMockTask({ id: "task-1", content: "First task", sortOrder: 0 }),
      createMockTask({ id: "task-2", content: "Second task", sortOrder: 1 }),
    ],
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    onApprove = vi.fn();
    onReject = vi.fn();
    onEdit = vi.fn();
  });

  describe("empty state", () => {
    it("renders empty state when plan is null", () => {
      render(<PlanPanel plan={null} />);

      expect(screen.getByTestId("plan-panel-empty")).toBeInTheDocument();
    });

    it("displays 'No plan yet' message in empty state", () => {
      render(<PlanPanel plan={null} />);

      expect(screen.getByText("No plan yet")).toBeInTheDocument();
    });

    it("displays helper text in empty state", () => {
      render(<PlanPanel plan={null} />);

      expect(screen.getByText("Start a conversation to generate a plan")).toBeInTheDocument();
    });

    it("applies custom className to empty state", () => {
      render(<PlanPanel plan={null} className="my-custom-class" />);

      expect(screen.getByTestId("plan-panel-empty")).toHaveClass("my-custom-class");
    });

    it("centers content in empty state", () => {
      render(<PlanPanel plan={null} />);

      const emptyState = screen.getByTestId("plan-panel-empty");
      expect(emptyState).toHaveClass("items-center", "justify-center");
    });
  });

  describe("basic rendering", () => {
    it("renders plan panel with correct data-testid", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByTestId("plan-panel")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<PlanPanel plan={createMockPlan()} className="my-custom-class" />);

      expect(screen.getByTestId("plan-panel")).toHaveClass("my-custom-class");
    });

    it("has flex column layout", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      const panel = screen.getByTestId("plan-panel");
      expect(panel).toHaveClass("flex", "flex-col", "h-full");
    });
  });

  describe("plan title", () => {
    it("displays plan title", () => {
      render(<PlanPanel plan={createMockPlan({ title: "My Feature Plan" })} />);

      expect(screen.getByTestId("plan-title")).toHaveTextContent("My Feature Plan");
    });

    it("displays 'Untitled Plan' when title is empty", () => {
      render(<PlanPanel plan={createMockPlan({ title: "" })} />);

      expect(screen.getByTestId("plan-title")).toHaveTextContent("Untitled Plan");
    });

    it("truncates long titles", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      const title = screen.getByTestId("plan-title");
      expect(title).toHaveClass("truncate");
    });
  });

  describe("status badge", () => {
    it("displays status badge", () => {
      render(<PlanPanel plan={createMockPlan({ status: "draft" })} />);

      expect(screen.getByTestId("plan-status-badge")).toBeInTheDocument();
    });

    it("shows draft status", () => {
      render(<PlanPanel plan={createMockPlan({ status: "draft" })} />);

      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveAttribute("data-status", "draft");
    });

    it("shows approved status", () => {
      render(<PlanPanel plan={createMockPlan({ status: "approved" })} />);

      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveAttribute("data-status", "approved");
    });
  });

  describe("progress bar", () => {
    it("displays progress bar when tasks exist", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("does not display progress bar when no tasks", () => {
      render(<PlanPanel plan={createMockPlan({ tasks: [] })} />);

      expect(screen.queryByTestId("progress-bar")).not.toBeInTheDocument();
    });

    it("shows task count", () => {
      const tasks = [
        createMockTask({ id: "t1", status: "completed" }),
        createMockTask({ id: "t2", status: "pending" }),
        createMockTask({ id: "t3", status: "pending" }),
      ];
      render(<PlanPanel plan={createMockPlan({ tasks })} />);

      expect(screen.getByTestId("progress-task-count")).toHaveTextContent("1/3 tasks");
    });
  });

  describe("task tree", () => {
    it("displays task tree section when tasks exist", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByTestId("plan-tasks-section")).toBeInTheDocument();
    });

    it("shows Tasks heading", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByText("Tasks")).toBeInTheDocument();
    });

    it("displays task tree component", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByTestId("task-tree")).toBeInTheDocument();
    });

    it("renders task items", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByText("First task")).toBeInTheDocument();
      expect(screen.getByText("Second task")).toBeInTheDocument();
    });

    it("does not display task section when no tasks", () => {
      render(<PlanPanel plan={createMockPlan({ tasks: [] })} />);

      expect(screen.queryByTestId("plan-tasks-section")).not.toBeInTheDocument();
    });
  });

  describe("plan content", () => {
    it("displays content section when content exists", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByTestId("plan-content-section")).toBeInTheDocument();
    });

    it("shows Details heading", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      expect(screen.getByText("Details")).toBeInTheDocument();
    });

    it("renders markdown content", () => {
      render(<PlanPanel plan={createMockPlan({ content: "# Heading\n\nParagraph text" })} />);

      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Paragraph text")).toBeInTheDocument();
    });

    it("does not display content section when content is empty", () => {
      render(<PlanPanel plan={createMockPlan({ content: "" })} />);

      expect(screen.queryByTestId("plan-content-section")).not.toBeInTheDocument();
    });
  });

  describe("approval actions", () => {
    it("displays approval actions when callbacks are provided", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.getByTestId("plan-approval-actions")).toBeInTheDocument();
    });

    it("does not display approval actions when callbacks not provided", () => {
      render(<PlanPanel plan={createMockPlan({ status: "draft" })} />);

      expect(screen.queryByTestId("plan-approval-actions")).not.toBeInTheDocument();
    });

    it("displays approve button for draft plans", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.getByTestId("approve-plan-button")).toBeInTheDocument();
    });

    it("displays reject button for draft plans", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.getByTestId("reject-plan-button")).toBeInTheDocument();
    });

    it("does not display actions for approved plans", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "approved" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.queryByTestId("approve-plan-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("reject-plan-button")).not.toBeInTheDocument();
    });

    it("calls onApprove when approve button clicked", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ id: "plan-123", status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).toHaveBeenCalledWith("plan-123");
    });

    it("displays edit button when onEdit is provided", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
        />
      );

      expect(screen.getByTestId("edit-plan-button")).toBeInTheDocument();
    });

    it("does not display edit button when onEdit is not provided", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.queryByTestId("edit-plan-button")).not.toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables approval actions when disabled prop is true", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
          disabled={true}
        />
      );

      expect(screen.getByTestId("approve-plan-button")).toBeDisabled();
      expect(screen.getByTestId("reject-plan-button")).toBeDisabled();
    });

    it("does not call onApprove when disabled", () => {
      render(
        <PlanPanel
          plan={createMockPlan({ status: "draft" })}
          onApprove={onApprove}
          onReject={onReject}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByTestId("approve-plan-button"));

      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  describe("task statuses", () => {
    it("displays pending task with correct indicator", () => {
      const tasks = [createMockTask({ id: "t1", status: "pending" })];
      render(<PlanPanel plan={createMockPlan({ tasks })} />);

      const taskItem = screen.getByTestId("task-item-t1");
      expect(taskItem).toHaveAttribute("data-status", "pending");
    });

    it("displays in-progress task with correct indicator", () => {
      const tasks = [createMockTask({ id: "t1", status: "in_progress" })];
      render(<PlanPanel plan={createMockPlan({ tasks })} />);

      const taskItem = screen.getByTestId("task-item-t1");
      expect(taskItem).toHaveAttribute("data-status", "in_progress");
    });

    it("displays completed task with correct indicator", () => {
      const tasks = [createMockTask({ id: "t1", status: "completed" })];
      render(<PlanPanel plan={createMockPlan({ tasks })} />);

      const taskItem = screen.getByTestId("task-item-t1");
      expect(taskItem).toHaveAttribute("data-status", "completed");
    });
  });

  describe("scrolling", () => {
    it("content area has overflow-y-auto for scrolling", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      const panel = screen.getByTestId("plan-panel");
      // The scrollable area is the second child (after header)
      const contentArea = panel.children[1];
      expect(contentArea).toHaveClass("overflow-y-auto");
    });

    it("content area has flex-1 for growing", () => {
      render(<PlanPanel plan={createMockPlan()} />);

      const panel = screen.getByTestId("plan-panel");
      const contentArea = panel.children[1];
      expect(contentArea).toHaveClass("flex-1");
    });
  });

  describe("edge cases", () => {
    it("handles plan with only title (no content, no tasks)", () => {
      render(<PlanPanel plan={createMockPlan({ content: "", tasks: [] })} />);

      expect(screen.getByTestId("plan-panel")).toBeInTheDocument();
      expect(screen.getByTestId("plan-title")).toHaveTextContent("Test Plan");
      expect(screen.queryByTestId("plan-tasks-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("plan-content-section")).not.toBeInTheDocument();
    });

    it("handles plan with special characters in title", () => {
      render(<PlanPanel plan={createMockPlan({ title: "<script>alert('xss')</script>" })} />);

      // Should be properly escaped, not executed
      expect(screen.getByTestId("plan-title")).toHaveTextContent("<script>alert('xss')</script>");
    });

    it("handles plan with unicode characters", () => {
      render(<PlanPanel plan={createMockPlan({ title: "Plan 📋 世界 🌍" })} />);

      expect(screen.getByTestId("plan-title")).toHaveTextContent("Plan 📋 世界 🌍");
    });
  });
});
