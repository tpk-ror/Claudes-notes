import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, calculateTaskProgress } from "./progress-bar";
import type { Task } from "@/store";

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    planId: "plan-1",
    parentId: undefined,
    content: "Test task content",
    status: "pending",
    sortOrder: 0,
    ...overrides,
  };
}

describe("calculateTaskProgress", () => {
  it("returns zeros for empty array", () => {
    const result = calculateTaskProgress([]);

    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("returns zeros for undefined tasks", () => {
    const result = calculateTaskProgress(undefined as unknown as Task[]);

    expect(result.total).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("calculates correct counts for all pending tasks", () => {
    const tasks = [
      createMockTask({ id: "1", status: "pending" }),
      createMockTask({ id: "2", status: "pending" }),
      createMockTask({ id: "3", status: "pending" }),
    ];
    const result = calculateTaskProgress(tasks);

    expect(result.total).toBe(3);
    expect(result.pending).toBe(3);
    expect(result.completed).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("calculates correct counts for all completed tasks", () => {
    const tasks = [
      createMockTask({ id: "1", status: "completed" }),
      createMockTask({ id: "2", status: "completed" }),
    ];
    const result = calculateTaskProgress(tasks);

    expect(result.total).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.percent).toBe(100);
  });

  it("calculates correct counts for mixed statuses", () => {
    const tasks = [
      createMockTask({ id: "1", status: "pending" }),
      createMockTask({ id: "2", status: "in_progress" }),
      createMockTask({ id: "3", status: "completed" }),
      createMockTask({ id: "4", status: "completed" }),
    ];
    const result = calculateTaskProgress(tasks);

    expect(result.total).toBe(4);
    expect(result.pending).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.completed).toBe(2);
    expect(result.percent).toBe(50);
  });

  it("rounds percentage correctly", () => {
    const tasks = [
      createMockTask({ id: "1", status: "completed" }),
      createMockTask({ id: "2", status: "pending" }),
      createMockTask({ id: "3", status: "pending" }),
    ];
    const result = calculateTaskProgress(tasks);

    expect(result.percent).toBe(33); // 1/3 = 33.33... rounded to 33
  });
});

describe("ProgressBar component", () => {
  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("renders the fill element", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByTestId("progress-bar-fill")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<ProgressBar progress={50} className="my-custom-class" />);

      expect(screen.getByTestId("progress-bar")).toHaveClass("my-custom-class");
    });

    it("has data-progress attribute", () => {
      render(<ProgressBar progress={75} />);

      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-progress",
        "75"
      );
    });
  });

  describe("progress from direct value", () => {
    it("shows 0% progress", () => {
      render(<ProgressBar progress={0} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "0%" });
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("shows 50% progress", () => {
      render(<ProgressBar progress={50} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "50%" });
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("shows 100% progress", () => {
      render(<ProgressBar progress={100} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "100%" });
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps progress above 100 to 100", () => {
      render(<ProgressBar progress={150} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "100%" });
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps progress below 0 to 0", () => {
      render(<ProgressBar progress={-10} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "0%" });
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("progress from tasks", () => {
    it("calculates progress from task array", () => {
      const tasks = [
        createMockTask({ id: "1", status: "completed" }),
        createMockTask({ id: "2", status: "completed" }),
        createMockTask({ id: "3", status: "pending" }),
        createMockTask({ id: "4", status: "pending" }),
      ];
      render(<ProgressBar tasks={tasks} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "50%" });
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("shows 0% for all pending tasks", () => {
      const tasks = [
        createMockTask({ id: "1", status: "pending" }),
        createMockTask({ id: "2", status: "pending" }),
      ];
      render(<ProgressBar tasks={tasks} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("shows 100% for all completed tasks", () => {
      const tasks = [
        createMockTask({ id: "1", status: "completed" }),
        createMockTask({ id: "2", status: "completed" }),
      ];
      render(<ProgressBar tasks={tasks} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("shows 0% for empty tasks array", () => {
      render(<ProgressBar tasks={[]} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("prefers tasks over progress prop", () => {
      const tasks = [
        createMockTask({ id: "1", status: "completed" }),
        createMockTask({ id: "2", status: "pending" }),
      ];
      render(<ProgressBar tasks={tasks} progress={99} />);

      // Should show 50% from tasks, not 99% from progress prop
      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });

  describe("percentage display", () => {
    it("shows percentage by default", () => {
      render(<ProgressBar progress={75} />);

      expect(screen.getByTestId("progress-percentage")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("hides percentage when showPercentage is false", () => {
      render(<ProgressBar progress={75} showPercentage={false} />);

      expect(screen.queryByTestId("progress-percentage")).not.toBeInTheDocument();
    });
  });

  describe("task count display", () => {
    it("hides task count by default", () => {
      const tasks = [createMockTask({ status: "completed" })];
      render(<ProgressBar tasks={tasks} />);

      expect(screen.queryByTestId("progress-task-count")).not.toBeInTheDocument();
    });

    it("shows task count when showTaskCount is true", () => {
      const tasks = [
        createMockTask({ id: "1", status: "completed" }),
        createMockTask({ id: "2", status: "completed" }),
        createMockTask({ id: "3", status: "pending" }),
      ];
      render(<ProgressBar tasks={tasks} showTaskCount />);

      expect(screen.getByTestId("progress-task-count")).toBeInTheDocument();
      expect(screen.getByText("2/3 tasks")).toBeInTheDocument();
    });

    it("does not show task count without tasks prop", () => {
      render(<ProgressBar progress={50} showTaskCount />);

      expect(screen.queryByTestId("progress-task-count")).not.toBeInTheDocument();
    });

    it("shows 0/0 tasks for empty array", () => {
      render(<ProgressBar tasks={[]} showTaskCount />);

      expect(screen.getByText("0/0 tasks")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has role=progressbar", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("has aria-valuenow", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "50"
      );
    });

    it("has aria-valuemin of 0", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuemin",
        "0"
      );
    });

    it("has aria-valuemax of 100", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuemax",
        "100"
      );
    });

    it("has aria-label with progress", () => {
      render(<ProgressBar progress={75} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-label",
        "Progress: 75%"
      );
    });
  });

  describe("size variants", () => {
    it("uses medium size by default", () => {
      render(<ProgressBar progress={50} />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("h-2");
    });

    it("applies small size", () => {
      render(<ProgressBar progress={50} size="sm" />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("h-1");
    });

    it("applies medium size explicitly", () => {
      render(<ProgressBar progress={50} size="md" />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("h-2");
    });

    it("applies large size", () => {
      render(<ProgressBar progress={50} size="lg" />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("h-3");
    });
  });

  describe("color variants", () => {
    it("uses primary color for low progress (0-24%)", () => {
      render(<ProgressBar progress={20} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("bg-primary");
    });

    it("uses orange color for 25-49% progress", () => {
      render(<ProgressBar progress={30} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("bg-orange-500");
    });

    it("uses yellow color for 50-74% progress", () => {
      render(<ProgressBar progress={60} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("bg-yellow-500");
    });

    it("uses blue color for 75-99% progress", () => {
      render(<ProgressBar progress={80} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("bg-blue-500");
    });

    it("uses green color for 100% progress", () => {
      render(<ProgressBar progress={100} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("bg-green-500");
    });
  });

  describe("styling", () => {
    it("has rounded-full on track and fill", () => {
      render(<ProgressBar progress={50} />);

      const bar = screen.getByRole("progressbar");
      const fill = screen.getByTestId("progress-bar-fill");

      expect(bar).toHaveClass("rounded-full");
      expect(fill).toHaveClass("rounded-full");
    });

    it("has bg-muted on track", () => {
      render(<ProgressBar progress={50} />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("bg-muted");
    });

    it("has overflow-hidden on track", () => {
      render(<ProgressBar progress={50} />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveClass("overflow-hidden");
    });

    it("has transition class on fill", () => {
      render(<ProgressBar progress={50} />);

      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveClass("transition-all");
    });

    it("has w-full on container", () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByTestId("progress-bar")).toHaveClass("w-full");
    });
  });

  describe("reactivity", () => {
    it("updates when progress prop changes", () => {
      const { rerender } = render(<ProgressBar progress={25} />);

      expect(screen.getByText("25%")).toBeInTheDocument();
      const fill = screen.getByTestId("progress-bar-fill");
      expect(fill).toHaveStyle({ width: "25%" });

      rerender(<ProgressBar progress={75} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(fill).toHaveStyle({ width: "75%" });
    });

    it("updates when tasks prop changes", () => {
      const initialTasks = [createMockTask({ id: "1", status: "pending" })];
      const { rerender } = render(<ProgressBar tasks={initialTasks} />);

      expect(screen.getByText("0%")).toBeInTheDocument();

      const updatedTasks = [createMockTask({ id: "1", status: "completed" })];
      rerender(<ProgressBar tasks={updatedTasks} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles undefined progress gracefully", () => {
      render(<ProgressBar />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles both showPercentage and showTaskCount", () => {
      const tasks = [
        createMockTask({ id: "1", status: "completed" }),
        createMockTask({ id: "2", status: "pending" }),
      ];
      render(<ProgressBar tasks={tasks} showPercentage showTaskCount />);

      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("1/2 tasks")).toBeInTheDocument();
    });

    it("handles neither showPercentage nor showTaskCount", () => {
      render(<ProgressBar progress={50} showPercentage={false} />);

      // Only the progress bar should render, no labels
      expect(screen.queryByTestId("progress-percentage")).not.toBeInTheDocument();
      expect(screen.queryByTestId("progress-task-count")).not.toBeInTheDocument();
    });
  });
});
