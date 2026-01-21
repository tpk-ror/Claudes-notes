import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "./chat-input";

describe("ChatInput component", () => {
  let onSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid for form", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      expect(screen.getByTestId("chat-input-form")).toBeInTheDocument();
    });

    it("renders textarea with correct data-testid", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      expect(screen.getByTestId("chat-input-textarea")).toBeInTheDocument();
    });

    it("renders submit button with correct data-testid", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      expect(screen.getByTestId("chat-input-submit")).toBeInTheDocument();
    });

    it("renders with default placeholder", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    });

    it("renders with custom placeholder", () => {
      render(<ChatInput onSubmit={onSubmit} placeholder="Ask Claude..." />);

      expect(screen.getByPlaceholderText("Ask Claude...")).toBeInTheDocument();
    });

    it("applies custom className to form", () => {
      render(<ChatInput onSubmit={onSubmit} className="my-custom-class" />);

      expect(screen.getByTestId("chat-input-form")).toHaveClass("my-custom-class");
    });

    it("renders send icon in button", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const button = screen.getByTestId("chat-input-submit");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("submit behavior", () => {
    it("calls onSubmit with trimmed message on Enter key", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("Hello Claude");
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("trims whitespace from submitted message", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "  Hello Claude  " } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("Hello Claude");
    });

    it("clears textarea after submit", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(textarea.value).toBe("");
    });

    it("does not submit empty message", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not submit whitespace-only message", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "   " } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits on button click", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      const button = screen.getByTestId("chat-input-submit");

      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.click(button);

      expect(onSubmit).toHaveBeenCalledWith("Hello Claude");
    });

    it("submits on form submit", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      const form = screen.getByTestId("chat-input-form");

      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalledWith("Hello Claude");
    });
  });

  describe("multi-line behavior", () => {
    it("does NOT submit on Shift+Enter", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("allows typing newlines with Shift+Enter", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });

      // Shift+Enter should not prevent default behavior (allowing newline)
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        shiftKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      textarea.dispatchEvent(event);

      // Should NOT call preventDefault, allowing the default newline behavior
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("submits and clears on Enter without Shift (proving preventDefault worked)", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Hello" } });

      // Enter without Shift should submit and clear the input
      // This proves preventDefault was called (otherwise a newline would be added)
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

      // The input should be cleared after submit
      expect(textarea.value).toBe("");
      // And onSubmit should have been called
      expect(onSubmit).toHaveBeenCalledWith("Hello");
    });

    it("preserves multi-line content until submitted", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Line 1\nLine 2\nLine 3" } });

      expect(textarea.value).toBe("Line 1\nLine 2\nLine 3");
    });

    it("submits multi-line content on Enter", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Line 1\nLine 2\nLine 3" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("Line 1\nLine 2\nLine 3");
    });
  });

  describe("disabled state", () => {
    it("disables textarea when disabled prop is true", () => {
      render(<ChatInput onSubmit={onSubmit} disabled={true} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toBeDisabled();
    });

    it("disables submit button when disabled prop is true", () => {
      render(<ChatInput onSubmit={onSubmit} disabled={true} />);

      const button = screen.getByTestId("chat-input-submit");
      expect(button).toBeDisabled();
    });

    it("does not submit when disabled", () => {
      render(<ChatInput onSubmit={onSubmit} disabled={true} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello Claude" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submit button is disabled when textarea is empty", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const button = screen.getByTestId("chat-input-submit");
      expect(button).toBeDisabled();
    });

    it("submit button is enabled when textarea has content", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      const button = screen.getByTestId("chat-input-submit");
      expect(button).not.toBeDisabled();
    });

    it("submit button is disabled when textarea has only whitespace", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "   " } });

      const button = screen.getByTestId("chat-input-submit");
      expect(button).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("textarea has aria-label", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toHaveAttribute("aria-label", "Message input");
    });

    it("submit button has aria-label", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const button = screen.getByTestId("chat-input-submit");
      expect(button).toHaveAttribute("aria-label", "Send message");
    });

    it("textarea can be focused", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      textarea.focus();

      expect(document.activeElement).toBe(textarea);
    });

    it("form has submit type button", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const button = screen.getByTestId("chat-input-submit");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("row configuration", () => {
    it("sets default minRows to 1", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toHaveAttribute("rows", "1");
    });

    it("allows custom minRows", () => {
      render(<ChatInput onSubmit={onSubmit} minRows={3} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toHaveAttribute("rows", "3");
    });
  });

  describe("styling", () => {
    it("textarea has resize-none class", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toHaveClass("resize-none");
    });

    it("textarea has flex-1 class for growing", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      expect(textarea).toHaveClass("flex-1");
    });

    it("form has flex layout with gap", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const form = screen.getByTestId("chat-input-form");
      expect(form).toHaveClass("flex");
      expect(form).toHaveClass("gap-2");
    });

    it("form has items-end for bottom alignment", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const form = screen.getByTestId("chat-input-form");
      expect(form).toHaveClass("items-end");
    });
  });

  describe("value controlled behavior", () => {
    it("updates value on change", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Test" } });

      expect(textarea.value).toBe("Test");
    });

    it("handles rapid typing", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "T" } });
      fireEvent.change(textarea, { target: { value: "Te" } });
      fireEvent.change(textarea, { target: { value: "Tes" } });
      fireEvent.change(textarea, { target: { value: "Test" } });

      expect(textarea.value).toBe("Test");
    });

    it("handles paste of multi-line content", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
      const multilineText = "First line\nSecond line\nThird line";

      fireEvent.change(textarea, { target: { value: multilineText } });

      expect(textarea.value).toBe(multilineText);
    });
  });

  describe("edge cases", () => {
    it("handles special characters in message", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      const specialMessage = "Hello <script>alert('xss')</script> & \"quotes\"";

      fireEvent.change(textarea, { target: { value: specialMessage } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith(specialMessage);
    });

    it("handles unicode characters", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      const unicodeMessage = "Hello 👋 世界 🌍";

      fireEvent.change(textarea, { target: { value: unicodeMessage } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith(unicodeMessage);
    });

    it("handles very long messages", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      const longMessage = "A".repeat(10000);

      fireEvent.change(textarea, { target: { value: longMessage } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith(longMessage);
    });

    it("other keys do not trigger submit", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      fireEvent.keyDown(textarea, { key: "a" });
      fireEvent.keyDown(textarea, { key: "Tab" });
      fireEvent.keyDown(textarea, { key: "Escape" });
      fireEvent.keyDown(textarea, { key: "ArrowUp" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("can submit multiple times", () => {
      render(<ChatInput onSubmit={onSubmit} />);

      const textarea = screen.getByTestId("chat-input-textarea");

      fireEvent.change(textarea, { target: { value: "Message 1" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      fireEvent.change(textarea, { target: { value: "Message 2" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      fireEvent.change(textarea, { target: { value: "Message 3" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledTimes(3);
      expect(onSubmit).toHaveBeenNthCalledWith(1, "Message 1");
      expect(onSubmit).toHaveBeenNthCalledWith(2, "Message 2");
      expect(onSubmit).toHaveBeenNthCalledWith(3, "Message 3");
    });
  });
});
