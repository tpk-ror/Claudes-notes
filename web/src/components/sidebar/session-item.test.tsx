import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionItem } from "./session-item";
import type { Session } from "@/store";

// Mock date-utils to control formatted output
vi.mock("@/lib/date-utils", () => ({
  formatSessionDate: vi.fn(() => "2:30 PM"),
}));

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    slug: "test-session",
    projectPath: "/home/user/projects/my-app",
    model: "claude-3-opus",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    lastActiveAt: new Date("2026-01-15T14:30:00.000Z"),
    messageCount: 5,
    totalCostUsd: "0.25",
    ...overrides,
  };
}

describe("SessionItem component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const session = createMockSession({ id: "session-abc" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-session-abc")).toBeInTheDocument();
    });

    it("renders session slug as name", () => {
      const session = createMockSession({ slug: "my-cool-session" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-name")).toHaveTextContent("my-cool-session");
    });

    it("renders 'Untitled Session' when slug is empty", () => {
      const session = createMockSession({ slug: "" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-name")).toHaveTextContent("Untitled Session");
    });

    it("renders project name from path", () => {
      const session = createMockSession({ projectPath: "/home/user/projects/awesome-project" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-project")).toHaveTextContent("awesome-project");
    });

    it("handles Windows paths", () => {
      const session = createMockSession({ projectPath: "C:\\Users\\john\\projects\\my-app" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-project")).toHaveTextContent("my-app");
    });

    it("renders formatted time", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-time")).toHaveTextContent("2:30 PM");
    });

    it("applies custom className", () => {
      const session = createMockSession();
      render(<SessionItem session={session} className="custom-class" />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("custom-class");
    });
  });

  describe("message count", () => {
    it("displays message count when > 0", () => {
      const session = createMockSession({ messageCount: 10 });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-messages")).toHaveTextContent("10 messages");
    });

    it("uses singular 'message' for count of 1", () => {
      const session = createMockSession({ messageCount: 1 });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-messages")).toHaveTextContent("1 message");
    });

    it("does not display message count when 0", () => {
      const session = createMockSession({ messageCount: 0 });
      render(<SessionItem session={session} />);

      expect(screen.queryByTestId("session-item-messages")).not.toBeInTheDocument();
    });
  });

  describe("selection state", () => {
    it("has data-selected=false when not selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={false} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "false"
      );
    });

    it("has data-selected=true when selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={true} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    it("has aria-selected=false when not selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={false} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("has aria-selected=true when selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={true} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("applies bg-accent class when selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={true} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("bg-accent");
    });

    it("does not apply bg-accent class when not selected", () => {
      const session = createMockSession();
      render(<SessionItem session={session} isSelected={false} />);

      // Should have hover:bg-accent but not bg-accent directly
      const item = screen.getByTestId("session-item-session-1");
      expect(item.className).not.toMatch(/(?<!hover:)bg-accent/);
    });
  });

  describe("click interaction", () => {
    it("calls onSelect with session id when clicked", () => {
      const onSelect = vi.fn();
      const session = createMockSession({ id: "session-xyz" });
      render(<SessionItem session={session} onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId("session-item-session-xyz"));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("session-xyz");
    });

    it("does not throw when onSelect is not provided", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(() => {
        fireEvent.click(screen.getByTestId("session-item-session-1"));
      }).not.toThrow();
    });
  });

  describe("keyboard interaction", () => {
    it("calls onSelect when Enter key is pressed", () => {
      const onSelect = vi.fn();
      const session = createMockSession({ id: "session-123" });
      render(<SessionItem session={session} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByTestId("session-item-session-123"), {
        key: "Enter",
      });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("session-123");
    });

    it("calls onSelect when Space key is pressed", () => {
      const onSelect = vi.fn();
      const session = createMockSession({ id: "session-456" });
      render(<SessionItem session={session} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByTestId("session-item-session-456"), {
        key: " ",
      });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("session-456");
    });

    it("does not call onSelect for other keys", () => {
      const onSelect = vi.fn();
      const session = createMockSession();
      render(<SessionItem session={session} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByTestId("session-item-session-1"), {
        key: "Tab",
      });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("renders as a button element", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByRole("option")).toBeInTheDocument();
    });

    it("has type=button attribute", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByRole("option")).toHaveAttribute("type", "button");
    });

    it("has focus-visible ring classes", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      const button = screen.getByRole("option");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-ring");
    });
  });

  describe("styling", () => {
    it("has rounded corners", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("rounded-md");
    });

    it("has padding", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      const item = screen.getByTestId("session-item-session-1");
      expect(item).toHaveClass("px-3");
      expect(item).toHaveClass("py-2");
    });

    it("has transition for hover effects", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("transition-colors");
    });

    it("has full width", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("w-full");
    });

    it("has left-aligned text", () => {
      const session = createMockSession();
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-session-1")).toHaveClass("text-left");
    });
  });

  describe("edge cases", () => {
    it("handles empty project path", () => {
      const session = createMockSession({ projectPath: "" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-project")).toHaveTextContent("Unknown Project");
    });

    it("handles project path as file path", () => {
      const session = createMockSession({ projectPath: "/home/user/file.txt" });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-project")).toHaveTextContent("file.txt");
    });

    it("handles very long session slug with truncation", () => {
      const longSlug = "this-is-a-very-long-session-slug-that-should-be-truncated";
      const session = createMockSession({ slug: longSlug });
      render(<SessionItem session={session} />);

      const nameElement = screen.getByTestId("session-item-name");
      expect(nameElement).toHaveTextContent(longSlug);
      expect(nameElement).toHaveClass("truncate");
    });

    it("has title attribute on project for full path tooltip", () => {
      const fullPath = "/home/user/very/long/path/to/project";
      const session = createMockSession({ projectPath: fullPath });
      render(<SessionItem session={session} />);

      expect(screen.getByTestId("session-item-project")).toHaveAttribute("title", fullPath);
    });
  });
});
