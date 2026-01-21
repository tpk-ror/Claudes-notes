import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatPanel } from "./chat-panel";
import { useMessageStore } from "@/store";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe("ChatPanel component", () => {
  let onSubmitMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmitMessage = vi.fn();
    // Clear message store before each test
    useMessageStore.getState().clearMessages();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} className="my-custom-class" />);

      expect(screen.getByTestId("chat-panel")).toHaveClass("my-custom-class");
    });

    it("renders MessageList component", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      // Empty state shows when no messages
      expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
    });

    it("renders ChatInput component", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      expect(screen.getByTestId("chat-input-form")).toBeInTheDocument();
    });
  });

  describe("layout structure", () => {
    it("has flex column layout", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const panel = screen.getByTestId("chat-panel");
      expect(panel).toHaveClass("flex", "flex-col");
    });

    it("has h-full class for full height", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const panel = screen.getByTestId("chat-panel");
      expect(panel).toHaveClass("h-full");
    });

    it("has input section with border-t", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const form = screen.getByTestId("chat-input-form");
      const inputContainer = form.parentElement;
      expect(inputContainer).toHaveClass("border-t");
    });
  });

  describe("message submission", () => {
    it("calls onSubmitMessage when message is submitted", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmitMessage).toHaveBeenCalledWith("Hello Claude");
    });

    it("passes custom placeholder to ChatInput", () => {
      render(
        <ChatPanel
          onSubmitMessage={onSubmitMessage}
          placeholder="Ask Claude about your plan..."
        />
      );

      expect(screen.getByPlaceholderText("Ask Claude about your plan...")).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("disables ChatInput when disabled prop is true", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} disabled={true} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toBeDisabled();
    });

    it("does not submit when disabled", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} disabled={true} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmitMessage).not.toHaveBeenCalled();
    });

    it("ChatInput is enabled by default", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).not.toBeDisabled();
    });
  });

  describe("session filtering", () => {
    it("passes sessionId to MessageList", () => {
      // Add messages to the store with a specific session ID
      useMessageStore.getState().addMessage({
        id: "msg-1",
        sessionId: "session-123",
        role: "user",
        content: "Hello",
        timestamp: new Date(),
      });

      render(<ChatPanel onSubmitMessage={onSubmitMessage} sessionId="session-123" />);

      // Should show the message list, not empty state
      expect(screen.getByTestId("message-list")).toBeInTheDocument();
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("filters out messages from other sessions", () => {
      // Add messages to different sessions
      useMessageStore.getState().addMessage({
        id: "msg-1",
        sessionId: "session-123",
        role: "user",
        content: "Hello from session 123",
        timestamp: new Date(),
      });
      useMessageStore.getState().addMessage({
        id: "msg-2",
        sessionId: "session-456",
        role: "user",
        content: "Hello from session 456",
        timestamp: new Date(),
      });

      render(<ChatPanel onSubmitMessage={onSubmitMessage} sessionId="session-123" />);

      expect(screen.getByText("Hello from session 123")).toBeInTheDocument();
      expect(screen.queryByText("Hello from session 456")).not.toBeInTheDocument();
    });
  });

  describe("message display", () => {
    it("displays user messages", () => {
      useMessageStore.getState().addMessage({
        id: "msg-1",
        sessionId: "test-session",
        role: "user",
        content: "User message content",
        timestamp: new Date(),
      });

      render(<ChatPanel onSubmitMessage={onSubmitMessage} sessionId="test-session" />);

      expect(screen.getByText("User message content")).toBeInTheDocument();
    });

    it("displays assistant messages", () => {
      useMessageStore.getState().addMessage({
        id: "msg-1",
        sessionId: "test-session",
        role: "assistant",
        content: "Assistant message content",
        timestamp: new Date(),
      });

      render(<ChatPanel onSubmitMessage={onSubmitMessage} sessionId="test-session" />);

      expect(screen.getByText("Assistant message content")).toBeInTheDocument();
    });

    it("displays empty state when no messages", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      expect(screen.getByText("No messages yet. Start a conversation!")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("message list container has flex-1 for growing", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const panel = screen.getByTestId("chat-panel");
      const messageListContainer = panel.children[0];
      expect(messageListContainer).toHaveClass("flex-1");
    });

    it("input container has shrink-0", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const form = screen.getByTestId("chat-input-form");
      const inputContainer = form.parentElement;
      expect(inputContainer).toHaveClass("shrink-0");
    });

    it("input container has padding", () => {
      render(<ChatPanel onSubmitMessage={onSubmitMessage} />);

      const form = screen.getByTestId("chat-input-form");
      const inputContainer = form.parentElement;
      expect(inputContainer).toHaveClass("p-4");
    });
  });
});
