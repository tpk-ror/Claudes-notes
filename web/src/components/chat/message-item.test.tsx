import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageItem } from "./message-item";
import type { Message } from "@/store";

// Mock matchMedia for AsciiMascot component
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function createMockMessage(
  overrides: Partial<Message> = {}
): Message {
  return {
    id: "msg-1",
    sessionId: "session-1",
    role: "user",
    content: "Hello, world!",
    timestamp: new Date("2026-01-19T10:30:00"),
    ...overrides,
  };
}

describe("MessageItem component", () => {
  describe("basic rendering", () => {
    it("renders user message", () => {
      const message = createMockMessage({ role: "user", content: "Hello" });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
      expect(screen.getByText("user")).toBeInTheDocument();
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("renders assistant message", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Hi there!",
      });
      render(<MessageItem message={message} />);

      expect(screen.getByText("assistant")).toBeInTheDocument();
      expect(screen.getByText("Hi there!")).toBeInTheDocument();
    });

    it("renders system message", () => {
      const message = createMockMessage({
        role: "system",
        content: "System notification",
      });
      render(<MessageItem message={message} />);

      expect(screen.getByText("system")).toBeInTheDocument();
      expect(screen.getByText("System notification")).toBeInTheDocument();
    });

    it("sets data-role attribute correctly", () => {
      const message = createMockMessage({ role: "assistant" });
      render(<MessageItem message={message} />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveAttribute("data-role", "assistant");
    });
  });

  describe("styling by role", () => {
    it("applies user-specific styling", () => {
      const message = createMockMessage({ role: "user" });
      render(<MessageItem message={message} />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveClass("items-end");
    });

    it("applies assistant-specific styling", () => {
      const message = createMockMessage({ role: "assistant" });
      render(<MessageItem message={message} />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveClass("items-start");
    });

    it("applies system-specific styling", () => {
      const message = createMockMessage({ role: "system" });
      render(<MessageItem message={message} />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveClass("items-center");
    });

    it("applies custom className", () => {
      const message = createMockMessage();
      render(<MessageItem message={message} className="custom-class" />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveClass("custom-class");
    });
  });

  describe("streaming indicator", () => {
    it("shows streaming indicator when isStreaming is true", () => {
      const message = createMockMessage({ role: "assistant", content: "Streaming..." });
      render(<MessageItem message={message} isStreaming={true} />);

      expect(screen.getByTestId("streaming-indicator")).toBeInTheDocument();
    });

    it("hides streaming indicator when isStreaming is false", () => {
      const message = createMockMessage({ role: "assistant", content: "Complete" });
      render(<MessageItem message={message} isStreaming={false} />);

      expect(screen.queryByTestId("streaming-indicator")).not.toBeInTheDocument();
    });

    it("does not show streaming indicator by default", () => {
      const message = createMockMessage({ role: "assistant", content: "Message" });
      render(<MessageItem message={message} />);

      expect(screen.queryByTestId("streaming-indicator")).not.toBeInTheDocument();
    });
  });

  describe("tool calls", () => {
    it("renders tool calls when present", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Let me help with that.",
        toolCalls: [
          {
            id: "tool-1",
            name: "read_file",
            arguments: { path: "/test/file.txt" },
          },
        ],
      });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("tool-call-tool-1")).toBeInTheDocument();
      expect(screen.getByText("read_file")).toBeInTheDocument();
    });

    it("renders tool call arguments as JSON when expanded", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Checking...",
        toolCalls: [
          {
            id: "tool-1",
            name: "search",
            arguments: { query: "test", limit: 10 },
          },
        ],
      });
      render(<MessageItem message={message} />);

      // Expand the tool card to see arguments
      fireEvent.click(screen.getByRole("button", { expanded: false }));

      // Arguments should be displayed
      expect(screen.getByText(/"query": "test"/)).toBeInTheDocument();
    });

    it("renders tool result when present and expanded", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Here is the result.",
        toolCalls: [
          {
            id: "tool-1",
            name: "read_file",
            arguments: { path: "/test.txt" },
            result: "File content here",
          },
        ],
      });
      render(<MessageItem message={message} />);

      // Expand the tool card to see result
      fireEvent.click(screen.getByRole("button", { expanded: false }));

      expect(screen.getByText("Result")).toBeInTheDocument();
      expect(screen.getByText("File content here")).toBeInTheDocument();
    });

    it("renders multiple tool calls", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Running tools...",
        toolCalls: [
          { id: "tool-1", name: "tool_a", arguments: {} },
          { id: "tool-2", name: "tool_b", arguments: {} },
        ],
      });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("tool-call-tool-1")).toBeInTheDocument();
      expect(screen.getByTestId("tool-call-tool-2")).toBeInTheDocument();
    });

    it("does not render tool calls section when empty", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "No tools",
        toolCalls: [],
      });
      render(<MessageItem message={message} />);

      expect(screen.queryByTestId("tool-call-list")).not.toBeInTheDocument();
    });
  });

  describe("thinking blocks", () => {
    it("renders thinking blocks when present", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Answer",
        thinkingBlocks: [
          { id: "think-1", content: "Let me think about this..." },
        ],
      });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("thinking-block-think-1")).toBeInTheDocument();
      expect(screen.getByText("Thinking")).toBeInTheDocument();
    });

    it("thinking block is collapsible with button", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Answer",
        thinkingBlocks: [
          { id: "think-1", content: "Deep thoughts here" },
        ],
      });
      render(<MessageItem message={message} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded");
    });

    it("renders multiple thinking blocks", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Answer",
        thinkingBlocks: [
          { id: "think-1", content: "First thought" },
          { id: "think-2", content: "Second thought" },
        ],
      });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("thinking-block-think-1")).toBeInTheDocument();
      expect(screen.getByTestId("thinking-block-think-2")).toBeInTheDocument();
    });

    it("does not render thinking blocks section when empty", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Answer",
        thinkingBlocks: [],
      });
      render(<MessageItem message={message} />);

      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
    });
  });

  describe("timestamp", () => {
    it("renders formatted timestamp", () => {
      const message = createMockMessage({
        timestamp: new Date("2026-01-19T14:30:00"),
      });
      render(<MessageItem message={message} />);

      // Should display time in locale format (e.g., "2:30 PM" or "14:30")
      const messageEl = screen.getByTestId("message-msg-1");
      // Check that some time is displayed
      expect(messageEl).toHaveTextContent(/\d{1,2}:\d{2}/);
    });

    it("handles string timestamps from JSON", () => {
      const message = createMockMessage();
      // Simulate what happens when message comes from JSON (timestamp as string)
      const jsonMessage = JSON.parse(JSON.stringify(message));
      render(<MessageItem message={jsonMessage} />);

      const messageEl = screen.getByTestId("message-msg-1");
      expect(messageEl).toHaveTextContent(/\d{1,2}:\d{2}/);
    });
  });

  describe("content rendering", () => {
    it("preserves whitespace in user content", () => {
      const message = createMockMessage({
        role: "user",
        content: "Line 1\n  Line 2\n    Line 3",
      });
      render(<MessageItem message={message} />);

      const messageEl = screen.getByTestId("message-msg-1");
      const contentDiv = messageEl.querySelector(".whitespace-pre-wrap");
      expect(contentDiv).toBeInTheDocument();
    });

    it("handles empty content", () => {
      const message = createMockMessage({ content: "" });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
    });

    it("handles long content", () => {
      const longContent = "A".repeat(1000);
      const message = createMockMessage({ content: longContent });
      render(<MessageItem message={message} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  describe("markdown rendering for assistant messages", () => {
    it("renders markdown for assistant messages", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "# Hello\n\nThis is **bold** text.",
      });
      render(<MessageItem message={message} />);

      // Should render markdown - check for rendered heading
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello");
      expect(screen.getByText("bold").tagName.toLowerCase()).toBe("strong");
    });

    it("renders code blocks in assistant messages", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "```javascript\nconst x = 1;\n```",
      });
      render(<MessageItem message={message} />);

      const pre = screen.getByText(/const x = 1/).closest("pre");
      expect(pre).toBeInTheDocument();
    });

    it("renders lists in assistant messages", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "- Item 1\n- Item 2\n- Item 3",
      });
      render(<MessageItem message={message} />);

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("does not render markdown for user messages", () => {
      const message = createMockMessage({
        role: "user",
        content: "# Not a heading",
      });
      render(<MessageItem message={message} />);

      // Should not render as markdown heading
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.getByText("# Not a heading")).toBeInTheDocument();
    });

    it("does not render markdown for system messages", () => {
      const message = createMockMessage({
        role: "system",
        content: "**Not bold**",
      });
      render(<MessageItem message={message} />);

      // Should not render as markdown bold
      expect(screen.getByText("**Not bold**")).toBeInTheDocument();
    });

    it("shows markdown renderer component for assistant messages", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "Hello",
      });
      render(<MessageItem message={message} />);

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });
  });
});
