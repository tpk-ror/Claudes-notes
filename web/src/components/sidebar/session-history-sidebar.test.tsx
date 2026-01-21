import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SessionHistorySidebar } from "./session-history-sidebar";
import type { Session } from "@/store";

// Mock the Zustand store
const mockSetCurrentSession = vi.fn();
vi.mock("@/store", async () => {
  const actual = await vi.importActual("@/store");
  return {
    ...actual,
    useSessionStore: vi.fn((selector: (state: { sessions: Session[]; currentSessionId: string | null; setCurrentSession: typeof mockSetCurrentSession }) => unknown) => {
      const state = {
        sessions: mockSessions,
        currentSessionId: mockCurrentSessionId,
        setCurrentSession: mockSetCurrentSession,
      };
      return selector(state);
    }),
  };
});

// Mock date-utils
vi.mock("@/lib/date-utils", async () => {
  const actual = await vi.importActual("@/lib/date-utils");
  return {
    ...actual,
    formatSessionDate: vi.fn(() => "2:30 PM"),
  };
});

// Mock data for store
let mockSessions: Session[] = [];
let mockCurrentSessionId: string | null = null;

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

describe("SessionHistorySidebar component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions = [];
    mockCurrentSessionId = null;
  });

  describe("empty state", () => {
    it("shows empty message when no sessions", () => {
      render(<SessionHistorySidebar sessions={[]} />);

      expect(screen.getByTestId("session-history-sidebar-empty")).toBeInTheDocument();
      expect(screen.getByText("No sessions yet")).toBeInTheDocument();
    });

    it("applies custom className to empty state", () => {
      render(<SessionHistorySidebar sessions={[]} className="custom-class" />);

      expect(screen.getByTestId("session-history-sidebar-empty")).toHaveClass("custom-class");
    });

    it("empty state has centered layout", () => {
      render(<SessionHistorySidebar sessions={[]} />);

      const empty = screen.getByTestId("session-history-sidebar-empty");
      expect(empty).toHaveClass("flex");
      expect(empty).toHaveClass("items-center");
      expect(empty).toHaveClass("justify-center");
    });
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid when sessions exist", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByTestId("session-history-sidebar")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} className="sidebar-custom" />);

      expect(screen.getByTestId("session-history-sidebar")).toHaveClass("sidebar-custom");
    });

    it("has nav element for semantic markup", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByRole("navigation")).toHaveAttribute(
        "aria-label",
        "Session history"
      );
    });
  });

  describe("date grouping", () => {
    it("groups sessions by date - today", () => {
      // Create a session from today
      const now = new Date();
      const todaySession = createMockSession({
        id: "today-session",
        lastActiveAt: now,
      });

      render(<SessionHistorySidebar sessions={[todaySession]} />);

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("groups sessions by date - yesterday", () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdaySession = createMockSession({
        id: "yesterday-session",
        lastActiveAt: yesterday,
      });

      render(<SessionHistorySidebar sessions={[yesterdaySession]} />);

      expect(screen.getByText("Yesterday")).toBeInTheDocument();
    });

    it("groups sessions by date - previous 7 days", () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const olderSession = createMockSession({
        id: "older-session",
        lastActiveAt: fiveDaysAgo,
      });

      render(<SessionHistorySidebar sessions={[olderSession]} />);

      expect(screen.getByText("Previous 7 Days")).toBeInTheDocument();
    });

    it("groups sessions by date - previous 30 days", () => {
      const now = new Date();
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const session = createMockSession({
        id: "two-weeks-ago",
        lastActiveAt: twoWeeksAgo,
      });

      render(<SessionHistorySidebar sessions={[session]} />);

      expect(screen.getByText("Previous 30 Days")).toBeInTheDocument();
    });

    it("groups sessions by date - older", () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const session = createMockSession({
        id: "old-session",
        lastActiveAt: twoMonthsAgo,
      });

      render(<SessionHistorySidebar sessions={[session]} />);

      expect(screen.getByText("Older")).toBeInTheDocument();
    });

    it("displays multiple date groups", () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 5);

      const sessions = [
        createMockSession({ id: "today", lastActiveAt: now }),
        createMockSession({ id: "yesterday", lastActiveAt: yesterday }),
        createMockSession({ id: "last-week", lastActiveAt: lastWeek }),
      ];

      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Yesterday")).toBeInTheDocument();
      expect(screen.getByText("Previous 7 Days")).toBeInTheDocument();
    });

    it("does not display empty date groups", () => {
      const now = new Date();
      const sessions = [createMockSession({ id: "today", lastActiveAt: now })];

      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.queryByText("Yesterday")).not.toBeInTheDocument();
      expect(screen.queryByText("Previous 7 Days")).not.toBeInTheDocument();
      expect(screen.queryByText("Previous 30 Days")).not.toBeInTheDocument();
      expect(screen.queryByText("Older")).not.toBeInTheDocument();
    });

    it("orders date groups correctly (most recent first)", () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const sessions = [
        createMockSession({ id: "old", lastActiveAt: twoMonthsAgo }),
        createMockSession({ id: "today", lastActiveAt: now }),
        createMockSession({ id: "yesterday", lastActiveAt: yesterday }),
      ];

      render(<SessionHistorySidebar sessions={sessions} />);

      const sidebar = screen.getByTestId("session-history-sidebar");
      const labels = within(sidebar).getAllByTestId("session-group-label");

      expect(labels[0]).toHaveTextContent("Today");
      expect(labels[1]).toHaveTextContent("Yesterday");
      expect(labels[2]).toHaveTextContent("Older");
    });
  });

  describe("session selection", () => {
    it("marks current session as selected via prop", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];

      render(
        <SessionHistorySidebar
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

    it("calls onSelectSession when session is clicked", () => {
      const onSelectSession = vi.fn();
      const now = new Date();
      const sessions = [createMockSession({ id: "session-xyz", lastActiveAt: now })];

      render(
        <SessionHistorySidebar
          sessions={sessions}
          onSelectSession={onSelectSession}
        />
      );

      fireEvent.click(screen.getByTestId("session-item-session-xyz"));

      expect(onSelectSession).toHaveBeenCalledTimes(1);
      expect(onSelectSession).toHaveBeenCalledWith("session-xyz");
    });
  });

  describe("store integration", () => {
    it("uses sessions from store when not provided via props", () => {
      mockSessions = [
        createMockSession({ id: "store-session-1", slug: "Store Session" }),
      ];

      render(<SessionHistorySidebar />);

      expect(screen.getByTestId("session-item-store-session-1")).toBeInTheDocument();
    });

    it("uses currentSessionId from store when not provided via props", () => {
      mockSessions = [
        createMockSession({ id: "store-session-1" }),
        createMockSession({ id: "store-session-2" }),
      ];
      mockCurrentSessionId = "store-session-2";

      render(<SessionHistorySidebar />);

      expect(screen.getByTestId("session-item-store-session-2")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    it("calls setCurrentSession from store when session clicked and no onSelectSession prop", () => {
      mockSessions = [createMockSession({ id: "store-session-1" })];

      render(<SessionHistorySidebar />);

      fireEvent.click(screen.getByTestId("session-item-store-session-1"));

      expect(mockSetCurrentSession).toHaveBeenCalledTimes(1);
      expect(mockSetCurrentSession).toHaveBeenCalledWith("store-session-1");
    });

    it("prefers props over store values", () => {
      mockSessions = [createMockSession({ id: "store-session", slug: "Store" })];
      mockCurrentSessionId = "store-session";

      const propSessions = [createMockSession({ id: "prop-session", slug: "Prop" })];

      render(
        <SessionHistorySidebar
          sessions={propSessions}
          currentSessionId="prop-session"
        />
      );

      expect(screen.getByTestId("session-item-prop-session")).toBeInTheDocument();
      expect(screen.queryByTestId("session-item-store-session")).not.toBeInTheDocument();
      expect(screen.getByTestId("session-item-prop-session")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });
  });

  describe("styling", () => {
    it("has flex column layout", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      const sidebar = screen.getByTestId("session-history-sidebar");
      expect(sidebar).toHaveClass("flex");
      expect(sidebar).toHaveClass("flex-col");
    });

    it("has overflow-hidden for clipping", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByTestId("session-history-sidebar")).toHaveClass("overflow-hidden");
    });

    it("has full height", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      expect(screen.getByTestId("session-history-sidebar")).toHaveClass("h-full");
    });

    it("content area has vertical scrolling", () => {
      const sessions = [createMockSession()];
      render(<SessionHistorySidebar sessions={sessions} />);

      const sidebar = screen.getByTestId("session-history-sidebar");
      const scrollArea = sidebar.querySelector(".overflow-y-auto");
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe("reactivity", () => {
    it("updates when sessions prop changes", () => {
      const initialSessions = [createMockSession({ id: "session-1", slug: "Initial" })];
      const { rerender } = render(
        <SessionHistorySidebar sessions={initialSessions} />
      );

      expect(screen.getByTestId("session-item-session-1")).toBeInTheDocument();

      const newSessions = [createMockSession({ id: "session-2", slug: "New" })];
      rerender(<SessionHistorySidebar sessions={newSessions} />);

      expect(screen.queryByTestId("session-item-session-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("session-item-session-2")).toBeInTheDocument();
    });

    it("updates when currentSessionId prop changes", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      const { rerender } = render(
        <SessionHistorySidebar sessions={sessions} currentSessionId="session-1" />
      );

      expect(screen.getByTestId("session-item-session-1")).toHaveAttribute(
        "data-selected",
        "true"
      );

      rerender(
        <SessionHistorySidebar sessions={sessions} currentSessionId="session-2" />
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
  });

  describe("multiple sessions in same group", () => {
    it("renders multiple sessions within the same date group", () => {
      // Use a fixed time in the middle of the day to avoid timezone edge cases
      const baseTime = new Date();
      baseTime.setHours(14, 0, 0, 0); // 2 PM same day to ensure all sessions are on same day

      const sessions = [
        createMockSession({ id: "same-day-1", lastActiveAt: baseTime }),
        createMockSession({
          id: "same-day-2",
          lastActiveAt: new Date(baseTime.getTime() - 60000), // 1 minute earlier
        }),
        createMockSession({
          id: "same-day-3",
          lastActiveAt: new Date(baseTime.getTime() - 120000), // 2 minutes earlier
        }),
      ];

      render(<SessionHistorySidebar sessions={sessions} />);

      // Should have only one "Today" group
      const labels = screen.getAllByTestId("session-group-label");
      expect(labels).toHaveLength(1);
      expect(labels[0]).toHaveTextContent("Today");

      // All sessions should be visible
      expect(screen.getByTestId("session-item-same-day-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-item-same-day-2")).toBeInTheDocument();
      expect(screen.getByTestId("session-item-same-day-3")).toBeInTheDocument();
    });
  });
});
