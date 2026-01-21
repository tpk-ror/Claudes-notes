import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import type { Session } from "@/store";

// Mock the Zustand store
const mockSetCurrentSession = vi.fn();
vi.mock("@/store", async () => {
  const actual = await vi.importActual("@/store");
  return {
    ...actual,
    useSessionStore: vi.fn((selector: (state: { sessions: Session[]; currentSessionId: string | null; setCurrentSession: typeof mockSetCurrentSession }) => unknown) => {
      const state = {
        sessions: [],
        currentSessionId: null,
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

function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    slug: "test-session",
    projectPath: "/home/user/projects/my-app",
    model: "claude-3-opus",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    lastActiveAt: new Date(),
    messageCount: 5,
    totalCostUsd: "0.25",
    ...overrides,
  };
}

describe("CollapsibleSidebar component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("collapsible-sidebar")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<CollapsibleSidebar sessions={[]} className="custom-class" />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveClass("custom-class");
    });

    it("has aside element for semantic markup", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByRole("complementary")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByRole("complementary")).toHaveAttribute(
        "aria-label",
        "Session sidebar"
      );
    });

    it("renders toggle button", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
    });

    it("renders sidebar content area", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    });
  });

  describe("expanded state", () => {
    it("is expanded by default", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );
    });

    it("shows sidebar content when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const content = screen.getByTestId("sidebar-content");
      expect(content).toHaveAttribute("aria-hidden", "false");
      expect(content).not.toHaveClass("pointer-events-none");
    });

    it("toggle button shows collapse label when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute(
        "aria-label",
        "Collapse sidebar"
      );
    });

    it("toggle button has aria-expanded true when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    });

    it("uses default width when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const sidebar = screen.getByTestId("collapsible-sidebar");
      expect(sidebar).toHaveStyle({ width: "280px" });
    });

    it("uses custom width when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} width={320} />);

      const sidebar = screen.getByTestId("collapsible-sidebar");
      expect(sidebar).toHaveStyle({ width: "320px" });
    });

    it("does not show collapsed indicator when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.queryByTestId("collapsed-indicator")).not.toBeInTheDocument();
    });
  });

  describe("collapsed state", () => {
    it("can start collapsed with defaultCollapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });

    it("hides sidebar content when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      const content = screen.getByTestId("sidebar-content");
      expect(content).toHaveAttribute("aria-hidden", "true");
      expect(content).toHaveClass("pointer-events-none");
    });

    it("toggle button shows expand label when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute(
        "aria-label",
        "Expand sidebar"
      );
    });

    it("toggle button has aria-expanded false when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });

    it("uses narrow width when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      const sidebar = screen.getByTestId("collapsible-sidebar");
      expect(sidebar).toHaveStyle({ width: "48px" });
    });

    it("shows collapsed indicator when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("collapsed-indicator")).toBeInTheDocument();
    });
  });

  describe("toggle behavior", () => {
    it("collapses when toggle button clicked while expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );

      fireEvent.click(screen.getByTestId("sidebar-toggle"));

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });

    it("expands when toggle button clicked while collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );

      fireEvent.click(screen.getByTestId("sidebar-toggle"));

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );
    });

    it("calls onCollapsedChange when toggled", () => {
      const onCollapsedChange = vi.fn();
      render(
        <CollapsibleSidebar sessions={[]} onCollapsedChange={onCollapsedChange} />
      );

      fireEvent.click(screen.getByTestId("sidebar-toggle"));

      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });

    it("calls onCollapsedChange with correct value when expanding", () => {
      const onCollapsedChange = vi.fn();
      render(
        <CollapsibleSidebar
          sessions={[]}
          defaultCollapsed={true}
          onCollapsedChange={onCollapsedChange}
        />
      );

      fireEvent.click(screen.getByTestId("sidebar-toggle"));

      expect(onCollapsedChange).toHaveBeenCalledWith(false);
    });
  });

  describe("controlled mode", () => {
    it("uses controlled collapsed prop over internal state", () => {
      render(<CollapsibleSidebar sessions={[]} collapsed={true} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });

    it("ignores defaultCollapsed when controlled", () => {
      render(
        <CollapsibleSidebar
          sessions={[]}
          collapsed={false}
          defaultCollapsed={true}
        />
      );

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );
    });

    it("does not update internal state when controlled", () => {
      const onCollapsedChange = vi.fn();
      const { rerender } = render(
        <CollapsibleSidebar
          sessions={[]}
          collapsed={false}
          onCollapsedChange={onCollapsedChange}
        />
      );

      fireEvent.click(screen.getByTestId("sidebar-toggle"));

      // The component should still show expanded because controlled prop hasn't changed
      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );

      // But callback should have been called
      expect(onCollapsedChange).toHaveBeenCalledWith(true);

      // Update controlled prop to see the change
      rerender(
        <CollapsibleSidebar
          sessions={[]}
          collapsed={true}
          onCollapsedChange={onCollapsedChange}
        />
      );

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });
  });

  describe("keyboard accessibility", () => {
    it("toggles when Enter key pressed on toggle button", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), { key: "Enter" });

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });

    it("toggles when Space key pressed on toggle button", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), { key: " " });

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "true"
      );
    });

    it("does not toggle on other keys", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), { key: "Escape" });

      expect(screen.getByTestId("collapsible-sidebar")).toHaveAttribute(
        "data-collapsed",
        "false"
      );
    });

    it("toggle button has aria-controls pointing to content", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-toggle")).toHaveAttribute(
        "aria-controls",
        "sidebar-content"
      );
    });

    it("content has matching id for aria-controls", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-content")).toHaveAttribute(
        "id",
        "sidebar-content"
      );
    });
  });

  describe("header", () => {
    it("renders header when provided and expanded", () => {
      render(<CollapsibleSidebar sessions={[]} header="Sessions" />);

      expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-header")).toHaveTextContent("Sessions");
    });

    it("does not render header when collapsed", () => {
      render(
        <CollapsibleSidebar
          sessions={[]}
          header="Sessions"
          defaultCollapsed={true}
        />
      );

      expect(screen.queryByTestId("sidebar-header")).not.toBeInTheDocument();
    });

    it("renders custom header content", () => {
      render(
        <CollapsibleSidebar
          sessions={[]}
          header={<span data-testid="custom-header">Custom Header</span>}
        />
      );

      expect(screen.getByTestId("custom-header")).toBeInTheDocument();
    });
  });

  describe("session history integration", () => {
    it("renders SessionHistorySidebar inside content", () => {
      const sessions = [createMockSession()];
      render(<CollapsibleSidebar sessions={sessions} />);

      expect(screen.getByTestId("session-history-sidebar")).toBeInTheDocument();
    });

    it("passes sessions to SessionHistorySidebar", () => {
      const sessions = [createMockSession({ id: "test-session-1" })];
      render(<CollapsibleSidebar sessions={sessions} />);

      expect(screen.getByTestId("session-item-test-session-1")).toBeInTheDocument();
    });

    it("passes currentSessionId to SessionHistorySidebar", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];
      render(
        <CollapsibleSidebar sessions={sessions} currentSessionId="session-2" />
      );

      expect(screen.getByTestId("session-item-session-2")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    it("passes onSelectSession to SessionHistorySidebar", () => {
      const onSelectSession = vi.fn();
      const sessions = [createMockSession({ id: "session-1" })];
      render(
        <CollapsibleSidebar
          sessions={sessions}
          onSelectSession={onSelectSession}
        />
      );

      fireEvent.click(screen.getByTestId("session-item-session-1"));

      expect(onSelectSession).toHaveBeenCalledWith("session-1");
    });

    it("shows empty state from SessionHistorySidebar when no sessions", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByText("No sessions yet")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has transition classes for smooth animation", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const sidebar = screen.getByTestId("collapsible-sidebar");
      expect(sidebar).toHaveClass("transition-[width]");
      expect(sidebar).toHaveClass("duration-200");
    });

    it("has border on the right side", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveClass("border-r");
    });

    it("has full height", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveClass("h-full");
    });

    it("has flex column layout", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const sidebar = screen.getByTestId("collapsible-sidebar");
      expect(sidebar).toHaveClass("flex");
      expect(sidebar).toHaveClass("flex-col");
    });

    it("content area has opacity transition", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const content = screen.getByTestId("sidebar-content");
      expect(content).toHaveClass("transition-opacity");
    });

    it("content has full opacity when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      expect(screen.getByTestId("sidebar-content")).toHaveClass("opacity-100");
    });

    it("content has zero opacity when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      expect(screen.getByTestId("sidebar-content")).toHaveClass("opacity-0");
    });

    it("toggle button is ghost variant", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      // Ghost variant buttons have specific hover styling
      const button = screen.getByTestId("sidebar-toggle");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("chevron icon rotates when collapsed", () => {
      render(<CollapsibleSidebar sessions={[]} defaultCollapsed={true} />);

      const svg = screen.getByTestId("sidebar-toggle").querySelector("svg");
      expect(svg).toHaveClass("rotate-0");
    });

    it("chevron icon rotates when expanded", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const svg = screen.getByTestId("sidebar-toggle").querySelector("svg");
      expect(svg).toHaveClass("rotate-180");
    });
  });

  describe("multiple toggles", () => {
    it("handles multiple toggle clicks correctly", () => {
      render(<CollapsibleSidebar sessions={[]} />);

      const toggle = screen.getByTestId("sidebar-toggle");
      const sidebar = screen.getByTestId("collapsible-sidebar");

      expect(sidebar).toHaveAttribute("data-collapsed", "false");

      fireEvent.click(toggle);
      expect(sidebar).toHaveAttribute("data-collapsed", "true");

      fireEvent.click(toggle);
      expect(sidebar).toHaveAttribute("data-collapsed", "false");

      fireEvent.click(toggle);
      expect(sidebar).toHaveAttribute("data-collapsed", "true");
    });
  });

  describe("reactivity", () => {
    it("updates width when collapsed prop changes", () => {
      const { rerender } = render(
        <CollapsibleSidebar sessions={[]} collapsed={false} />
      );

      expect(screen.getByTestId("collapsible-sidebar")).toHaveStyle({
        width: "280px",
      });

      rerender(<CollapsibleSidebar sessions={[]} collapsed={true} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveStyle({
        width: "48px",
      });
    });

    it("updates when width prop changes", () => {
      const { rerender } = render(
        <CollapsibleSidebar sessions={[]} width={300} />
      );

      expect(screen.getByTestId("collapsible-sidebar")).toHaveStyle({
        width: "300px",
      });

      rerender(<CollapsibleSidebar sessions={[]} width={400} />);

      expect(screen.getByTestId("collapsible-sidebar")).toHaveStyle({
        width: "400px",
      });
    });
  });
});
