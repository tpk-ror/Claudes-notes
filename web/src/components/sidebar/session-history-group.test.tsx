import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SessionHistoryGroup } from "./session-history-group";
import type { Session } from "@/store";

// Mock date-utils
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

describe("SessionHistoryGroup component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-history-group")).toBeInTheDocument();
    });

    it("renders the group label", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-group-label")).toHaveTextContent("Today");
    });

    it("applies custom className", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
          className="custom-class"
        />
      );

      expect(screen.getByTestId("session-history-group")).toHaveClass("custom-class");
    });
  });

  describe("empty state", () => {
    it("returns null when sessions array is empty", () => {
      const { container } = render(
        <SessionHistoryGroup
          label="Today"
          sessions={[]}
          currentSessionId={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("session list", () => {
    it("renders all sessions in the group", () => {
      const sessions = [
        createMockSession({ id: "session-1", slug: "Session 1" }),
        createMockSession({ id: "session-2", slug: "Session 2" }),
        createMockSession({ id: "session-3", slug: "Session 3" }),
      ];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-item-session-2")).toBeInTheDocument();
      expect(screen.getByTestId("session-item-session-3")).toBeInTheDocument();
    });

    it("sorts sessions by lastActiveAt descending (most recent first)", () => {
      const sessions = [
        createMockSession({
          id: "session-old",
          slug: "Old Session",
          lastActiveAt: new Date("2026-01-15T10:00:00.000Z"),
        }),
        createMockSession({
          id: "session-new",
          slug: "New Session",
          lastActiveAt: new Date("2026-01-15T16:00:00.000Z"),
        }),
        createMockSession({
          id: "session-mid",
          slug: "Mid Session",
          lastActiveAt: new Date("2026-01-15T13:00:00.000Z"),
        }),
      ];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      const listbox = screen.getByRole("listbox");
      const sessionItems = within(listbox).getAllByRole("option");

      // Most recent first
      expect(sessionItems[0]).toHaveAttribute("data-testid", "session-item-session-new");
      expect(sessionItems[1]).toHaveAttribute("data-testid", "session-item-session-mid");
      expect(sessionItems[2]).toHaveAttribute("data-testid", "session-item-session-old");
    });
  });

  describe("selection state", () => {
    it("marks the current session as selected", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId="session-1"
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "true"
      );
      expect(screen.getByTestId("session-item-session-2")).toHaveAttribute(
        "data-selected",
        "false"
      );
    });

    it("marks no session as selected when currentSessionId is null", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "false"
      );
      expect(screen.getByTestId("session-item-session-2")).toHaveAttribute(
        "data-selected",
        "false"
      );
    });
  });

  describe("selection callback", () => {
    it("calls onSelectSession with session id when a session is clicked", () => {
      const onSelectSession = vi.fn();
      const sessions = [createMockSession({ id: "session-abc" })];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
          onSelectSession={onSelectSession}
        />
      );

      fireEvent.click(screen.getByTestId("session-item-session-abc"));

      expect(onSelectSession).toHaveBeenCalledTimes(1);
      expect(onSelectSession).toHaveBeenCalledWith("session-abc");
    });

    it("handles multiple session clicks correctly", () => {
      const onSelectSession = vi.fn();
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
          onSelectSession={onSelectSession}
        />
      );

      fireEvent.click(screen.getByTestId("session-item-session-1"));
      fireEvent.click(screen.getByTestId("session-item-session-2"));

      expect(onSelectSession).toHaveBeenCalledTimes(2);
      expect(onSelectSession).toHaveBeenNthCalledWith(1, "session-1");
      expect(onSelectSession).toHaveBeenNthCalledWith(2, "session-2");
    });
  });

  describe("accessibility", () => {
    it("has a listbox role for the session list", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("has aria-label on the listbox including the group label", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Yesterday"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByRole("listbox")).toHaveAttribute(
        "aria-label",
        "Sessions from Yesterday"
      );
    });
  });

  describe("styling", () => {
    it("applies space-y-1 class for vertical spacing", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-history-group")).toHaveClass("space-y-1");
    });

    it("label has uppercase styling", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      const label = screen.getByTestId("session-group-label");
      expect(label).toHaveClass("uppercase");
    });

    it("label has small font and semibold weight", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      const label = screen.getByTestId("session-group-label");
      expect(label).toHaveClass("text-xs");
      expect(label).toHaveClass("font-semibold");
    });

    it("label has muted foreground color", () => {
      const sessions = [createMockSession()];
      render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      const label = screen.getByTestId("session-group-label");
      expect(label).toHaveClass("text-muted-foreground");
    });
  });

  describe("reactivity", () => {
    it("updates when sessions prop changes", () => {
      const sessions = [createMockSession({ id: "session-1", slug: "Session 1" })];
      const { rerender } = render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toBeInTheDocument();

      const newSessions = [
        createMockSession({ id: "session-2", slug: "Session 2" }),
        createMockSession({ id: "session-3", slug: "Session 3" }),
      ];
      rerender(
        <SessionHistoryGroup
          label="Today"
          sessions={newSessions}
          currentSessionId={null}
        />
      );

      expect(screen.queryByTestId("session-item-session-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("session-item-session-2")).toBeInTheDocument();
      expect(screen.getByTestId("session-item-session-3")).toBeInTheDocument();
    });

    it("updates when currentSessionId changes", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      const { rerender } = render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId="session-1"
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "true"
      );

      rerender(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId="session-2"
        />
      );

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "false"
      );
      expect(screen.getByTestId("session-item-session-2")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    it("updates when label changes", () => {
      const sessions = [createMockSession()];
      const { rerender } = render(
        <SessionHistoryGroup
          label="Today"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-group-label")).toHaveTextContent("Today");

      rerender(
        <SessionHistoryGroup
          label="Yesterday"
          sessions={sessions}
          currentSessionId={null}
        />
      );

      expect(screen.getByTestId("session-group-label")).toHaveTextContent("Yesterday");
    });
  });
});
