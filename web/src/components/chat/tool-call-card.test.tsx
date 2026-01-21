import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolCallCard, ToolCallCardList } from "./tool-call-card";
import type { ToolCall } from "@/store";

function createMockToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: "tool-1",
    name: "read_file",
    arguments: { path: "/test/file.txt" },
    ...overrides,
  };
}

describe("ToolCallCard component", () => {
  describe("basic rendering", () => {
    it("renders with data-testid", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByTestId("tool-call-tool-1")).toBeInTheDocument();
    });

    it("renders tool name", () => {
      const toolCall = createMockToolCall({ name: "search_files" });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("search_files")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} className="custom-class" />);

      expect(screen.getByTestId("tool-call-tool-1")).toHaveClass("custom-class");
    });

    it("renders chevron icon", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
    });

    it("renders tool icon", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByTestId("tool-icon")).toBeInTheDocument();
    });
  });

  describe("status display", () => {
    it("shows 'Running' status when no result", () => {
      const toolCall = createMockToolCall({ result: undefined });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    it("shows 'Complete' status when result is present", () => {
      const toolCall = createMockToolCall({ result: "File contents here" });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("applies pending styling when no result", () => {
      const toolCall = createMockToolCall({ result: undefined });
      render(<ToolCallCard toolCall={toolCall} />);

      const card = screen.getByTestId("tool-call-tool-1");
      expect(card).toHaveClass("border-yellow-500/30");
    });

    it("applies complete styling when result present", () => {
      const toolCall = createMockToolCall({ result: "Done" });
      render(<ToolCallCard toolCall={toolCall} />);

      const card = screen.getByTestId("tool-call-tool-1");
      expect(card).toHaveClass("border-border");
    });
  });

  describe("collapse/expand behavior", () => {
    it("is collapsed by default", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("can be opened by default with defaultOpen prop", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("expands when clicked", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("collapses when clicked again", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles with Enter key", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles with Space key", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: " " });

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("rotates chevron when expanded", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const chevron = screen.getByTestId("chevron-icon");
      expect(chevron).not.toHaveClass("rotate-90");

      fireEvent.click(screen.getByRole("button"));

      expect(chevron).toHaveClass("rotate-90");
    });
  });

  describe("arguments display", () => {
    it("shows arguments when expanded", () => {
      const toolCall = createMockToolCall({
        arguments: { path: "/test/file.txt", encoding: "utf-8" },
      });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      expect(screen.getByText("Arguments")).toBeInTheDocument();
      expect(screen.getByTestId("tool-arguments")).toBeInTheDocument();
    });

    it("formats arguments as JSON", () => {
      const toolCall = createMockToolCall({
        arguments: { query: "test", limit: 10 },
      });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const argsEl = screen.getByTestId("tool-arguments");
      expect(argsEl.textContent).toContain('"query": "test"');
      expect(argsEl.textContent).toContain('"limit": 10');
    });

    it("handles empty arguments", () => {
      const toolCall = createMockToolCall({ arguments: {} });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const argsEl = screen.getByTestId("tool-arguments");
      expect(argsEl.textContent).toBe("{}");
    });

    it("shows argument summary when collapsed", () => {
      const toolCall = createMockToolCall({
        arguments: { path: "/test", encoding: "utf-8" },
      });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("(2 args)")).toBeInTheDocument();
    });

    it("shows single argument summary correctly", () => {
      const toolCall = createMockToolCall({
        arguments: { path: "/test" },
      });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("(path: ...)")).toBeInTheDocument();
    });

    it("shows 'no args' when arguments is empty", () => {
      const toolCall = createMockToolCall({ arguments: {} });
      render(<ToolCallCard toolCall={toolCall} />);

      expect(screen.getByText("(no args)")).toBeInTheDocument();
    });
  });

  describe("result display", () => {
    it("shows result section when result is present", () => {
      const toolCall = createMockToolCall({ result: "File contents here" });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      expect(screen.getByText("Result")).toBeInTheDocument();
      expect(screen.getByTestId("tool-result")).toBeInTheDocument();
    });

    it("displays result content correctly", () => {
      const toolCall = createMockToolCall({ result: "The file contains data" });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      expect(screen.getByText("The file contains data")).toBeInTheDocument();
    });

    it("does not show result section when result is undefined", () => {
      const toolCall = createMockToolCall({ result: undefined });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      expect(screen.queryByText("Result")).not.toBeInTheDocument();
      expect(screen.queryByTestId("tool-result")).not.toBeInTheDocument();
    });

    it("preserves whitespace in result", () => {
      const toolCall = createMockToolCall({
        result: "Line 1\n  Line 2\n    Line 3",
      });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const resultEl = screen.getByTestId("tool-result");
      expect(resultEl).toHaveClass("whitespace-pre-wrap");
    });

    it("handles empty string result", () => {
      const toolCall = createMockToolCall({ result: "" });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      // Empty string is still a result (tool completed)
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-expanded attribute", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded");
    });

    it("has aria-controls linking to content", () => {
      const toolCall = createMockToolCall({ id: "tool-123" });
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-controls", "tool-content-tool-123");
    });

    it("content has correct id matching aria-controls", () => {
      const toolCall = createMockToolCall({ id: "tool-123" });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const content = document.getElementById("tool-content-tool-123");
      expect(content).toBeInTheDocument();
    });

    it("content has aria-hidden when collapsed", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} />);

      const button = screen.getByRole("button");
      const controlsId = button.getAttribute("aria-controls");
      const content = document.getElementById(controlsId!);

      expect(content).toHaveAttribute("aria-hidden", "true");
    });

    it("content has aria-hidden false when expanded", () => {
      const toolCall = createMockToolCall();
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const button = screen.getByRole("button");
      const controlsId = button.getAttribute("aria-controls");
      const content = document.getElementById(controlsId!);

      expect(content).toHaveAttribute("aria-hidden", "false");
    });
  });

  describe("complex arguments", () => {
    it("handles nested objects", () => {
      const toolCall = createMockToolCall({
        arguments: {
          config: { setting: "value", nested: { deep: true } },
        },
      });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const argsEl = screen.getByTestId("tool-arguments");
      expect(argsEl.textContent).toContain('"setting": "value"');
      expect(argsEl.textContent).toContain('"deep": true');
    });

    it("handles arrays in arguments", () => {
      const toolCall = createMockToolCall({
        arguments: { files: ["a.txt", "b.txt", "c.txt"] },
      });
      render(<ToolCallCard toolCall={toolCall} defaultOpen={true} />);

      const argsEl = screen.getByTestId("tool-arguments");
      expect(argsEl.textContent).toContain('"a.txt"');
      expect(argsEl.textContent).toContain('"b.txt"');
      expect(argsEl.textContent).toContain('"c.txt"');
    });
  });
});

describe("ToolCallCardList component", () => {
  describe("basic rendering", () => {
    it("renders with data-testid", () => {
      const toolCalls = [createMockToolCall()];
      render(<ToolCallCardList toolCalls={toolCalls} />);

      expect(screen.getByTestId("tool-call-list")).toBeInTheDocument();
    });

    it("renders all tool calls", () => {
      const toolCalls = [
        createMockToolCall({ id: "tool-1", name: "read_file" }),
        createMockToolCall({ id: "tool-2", name: "write_file" }),
        createMockToolCall({ id: "tool-3", name: "search" }),
      ];
      render(<ToolCallCardList toolCalls={toolCalls} />);

      expect(screen.getByTestId("tool-call-tool-1")).toBeInTheDocument();
      expect(screen.getByTestId("tool-call-tool-2")).toBeInTheDocument();
      expect(screen.getByTestId("tool-call-tool-3")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const toolCalls = [createMockToolCall()];
      render(<ToolCallCardList toolCalls={toolCalls} className="custom-class" />);

      expect(screen.getByTestId("tool-call-list")).toHaveClass("custom-class");
    });
  });

  describe("empty state", () => {
    it("returns null when toolCalls is empty", () => {
      const { container } = render(<ToolCallCardList toolCalls={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("returns null when toolCalls is undefined", () => {
      const { container } = render(
        <ToolCallCardList toolCalls={undefined as unknown as ToolCall[]} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("defaultOpen propagation", () => {
    it("passes defaultOpen to all cards", () => {
      const toolCalls = [
        createMockToolCall({ id: "tool-1" }),
        createMockToolCall({ id: "tool-2" }),
      ];
      render(<ToolCallCardList toolCalls={toolCalls} defaultOpen={true} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("defaults to collapsed when defaultOpen not specified", () => {
      const toolCalls = [
        createMockToolCall({ id: "tool-1" }),
        createMockToolCall({ id: "tool-2" }),
      ];
      render(<ToolCallCardList toolCalls={toolCalls} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });
  });

  describe("independent toggle state", () => {
    it("allows toggling cards independently", () => {
      const toolCalls = [
        createMockToolCall({ id: "tool-1" }),
        createMockToolCall({ id: "tool-2" }),
      ];
      render(<ToolCallCardList toolCalls={toolCalls} />);

      const buttons = screen.getAllByRole("button");

      // Click first button only
      fireEvent.click(buttons[0]);

      // First should be expanded, second should not
      expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
      expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("different tool states", () => {
    it("renders mix of running and complete tools", () => {
      const toolCalls = [
        createMockToolCall({ id: "tool-1", result: "Done" }),
        createMockToolCall({ id: "tool-2", result: undefined }),
      ];
      render(<ToolCallCardList toolCalls={toolCalls} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
      expect(screen.getByText("Running")).toBeInTheDocument();
    });
  });
});
