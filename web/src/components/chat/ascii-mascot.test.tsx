import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AsciiMascot, MASCOT_COUNT, MASCOT_NAMES } from "./ascii-mascot";

describe("AsciiMascot component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock matchMedia for reduced motion
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

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("inline variant", () => {
    it("renders the inline mascot by default", () => {
      render(<AsciiMascot character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toBeInTheDocument();
      expect(mascot.tagName.toLowerCase()).toBe("span");
    });

    it("displays first inline frame initially (claude character)", () => {
      render(<AsciiMascot character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveTextContent("(o.o)");
    });

    it("animates through inline frames", () => {
      render(<AsciiMascot speed={400} character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");

      expect(mascot).toHaveTextContent("(o.o)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(-.-)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(^.^)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(o.-)");

      // Should loop back
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(o.o)");
    });
  });

  describe("block variant", () => {
    it("renders the block mascot", () => {
      render(<AsciiMascot variant="block" character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toBeInTheDocument();
      expect(mascot.tagName.toLowerCase()).toBe("div");
    });

    it("displays first block frame initially (claude character)", () => {
      render(<AsciiMascot variant="block" character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveTextContent("(o.o)");
      expect(mascot).toHaveTextContent("|_|");
    });

    it("animates through block frames", () => {
      render(<AsciiMascot variant="block" speed={400} character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");

      expect(mascot).toHaveTextContent("(o.o)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(-.-)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(o.-)");

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mascot).toHaveTextContent("(-.o)");
    });
  });

  describe("character selection", () => {
    it("renders claude character when character=0", () => {
      render(<AsciiMascot character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveAttribute("data-character", "claude");
    });

    it("renders kitty character when character=1", () => {
      render(<AsciiMascot character={1} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveAttribute("data-character", "kitty");
      expect(mascot).toHaveTextContent("=^.^=");
    });

    it("renders bear character when character=2", () => {
      render(<AsciiMascot character={2} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveAttribute("data-character", "bear");
    });

    it("renders robot character when character=3", () => {
      render(<AsciiMascot character={3} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveAttribute("data-character", "robot");
      expect(mascot).toHaveTextContent("[o.o]");
    });

    it("selects random character when character prop is not provided", () => {
      // Mock Math.random to return a specific value
      const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

      render(<AsciiMascot />);
      const mascot = screen.getByTestId("ascii-mascot");

      // Should have selected a character (index 4 with 0.5 * 8 = 4)
      expect(mascot).toHaveAttribute("data-character");
      expect(MASCOT_NAMES).toContain(mascot.getAttribute("data-character"));

      mockRandom.mockRestore();
    });

    it("exports MASCOT_COUNT constant", () => {
      expect(MASCOT_COUNT).toBe(8);
    });

    it("exports MASCOT_NAMES array", () => {
      expect(MASCOT_NAMES).toEqual([
        "claude",
        "kitty",
        "bear",
        "robot",
        "bunny",
        "owl",
        "ghost",
        "alien",
      ]);
    });
  });

  describe("accessibility", () => {
    it("has role status", () => {
      render(<AsciiMascot character={0} />);
      const mascot = screen.getByRole("status");
      expect(mascot).toBeInTheDocument();
    });

    it("has aria-label for screen readers", () => {
      render(<AsciiMascot character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveAttribute("aria-label", "Claude is thinking");
    });

    it("respects prefers-reduced-motion", () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<AsciiMascot character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");

      // Should stay on first frame when reduced motion is preferred
      expect(mascot).toHaveTextContent("(o.o)");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be on first frame
      expect(mascot).toHaveTextContent("(o.o)");
    });
  });

  describe("props", () => {
    it("applies custom className", () => {
      render(<AsciiMascot className="custom-class" character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toHaveClass("custom-class");
    });

    it("respects animate=false prop", () => {
      render(<AsciiMascot animate={false} character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");

      expect(mascot).toHaveTextContent("(o.o)");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be on first frame
      expect(mascot).toHaveTextContent("(o.o)");
    });

    it("respects custom speed prop", () => {
      render(<AsciiMascot speed={200} character={0} />);
      const mascot = screen.getByTestId("ascii-mascot");

      expect(mascot).toHaveTextContent("(o.o)");

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(mascot).toHaveTextContent("(-.-)");
    });
  });
});
