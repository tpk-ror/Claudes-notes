import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TwoPanelLayout } from "./two-panel-layout";

describe("TwoPanelLayout component", () => {
  const mockLeftPanel = <div data-testid="mock-left">Left Content</div>;
  const mockRightPanel = <div data-testid="mock-right">Right Content</div>;

  beforeEach(() => {
    // Mock getBoundingClientRect for resize calculations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("two-panel-layout")).toBeInTheDocument();
    });

    it("renders left panel with correct data-testid", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("left-panel")).toBeInTheDocument();
    });

    it("renders right panel with correct data-testid", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("right-panel")).toBeInTheDocument();
    });

    it("renders divider with correct data-testid", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("panel-divider")).toBeInTheDocument();
    });

    it("renders left panel content", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("mock-left")).toBeInTheDocument();
      expect(screen.getByText("Left Content")).toBeInTheDocument();
    });

    it("renders right panel content", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("mock-right")).toBeInTheDocument();
      expect(screen.getByText("Right Content")).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className to container", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          className="my-custom-class"
        />
      );

      expect(screen.getByTestId("two-panel-layout")).toHaveClass("my-custom-class");
    });

    it("applies leftPanelClassName to left panel", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          leftPanelClassName="left-custom-class"
        />
      );

      expect(screen.getByTestId("left-panel")).toHaveClass("left-custom-class");
    });

    it("applies rightPanelClassName to right panel", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          rightPanelClassName="right-custom-class"
        />
      );

      expect(screen.getByTestId("right-panel")).toHaveClass("right-custom-class");
    });
  });

  describe("layout structure", () => {
    it("has flex layout on container", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("two-panel-layout")).toHaveClass("flex");
    });

    it("has h-full and w-full on container", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const container = screen.getByTestId("two-panel-layout");
      expect(container).toHaveClass("h-full", "w-full");
    });

    it("left panel has overflow-hidden", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("left-panel")).toHaveClass("overflow-hidden");
    });

    it("right panel has overflow-hidden", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("right-panel")).toHaveClass("overflow-hidden");
    });

    it("left panel has border-r", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("left-panel")).toHaveClass("border-r");
    });

    it("right panel has flex-1", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("right-panel")).toHaveClass("flex-1");
    });
  });

  describe("default width", () => {
    it("sets default left width to 50%", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const leftPanel = screen.getByTestId("left-panel");
      expect(leftPanel.style.width).toBe("50%");
    });

    it("applies custom defaultLeftWidth", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          defaultLeftWidth={0.6}
        />
      );

      const leftPanel = screen.getByTestId("left-panel");
      expect(leftPanel.style.width).toBe("60%");
    });
  });

  describe("divider accessibility", () => {
    it("has role='separator' on divider", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveAttribute("role", "separator");
    });

    it("has aria-orientation='vertical'", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveAttribute("aria-orientation", "vertical");
    });

    it("has aria-label for accessibility", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveAttribute("aria-label", "Resize panels");
    });

    it("has tabIndex=0 for keyboard focus", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveAttribute("tabIndex", "0");
    });

    it("has aria-valuenow for current position", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveAttribute("aria-valuenow", "50");
    });
  });

  describe("divider styling", () => {
    it("has cursor-col-resize on divider", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveClass("cursor-col-resize");
    });

    it("has bg-border on divider", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveClass("bg-border");
    });

    it("has w-1 width on divider", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveClass("w-1");
    });
  });

  describe("keyboard navigation", () => {
    it("decreases width on ArrowLeft", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      const leftPanel = screen.getByTestId("left-panel");

      fireEvent.keyDown(divider, { key: "ArrowLeft" });

      expect(leftPanel.style.width).toBe("48%");
    });

    it("increases width on ArrowRight", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      const leftPanel = screen.getByTestId("left-panel");

      fireEvent.keyDown(divider, { key: "ArrowRight" });

      expect(leftPanel.style.width).toBe("52%");
    });

    it("respects minimum width when pressing ArrowLeft", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          defaultLeftWidth={0.2}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      const leftPanel = screen.getByTestId("left-panel");

      // Press left multiple times
      fireEvent.keyDown(divider, { key: "ArrowLeft" });
      fireEvent.keyDown(divider, { key: "ArrowLeft" });

      // Should not go below 20%
      expect(parseFloat(leftPanel.style.width)).toBeGreaterThanOrEqual(20);
    });

    it("respects maximum width when pressing ArrowRight", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
          defaultLeftWidth={0.8}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      const leftPanel = screen.getByTestId("left-panel");

      // Press right multiple times
      fireEvent.keyDown(divider, { key: "ArrowRight" });
      fireEvent.keyDown(divider, { key: "ArrowRight" });

      // Should not exceed 80%
      expect(parseFloat(leftPanel.style.width)).toBeLessThanOrEqual(80);
    });

    it("does not resize on other keys", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      const leftPanel = screen.getByTestId("left-panel");

      fireEvent.keyDown(divider, { key: "ArrowUp" });
      fireEvent.keyDown(divider, { key: "ArrowDown" });
      fireEvent.keyDown(divider, { key: "Enter" });

      expect(leftPanel.style.width).toBe("50%");
    });
  });

  describe("mouse drag", () => {
    it("starts drag on mousedown", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      fireEvent.mouseDown(divider);

      // Container should have select-none class during drag
      const container = screen.getByTestId("two-panel-layout");
      expect(container).toHaveClass("select-none");
    });

    it("adds cursor-col-resize to container during drag", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      fireEvent.mouseDown(divider);

      const container = screen.getByTestId("two-panel-layout");
      expect(container).toHaveClass("cursor-col-resize");
    });

    it("divider has bg-primary class during drag", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      fireEvent.mouseDown(divider);

      expect(divider).toHaveClass("bg-primary");
    });

    it("ends drag on mouseup", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      fireEvent.mouseDown(divider);

      // Simulate mouseup on document
      fireEvent.mouseUp(document);

      // Container should no longer have select-none class
      const container = screen.getByTestId("two-panel-layout");
      expect(container).not.toHaveClass("select-none");
    });
  });

  describe("panel content rendering", () => {
    it("renders complex left panel content", () => {
      const complexLeft = (
        <div>
          <h1>Header</h1>
          <p>Paragraph</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      );

      render(
        <TwoPanelLayout
          leftPanel={complexLeft}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("renders complex right panel content", () => {
      const complexRight = (
        <div>
          <h2>Plan Title</h2>
          <div>
            <span>Task 1</span>
            <span>Task 2</span>
          </div>
        </div>
      );

      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={complexRight}
        />
      );

      expect(screen.getByText("Plan Title")).toBeInTheDocument();
      expect(screen.getByText("Task 1")).toBeInTheDocument();
      expect(screen.getByText("Task 2")).toBeInTheDocument();
    });
  });

  describe("focus handling", () => {
    it("has focus-visible styles on divider", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      expect(divider).toHaveClass("focus-visible:ring-2");
    });

    it("divider can be focused", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      const divider = screen.getByTestId("panel-divider");
      divider.focus();

      expect(document.activeElement).toBe(divider);
    });
  });

  describe("container overflow", () => {
    it("has overflow-hidden on container", () => {
      render(
        <TwoPanelLayout
          leftPanel={mockLeftPanel}
          rightPanel={mockRightPanel}
        />
      );

      expect(screen.getByTestId("two-panel-layout")).toHaveClass("overflow-hidden");
    });
  });
});
