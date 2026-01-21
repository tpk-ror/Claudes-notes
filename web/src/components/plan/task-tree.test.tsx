import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskTree, TaskTreeItem } from "./task-tree";
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

describe("TaskTreeItem component", () => {
  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const task = createMockTask({ id: "task-abc" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByTestId("task-item-task-abc")).toBeInTheDocument();
    });

    it("renders task content", () => {
      const task = createMockTask({ content: "My task description" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByText("My task description")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const task = createMockTask();
      render(<TaskTreeItem task={task} className="my-custom-class" />);

      const item = screen.getByTestId("task-item-task-1");
      expect(item).toHaveClass("my-custom-class");
    });

    it("renders data-status attribute", () => {
      const task = createMockTask({ status: "in_progress" });
      render(<TaskTreeItem task={task} />);

      const item = screen.getByTestId("task-item-task-1");
      expect(item).toHaveAttribute("data-status", "in_progress");
    });
  });

  describe("status indicators", () => {
    it("shows ○ indicator for pending status", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByText("○")).toBeInTheDocument();
    });

    it("shows ◐ indicator for in_progress status", () => {
      const task = createMockTask({ status: "in_progress" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByText("◐")).toBeInTheDocument();
    });

    it("shows ● indicator for completed status", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByText("●")).toBeInTheDocument();
    });

    it("has accessible aria-label for pending status", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByLabelText("Pending")).toBeInTheDocument();
    });

    it("has accessible aria-label for in_progress status", () => {
      const task = createMockTask({ status: "in_progress" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByLabelText("In progress")).toBeInTheDocument();
    });

    it("has accessible aria-label for completed status", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskTreeItem task={task} />);

      expect(screen.getByLabelText("Completed")).toBeInTheDocument();
    });
  });

  describe("status styling", () => {
    it("applies line-through and muted color for completed tasks", () => {
      const task = createMockTask({ status: "completed" });
      render(<TaskTreeItem task={task} />);

      const content = screen.getByText(task.content);
      expect(content).toHaveClass("line-through");
      expect(content).toHaveClass("text-muted-foreground");
    });

    it("applies primary color and font-medium for in_progress tasks", () => {
      const task = createMockTask({ status: "in_progress" });
      render(<TaskTreeItem task={task} />);

      const content = screen.getByText(task.content);
      expect(content).toHaveClass("text-primary");
      expect(content).toHaveClass("font-medium");
    });

    it("does not apply special styling for pending tasks", () => {
      const task = createMockTask({ status: "pending" });
      render(<TaskTreeItem task={task} />);

      const content = screen.getByText(task.content);
      expect(content).not.toHaveClass("line-through");
      expect(content).not.toHaveClass("text-primary");
    });
  });

  describe("nested children", () => {
    it("renders children in a nested list", () => {
      const task = createMockTask();
      const childTask = createMockTask({ id: "child-1", content: "Child task" });

      render(
        <TaskTreeItem task={task}>
          <TaskTreeItem task={childTask} />
        </TaskTreeItem>
      );

      expect(screen.getByText("Child task")).toBeInTheDocument();
    });

    it("applies indentation styling to nested children container", () => {
      const task = createMockTask();
      const childTask = createMockTask({ id: "child-1", content: "Child task" });

      render(
        <TaskTreeItem task={task}>
          <TaskTreeItem task={childTask} />
        </TaskTreeItem>
      );

      const parentItem = screen.getByTestId("task-item-task-1");
      const nestedList = parentItem.querySelector("ul");
      expect(nestedList).toHaveClass("ml-6");
      expect(nestedList).toHaveClass("border-l");
      expect(nestedList).toHaveClass("pl-4");
    });

    it("does not render nested list when no children", () => {
      const task = createMockTask();
      render(<TaskTreeItem task={task} />);

      const item = screen.getByTestId("task-item-task-1");
      const nestedList = item.querySelector("ul");
      expect(nestedList).toBeNull();
    });
  });
});

describe("TaskTree component", () => {
  describe("empty state", () => {
    it("shows empty message when no tasks", () => {
      render(<TaskTree tasks={[]} />);

      expect(screen.getByText("No tasks available")).toBeInTheDocument();
    });

    it("shows empty message with data-testid", () => {
      render(<TaskTree tasks={[]} />);

      expect(screen.getByTestId("task-tree-empty")).toBeInTheDocument();
    });

    it("applies custom className to empty state", () => {
      render(<TaskTree tasks={[]} className="my-custom-class" />);

      const empty = screen.getByTestId("task-tree-empty");
      expect(empty).toHaveClass("my-custom-class");
    });

    it("handles undefined tasks", () => {
      render(<TaskTree tasks={undefined as unknown as Task[]} />);

      expect(screen.getByText("No tasks available")).toBeInTheDocument();
    });
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const tasks = [createMockTask()];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByTestId("task-tree")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const tasks = [createMockTask()];
      render(<TaskTree tasks={tasks} className="my-tree-class" />);

      expect(screen.getByTestId("task-tree")).toHaveClass("my-tree-class");
    });

    it("has role=list for accessibility", () => {
      const tasks = [createMockTask()];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      const tasks = [createMockTask()];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByLabelText("Task list")).toBeInTheDocument();
    });
  });

  describe("flat task list", () => {
    it("renders a single root task", () => {
      const tasks = [createMockTask({ id: "task-1", content: "First task" })];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText("First task")).toBeInTheDocument();
      expect(screen.getByTestId("task-item-task-1")).toBeInTheDocument();
    });

    it("renders multiple root tasks", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "First task", sortOrder: 0 }),
        createMockTask({ id: "task-2", content: "Second task", sortOrder: 1 }),
        createMockTask({ id: "task-3", content: "Third task", sortOrder: 2 }),
      ];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText("First task")).toBeInTheDocument();
      expect(screen.getByText("Second task")).toBeInTheDocument();
      expect(screen.getByText("Third task")).toBeInTheDocument();
    });

    it("renders tasks in sortOrder", () => {
      const tasks = [
        createMockTask({ id: "task-3", content: "Third task", sortOrder: 2 }),
        createMockTask({ id: "task-1", content: "First task", sortOrder: 0 }),
        createMockTask({ id: "task-2", content: "Second task", sortOrder: 1 }),
      ];
      render(<TaskTree tasks={tasks} />);

      const tree = screen.getByTestId("task-tree");
      const items = tree.querySelectorAll('[data-testid^="task-item-"]');

      expect(items[0]).toHaveAttribute("data-testid", "task-item-task-1");
      expect(items[1]).toHaveAttribute("data-testid", "task-item-task-2");
      expect(items[2]).toHaveAttribute("data-testid", "task-item-task-3");
    });
  });

  describe("hierarchical task tree", () => {
    it("renders nested tasks under their parent", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Parent task", sortOrder: 0 }),
        createMockTask({
          id: "task-2",
          parentId: "task-1",
          content: "Child task",
          sortOrder: 1,
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText("Parent task")).toBeInTheDocument();
      expect(screen.getByText("Child task")).toBeInTheDocument();

      // Child should be inside parent's nested list
      const parentItem = screen.getByTestId("task-item-task-1");
      const nestedList = parentItem.querySelector("ul");
      expect(nestedList).toBeInTheDocument();
      expect(nestedList).toContainElement(screen.getByTestId("task-item-task-2"));
    });

    it("renders multiple levels of nesting", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Level 0", sortOrder: 0 }),
        createMockTask({
          id: "task-2",
          parentId: "task-1",
          content: "Level 1",
          sortOrder: 1,
        }),
        createMockTask({
          id: "task-3",
          parentId: "task-2",
          content: "Level 2",
          sortOrder: 2,
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText("Level 0")).toBeInTheDocument();
      expect(screen.getByText("Level 1")).toBeInTheDocument();
      expect(screen.getByText("Level 2")).toBeInTheDocument();

      // Verify hierarchy structure
      const level0 = screen.getByTestId("task-item-task-1");
      const level1 = screen.getByTestId("task-item-task-2");
      const level2 = screen.getByTestId("task-item-task-3");

      expect(level0).toContainElement(level1);
      expect(level1).toContainElement(level2);
    });

    it("renders siblings at the same nesting level", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Parent", sortOrder: 0 }),
        createMockTask({
          id: "task-2",
          parentId: "task-1",
          content: "Child 1",
          sortOrder: 1,
        }),
        createMockTask({
          id: "task-3",
          parentId: "task-1",
          content: "Child 2",
          sortOrder: 2,
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      const parentItem = screen.getByTestId("task-item-task-1");
      const nestedList = parentItem.querySelector("ul");

      expect(nestedList).toContainElement(screen.getByTestId("task-item-task-2"));
      expect(nestedList).toContainElement(screen.getByTestId("task-item-task-3"));
    });

    it("renders complex tree structure correctly", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Root 1", sortOrder: 0 }),
        createMockTask({
          id: "task-1a",
          parentId: "task-1",
          content: "Child 1a",
          sortOrder: 1,
        }),
        createMockTask({
          id: "task-1b",
          parentId: "task-1",
          content: "Child 1b",
          sortOrder: 2,
        }),
        createMockTask({
          id: "task-1a1",
          parentId: "task-1a",
          content: "Grandchild 1a1",
          sortOrder: 3,
        }),
        createMockTask({ id: "task-2", content: "Root 2", sortOrder: 4 }),
      ];
      render(<TaskTree tasks={tasks} />);

      // All tasks should be visible
      expect(screen.getByText("Root 1")).toBeInTheDocument();
      expect(screen.getByText("Child 1a")).toBeInTheDocument();
      expect(screen.getByText("Child 1b")).toBeInTheDocument();
      expect(screen.getByText("Grandchild 1a1")).toBeInTheDocument();
      expect(screen.getByText("Root 2")).toBeInTheDocument();

      // Verify grandchild is nested under child
      const child1a = screen.getByTestId("task-item-task-1a");
      expect(child1a).toContainElement(screen.getByTestId("task-item-task-1a1"));
    });
  });

  describe("mixed status rendering", () => {
    it("renders tasks with different statuses correctly", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Pending task", status: "pending", sortOrder: 0 }),
        createMockTask({
          id: "task-2",
          content: "In progress task",
          status: "in_progress",
          sortOrder: 1,
        }),
        createMockTask({
          id: "task-3",
          content: "Completed task",
          status: "completed",
          sortOrder: 2,
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      // Check status indicators
      expect(screen.getByText("○")).toBeInTheDocument();
      expect(screen.getByText("◐")).toBeInTheDocument();
      expect(screen.getByText("●")).toBeInTheDocument();

      // Check styling
      const inProgressContent = screen.getByText("In progress task");
      expect(inProgressContent).toHaveClass("text-primary");

      const completedContent = screen.getByText("Completed task");
      expect(completedContent).toHaveClass("line-through");
    });
  });

  describe("reactivity", () => {
    it("updates when tasks prop changes", () => {
      const initialTasks = [createMockTask({ id: "task-1", content: "Initial task" })];
      const { rerender } = render(<TaskTree tasks={initialTasks} />);

      expect(screen.getByText("Initial task")).toBeInTheDocument();

      const updatedTasks = [
        createMockTask({ id: "task-1", content: "Updated task" }),
        createMockTask({ id: "task-2", content: "New task" }),
      ];
      rerender(<TaskTree tasks={updatedTasks} />);

      expect(screen.getByText("Updated task")).toBeInTheDocument();
      expect(screen.getByText("New task")).toBeInTheDocument();
    });

    it("updates when task status changes", () => {
      const initialTasks = [createMockTask({ id: "task-1", status: "pending" })];
      const { rerender } = render(<TaskTree tasks={initialTasks} />);

      expect(screen.getByText("○")).toBeInTheDocument();

      const updatedTasks = [createMockTask({ id: "task-1", status: "completed" })];
      rerender(<TaskTree tasks={updatedTasks} />);

      expect(screen.getByText("●")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles tasks with special characters in content", () => {
      const tasks = [
        createMockTask({
          id: "task-1",
          content: "Task with <html> & special \"chars\"",
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText('Task with <html> & special "chars"')).toBeInTheDocument();
    });

    it("handles very long task content", () => {
      const longContent = "A".repeat(500);
      const tasks = [createMockTask({ id: "task-1", content: longContent })];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("handles tasks with unicode content", () => {
      const tasks = [
        createMockTask({ id: "task-1", content: "Task with emoji 🚀 and unicode 中文" }),
      ];
      render(<TaskTree tasks={tasks} />);

      expect(screen.getByText("Task with emoji 🚀 and unicode 中文")).toBeInTheDocument();
    });

    it("handles orphaned child tasks gracefully", () => {
      // Child task with non-existent parentId
      const tasks = [
        createMockTask({
          id: "orphan",
          parentId: "non-existent",
          content: "Orphaned task",
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      // Orphaned tasks should not appear since their parent doesn't exist
      // and they're not root tasks
      expect(screen.queryByText("Orphaned task")).not.toBeInTheDocument();
    });

    it("renders root tasks when some tasks are orphaned", () => {
      const tasks = [
        createMockTask({ id: "root-1", content: "Root task" }),
        createMockTask({
          id: "orphan",
          parentId: "non-existent",
          content: "Orphaned task",
        }),
      ];
      render(<TaskTree tasks={tasks} />);

      // Root task should still render
      expect(screen.getByText("Root task")).toBeInTheDocument();
    });
  });
});
