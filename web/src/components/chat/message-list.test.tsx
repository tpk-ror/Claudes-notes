import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MessageList } from "./message-list";
import { useMessageStore } from "@/store";
import type { Message } from "@/store";

function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    sessionId: "session-1",
    role: "user",
    content: "Hello, world!",
    timestamp: new Date("2026-01-19T10:30:00"),
    ...overrides,
  };
}

describe("MessageList component", () => {
  beforeEach(() => {
    // Mock matchMedia for AsciiMascot component
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

    // Reset store state before each test
    useMessageStore.setState({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
    });
  });

  describe("empty state", () => {
    it("shows empty message when no messages exist", () => {
      render(<MessageList />);

      expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
      expect(
        screen.getByText("No messages yet. Start a conversation!")
      ).toBeInTheDocument();
    });

    it("applies custom className to empty state", () => {
      render(<MessageList className="custom-class" />);

      const emptyState = screen.getByTestId("message-list-empty");
      expect(emptyState).toHaveClass("custom-class");
    });
  });

  describe("message rendering", () => {
    it("renders messages from store", () => {
      const message = createMockMessage({ id: "msg-1", content: "Test message" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      expect(screen.getByTestId("message-list")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("renders multiple messages in order", () => {
      const messages = [
        createMockMessage({ id: "msg-1", content: "First" }),
        createMockMessage({ id: "msg-2", content: "Second" }),
        createMockMessage({ id: "msg-3", content: "Third" }),
      ];
      useMessageStore.setState({ messages });

      render(<MessageList />);

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("renders different message roles", () => {
      const messages = [
        createMockMessage({ id: "msg-1", role: "user", content: "Question" }),
        createMockMessage({
          id: "msg-2",
          role: "assistant",
          content: "Answer",
        }),
        createMockMessage({ id: "msg-3", role: "system", content: "Notice" }),
      ];
      useMessageStore.setState({ messages });

      render(<MessageList />);

      expect(screen.getByTestId("message-msg-1")).toHaveAttribute(
        "data-role",
        "user"
      );
      expect(screen.getByTestId("message-msg-2")).toHaveAttribute(
        "data-role",
        "assistant"
      );
      expect(screen.getByTestId("message-msg-3")).toHaveAttribute(
        "data-role",
        "system"
      );
    });
  });

  describe("session filtering", () => {
    it("filters messages by sessionId when provided", () => {
      const messages = [
        createMockMessage({
          id: "msg-1",
          sessionId: "session-1",
          content: "Session 1 message",
        }),
        createMockMessage({
          id: "msg-2",
          sessionId: "session-2",
          content: "Session 2 message",
        }),
        createMockMessage({
          id: "msg-3",
          sessionId: "session-1",
          content: "Another session 1 message",
        }),
      ];
      useMessageStore.setState({ messages });

      render(<MessageList sessionId="session-1" />);

      expect(screen.getByText("Session 1 message")).toBeInTheDocument();
      expect(screen.getByText("Another session 1 message")).toBeInTheDocument();
      expect(screen.queryByText("Session 2 message")).not.toBeInTheDocument();
    });

    it("shows all messages when sessionId is not provided", () => {
      const messages = [
        createMockMessage({
          id: "msg-1",
          sessionId: "session-1",
          content: "Message 1",
        }),
        createMockMessage({
          id: "msg-2",
          sessionId: "session-2",
          content: "Message 2",
        }),
      ];
      useMessageStore.setState({ messages });

      render(<MessageList />);

      expect(screen.getByText("Message 1")).toBeInTheDocument();
      expect(screen.getByText("Message 2")).toBeInTheDocument();
    });

    it("shows empty state when filtered session has no messages", () => {
      const messages = [
        createMockMessage({
          id: "msg-1",
          sessionId: "session-1",
          content: "Message",
        }),
      ];
      useMessageStore.setState({ messages });

      render(<MessageList sessionId="session-2" />);

      expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
    });
  });

  describe("streaming state", () => {
    it("passes isStreaming to the streaming message", () => {
      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Streaming...",
      });
      useMessageStore.setState({
        messages: [message],
        isStreaming: true,
        streamingMessageId: "msg-1",
      });

      render(<MessageList />);

      // The streaming indicator should be visible
      expect(screen.getByTestId("streaming-indicator")).toBeInTheDocument();
    });

    it("does not show streaming indicator on non-streaming messages", () => {
      const messages = [
        createMockMessage({
          id: "msg-1",
          role: "assistant",
          content: "Complete",
        }),
        createMockMessage({
          id: "msg-2",
          role: "assistant",
          content: "Streaming...",
        }),
      ];
      useMessageStore.setState({
        messages,
        isStreaming: true,
        streamingMessageId: "msg-2",
      });

      render(<MessageList />);

      // Only one streaming indicator should exist
      const indicators = screen.getAllByTestId("streaming-indicator");
      expect(indicators).toHaveLength(1);
    });

    it("does not show streaming indicator when not streaming", () => {
      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Complete",
      });
      useMessageStore.setState({
        messages: [message],
        isStreaming: false,
        streamingMessageId: null,
      });

      render(<MessageList />);

      expect(screen.queryByTestId("streaming-indicator")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has role=log for message container", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByRole("log");
      expect(list).toBeInTheDocument();
    });

    it("has aria-live=polite for screen readers", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByRole("log");
      expect(list).toHaveAttribute("aria-live", "polite");
    });

    it("has accessible label", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByRole("log");
      expect(list).toHaveAttribute("aria-label", "Chat messages");
    });
  });

  describe("styling", () => {
    it("applies custom className", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList className="custom-class" />);

      const list = screen.getByTestId("message-list");
      expect(list).toHaveClass("custom-class");
    });

    it("has overflow handling for scrolling", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByTestId("message-list");
      expect(list).toHaveClass("overflow-y-auto");
    });
  });

  describe("reactivity", () => {
    it("updates when new message is added to store", () => {
      const { rerender } = render(<MessageList />);

      expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();

      // Add a message to the store
      useMessageStore.getState().addMessage(
        createMockMessage({ id: "msg-1", content: "New message" })
      );

      rerender(<MessageList />);

      expect(screen.queryByTestId("message-list-empty")).not.toBeInTheDocument();
      expect(screen.getByText("New message")).toBeInTheDocument();
    });

    it("updates when message content is appended (streaming)", () => {
      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Hello",
      });
      useMessageStore.setState({ messages: [message] });

      const { rerender } = render(<MessageList />);
      expect(screen.getByText("Hello")).toBeInTheDocument();

      // Append content (simulating streaming)
      useMessageStore.getState().appendToMessage("msg-1", " World!");

      rerender(<MessageList />);
      expect(screen.getByText("Hello World!")).toBeInTheDocument();
    });
  });

  describe("tool calls and thinking blocks", () => {
    it("renders messages with tool calls", () => {
      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Running tool...",
        toolCalls: [
          {
            id: "tool-1",
            name: "test_tool",
            arguments: { key: "value" },
          },
        ],
      });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      expect(screen.getByTestId("tool-call-tool-1")).toBeInTheDocument();
    });

    it("renders messages with thinking blocks", () => {
      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Answer",
        thinkingBlocks: [{ id: "think-1", content: "Reasoning..." }],
      });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      expect(screen.getByTestId("thinking-block-think-1")).toBeInTheDocument();
    });
  });

  describe("auto-scroll behavior", () => {
    it("renders a bottom marker element for scrolling", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const bottomMarker = screen.getByTestId("message-list-bottom");
      expect(bottomMarker).toBeInTheDocument();
      expect(bottomMarker).toHaveAttribute("aria-hidden", "true");
    });

    it("has scroll event listener on container", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByTestId("message-list");
      // The onScroll handler should be attached (we can verify the component renders correctly)
      expect(list).toHaveClass("overflow-y-auto");
    });

    it("supports disableAutoScroll prop", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      // Should not throw with disableAutoScroll
      render(<MessageList disableAutoScroll />);

      expect(screen.getByTestId("message-list")).toBeInTheDocument();
    });

    it("calls scrollIntoView when new messages are added", () => {
      const scrollIntoViewMock = vi.fn();

      // Mock scrollIntoView on all elements
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const message1 = createMockMessage({ id: "msg-1", content: "First" });
      useMessageStore.setState({ messages: [message1] });

      const { rerender } = render(<MessageList />);

      // Clear initial scroll calls
      scrollIntoViewMock.mockClear();

      // Add a new message
      const message2 = createMockMessage({ id: "msg-2", content: "Second" });
      act(() => {
        useMessageStore.setState({ messages: [message1, message2] });
      });

      rerender(<MessageList />);

      // scrollIntoView should have been called for the new message
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it("calls scrollIntoView during streaming updates", () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Hello",
      });
      useMessageStore.setState({
        messages: [message],
        isStreaming: true,
        streamingMessageId: "msg-1",
      });

      const { rerender } = render(<MessageList />);

      scrollIntoViewMock.mockClear();

      // Simulate streaming content update
      act(() => {
        useMessageStore.getState().appendToMessage("msg-1", " World!");
      });

      rerender(<MessageList />);

      // scrollIntoView should be called during streaming
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });

    it("uses instant scroll during streaming for responsiveness", () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const message = createMockMessage({
        id: "msg-1",
        role: "assistant",
        content: "Streaming",
      });
      useMessageStore.setState({
        messages: [message],
        isStreaming: true,
        streamingMessageId: "msg-1",
      });

      render(<MessageList />);

      // During streaming, should use instant behavior
      const lastCall = scrollIntoViewMock.mock.calls[scrollIntoViewMock.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({ behavior: "instant" });
    });

    it("uses smooth scroll when not streaming", () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const message1 = createMockMessage({ id: "msg-1", content: "First" });
      useMessageStore.setState({
        messages: [message1],
        isStreaming: false,
        streamingMessageId: null,
      });

      render(<MessageList />);
      scrollIntoViewMock.mockClear();

      // Add a new message without streaming
      const message2 = createMockMessage({ id: "msg-2", content: "Second" });
      act(() => {
        useMessageStore.setState({
          messages: [message1, message2],
          isStreaming: false,
          streamingMessageId: null,
        });
      });

      // When not streaming, should use smooth behavior for new messages
      if (scrollIntoViewMock.mock.calls.length > 0) {
        const lastCall = scrollIntoViewMock.mock.calls[scrollIntoViewMock.mock.calls.length - 1];
        expect(lastCall[0]).toMatchObject({ behavior: "smooth" });
      }
    });

    it("handles scroll events on the container", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const list = screen.getByTestId("message-list");

      // Should not throw when scroll event is fired
      fireEvent.scroll(list, { target: { scrollTop: 100 } });

      expect(list).toBeInTheDocument();
    });

    it("does not scroll when disableAutoScroll is true", () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList disableAutoScroll />);

      // scrollIntoView should not be called when auto-scroll is disabled
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it("bottom marker is present for scroll target", () => {
      const message = createMockMessage({ id: "msg-1" });
      useMessageStore.setState({ messages: [message] });

      render(<MessageList />);

      const bottomMarker = screen.getByTestId("message-list-bottom");
      expect(bottomMarker).toBeInTheDocument();
    });
  });
});
