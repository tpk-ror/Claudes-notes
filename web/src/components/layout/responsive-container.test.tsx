import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ResponsiveContainer, MIN_SUPPORTED_WIDTH } from "./responsive-container";

describe("ResponsiveContainer component", () => {
  let originalInnerWidth: number;
  let resizeListeners: Array<() => void>;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    resizeListeners = [];

    // Mock addEventListener for resize events
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "resize" && typeof handler === "function") {
        resizeListeners.push(handler);
      }
    });

    vi.spyOn(window, "removeEventListener").mockImplementation((event, handler) => {
      if (event === "resize" && typeof handler === "function") {
        const index = resizeListeners.indexOf(handler);
        if (index > -1) {
          resizeListeners.splice(index, 1);
        }
      }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
    resizeListeners = [];
  });

  // Helper to simulate window resize
  const simulateResize = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    act(() => {
      resizeListeners.forEach((listener) => listener());
    });
  };

  describe("MIN_SUPPORTED_WIDTH constant", () => {
    it("exports MIN_SUPPORTED_WIDTH as 1024", () => {
      expect(MIN_SUPPORTED_WIDTH).toBe(1024);
    });
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders children", () => {
      render(
        <ResponsiveContainer>
          <div data-testid="child">Child Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <ResponsiveContainer>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </ResponsiveContainer>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <ResponsiveContainer className="my-custom-class">
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveClass("my-custom-class");
    });
  });

  describe("minimum width", () => {
    it("sets default min-width to 1024px", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId("responsive-container");
      expect(container.style.minWidth).toBe("1024px");
    });

    it("applies custom minWidth prop", () => {
      render(
        <ResponsiveContainer minWidth={800}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId("responsive-container");
      expect(container.style.minWidth).toBe("800px");
    });

    it("applies custom minWidth of 1280px", () => {
      render(
        <ResponsiveContainer minWidth={1280}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId("responsive-container");
      expect(container.style.minWidth).toBe("1280px");
    });
  });

  describe("layout styling", () => {
    it("has h-screen class for full viewport height", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveClass("h-screen");
    });

    it("has w-full class for full width", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveClass("w-full");
    });

    it("has overflow-x-auto for horizontal scrolling", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveClass("overflow-x-auto");
    });

    it("has relative positioning", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveClass("relative");
    });
  });

  describe("viewport width detection", () => {
    it("sets data-too-narrow to false when viewport is wide enough", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");
    });

    it("sets data-too-narrow to true when viewport is too narrow", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");
    });

    it("updates data-too-narrow on window resize to smaller", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");

      simulateResize(800);

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");
    });

    it("updates data-too-narrow on window resize to larger", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");

      simulateResize(1200);

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");
    });

    it("uses custom minWidth for narrow detection", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 900,
      });

      render(
        <ResponsiveContainer minWidth={800}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");
    });

    it("detects narrow viewport with custom minWidth", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1100,
      });

      render(
        <ResponsiveContainer minWidth={1280}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");
    });
  });

  describe("warning banner", () => {
    beforeEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it("does not show warning by default when showWarning is false", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.queryByTestId("narrow-viewport-warning")).not.toBeInTheDocument();
    });

    it("shows warning when showWarning is true and viewport is narrow", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toBeInTheDocument();
    });

    it("displays default warning message", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByText("This application is best viewed on screens 1024px or wider.")).toBeInTheDocument();
    });

    it("displays custom warning message", () => {
      render(
        <ResponsiveContainer showWarning warningMessage="Please use a wider screen">
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByText("Please use a wider screen")).toBeInTheDocument();
    });

    it("hides warning when viewport becomes wide enough", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toBeInTheDocument();

      simulateResize(1200);

      expect(screen.queryByTestId("narrow-viewport-warning")).not.toBeInTheDocument();
    });

    it("does not show warning when showWarning is true but viewport is wide", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.queryByTestId("narrow-viewport-warning")).not.toBeInTheDocument();
    });
  });

  describe("warning banner styling", () => {
    beforeEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it("warning has sticky positioning", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("sticky");
    });

    it("warning has z-50 for layering", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("z-50");
    });

    it("warning has bg-yellow-500/90 background", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("bg-yellow-500/90");
    });

    it("warning has text-center alignment", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("text-center");
    });

    it("warning has top-0 positioning", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("top-0");
    });

    it("warning has left-0 positioning", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveClass("left-0");
    });
  });

  describe("warning accessibility", () => {
    beforeEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it("warning has role='alert' for screen readers", () => {
      render(
        <ResponsiveContainer showWarning>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("narrow-viewport-warning")).toHaveAttribute("role", "alert");
    });
  });

  describe("event listener cleanup", () => {
    it("adds resize event listener on mount", () => {
      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("removes resize event listener on unmount", () => {
      const { unmount } = render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });
  });

  describe("edge cases", () => {
    it("handles viewport exactly at minimum width", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      // Exactly at minWidth should be considered wide enough
      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");
    });

    it("handles viewport one pixel below minimum width", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1023,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");
    });

    it("handles very wide viewport", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 3840,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "false");
    });

    it("handles very narrow viewport", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("responsive-container")).toHaveAttribute("data-too-narrow", "true");
    });

    it("renders nested responsive containers", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ResponsiveContainer>
          <ResponsiveContainer minWidth={800}>
            <div>Nested Content</div>
          </ResponsiveContainer>
        </ResponsiveContainer>
      );

      const containers = screen.getAllByTestId("responsive-container");
      expect(containers).toHaveLength(2);
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });
  });

  describe("complex content rendering", () => {
    it("renders complex layout components as children", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <ResponsiveContainer>
          <div className="flex">
            <aside data-testid="sidebar">Sidebar</aside>
            <main data-testid="main">
              <header>Header</header>
              <article>Content</article>
              <footer>Footer</footer>
            </main>
          </div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });
  });
});
