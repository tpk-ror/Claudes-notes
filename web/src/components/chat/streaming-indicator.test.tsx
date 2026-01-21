import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamingIndicator } from "./streaming-indicator";

describe("StreamingIndicator component", () => {
  beforeEach(() => {
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

  describe("cursor variant", () => {
    it("renders the cursor indicator", () => {
      render(<StreamingIndicator variant="cursor" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toBeInTheDocument();
    });

    it("has accessible label", () => {
      render(<StreamingIndicator variant="cursor" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-label", "Loading");
    });

    it("contains animated cursor element", () => {
      render(<StreamingIndicator variant="cursor" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toHaveTextContent("|");
    });

    it("has animation class for visual feedback", () => {
      render(<StreamingIndicator variant="cursor" />);
      const indicator = screen.getByTestId("streaming-indicator");
      const animatedSpan = indicator.querySelector(".animate-pulse");
      expect(animatedSpan).toBeInTheDocument();
    });
  });

  describe("inline variant (default)", () => {
    it("renders the inline mascot by default", () => {
      render(<StreamingIndicator />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toBeInTheDocument();
    });

    it("contains ASCII mascot face", () => {
      render(<StreamingIndicator />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toBeInTheDocument();
      // Mascot has a character attribute (random selection)
      expect(mascot).toHaveAttribute("data-character");
    });

    it("renders inline variant explicitly", () => {
      render(<StreamingIndicator variant="inline" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator.tagName.toLowerCase()).toBe("span");
    });
  });

  describe("block variant", () => {
    it("renders the block mascot", () => {
      render(<StreamingIndicator variant="block" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toBeInTheDocument();
      expect(indicator.tagName.toLowerCase()).toBe("div");
    });

    it("contains ASCII mascot with body", () => {
      render(<StreamingIndicator variant="block" />);
      const mascot = screen.getByTestId("ascii-mascot");
      expect(mascot).toBeInTheDocument();
      // Mascot has a character attribute (random selection)
      expect(mascot).toHaveAttribute("data-character");
      // Block variant renders as div with nested spans
      expect(mascot.tagName.toLowerCase()).toBe("div");
    });

    it("has centered layout", () => {
      render(<StreamingIndicator variant="block" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toHaveClass("justify-center");
    });
  });

  describe("common props", () => {
    it("applies custom className to cursor variant", () => {
      render(<StreamingIndicator variant="cursor" className="custom-class" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toHaveClass("custom-class");
    });

    it("applies custom className to inline variant", () => {
      render(<StreamingIndicator variant="inline" className="custom-class" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toHaveClass("custom-class");
    });

    it("applies custom className to block variant", () => {
      render(<StreamingIndicator variant="block" className="custom-class" />);
      const indicator = screen.getByTestId("streaming-indicator");
      expect(indicator).toHaveClass("custom-class");
    });
  });
});
