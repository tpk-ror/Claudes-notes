import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThinkingBlock, ThinkingBlockList } from "./thinking-block";
import type { ThinkingBlock as ThinkingBlockType } from "@/store";

function createMockBlock(overrides: Partial<ThinkingBlockType> = {}): ThinkingBlockType {
  return {
    id: "think-1",
    content: "This is my thinking process...",
    ...overrides,
  };
}

describe("ThinkingBlock component", () => {
  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const block = createMockBlock({ id: "think-abc" });
      render(<ThinkingBlock block={block} />);

      expect(screen.getByTestId("thinking-block-think-abc")).toBeInTheDocument();
    });

    it("displays 'Thinking' label", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      expect(screen.getByText("Thinking")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} className="my-custom-class" />);

      const container = screen.getByTestId("thinking-block-think-1");
      expect(container).toHaveClass("my-custom-class");
    });

    it("renders content length indicator", () => {
      const block = createMockBlock({ content: "Short content" });
      render(<ThinkingBlock block={block} />);

      expect(screen.getByText(/chars/)).toBeInTheDocument();
    });

    it("formats character count for small content", () => {
      const block = createMockBlock({ content: "A".repeat(500) });
      render(<ThinkingBlock block={block} />);

      expect(screen.getByText("500 chars")).toBeInTheDocument();
    });

    it("formats character count with k suffix for large content", () => {
      const block = createMockBlock({ content: "A".repeat(2500) });
      render(<ThinkingBlock block={block} />);

      expect(screen.getByText("3k chars")).toBeInTheDocument();
    });
  });

  describe("collapse/expand behavior", () => {
    it("is collapsed by default", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("expands when defaultOpen is true", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles on click", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles on Enter key press", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(button, { key: "Enter" });
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles on Space key press", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(button, { key: " " });
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("does not toggle on other key presses", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.keyDown(button, { key: "a" });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("content display", () => {
    it("shows content when expanded", () => {
      const block = createMockBlock({ content: "My detailed thinking" });
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      expect(screen.getByText("My detailed thinking")).toBeInTheDocument();
    });

    it("shows 'No content' message for empty content", () => {
      const block = createMockBlock({ content: "" });
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      expect(screen.getByText("No content")).toBeInTheDocument();
    });

    it("preserves whitespace in content", () => {
      const block = createMockBlock({ content: "Line 1\n  Line 2\n    Line 3" });
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      const contentElement = screen.getByText(/Line 1/);
      expect(contentElement).toHaveClass("whitespace-pre-wrap");
    });

    it("content is aria-hidden when collapsed", () => {
      const block = createMockBlock({ id: "think-test" });
      render(<ThinkingBlock block={block} defaultOpen={false} />);

      const content = document.getElementById("thinking-content-think-test");
      expect(content).toHaveAttribute("aria-hidden", "true");
    });

    it("content is not aria-hidden when expanded", () => {
      const block = createMockBlock({ id: "think-test" });
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      const content = document.getElementById("thinking-content-think-test");
      expect(content).toHaveAttribute("aria-hidden", "false");
    });
  });

  describe("accessibility", () => {
    it("has accessible button with aria-expanded", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded");
    });

    it("button controls content element", () => {
      const block = createMockBlock({ id: "think-test" });
      render(<ThinkingBlock block={block} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-controls", "thinking-content-think-test");
    });

    it("has hidden decorative icons", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      const svgs = screen.getByTestId("thinking-block-think-1").querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("icons", () => {
    it("renders chevron icon", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      // Check for polyline element which is the chevron
      const container = screen.getByTestId("thinking-block-think-1");
      const polyline = container.querySelector("polyline");
      expect(polyline).toBeInTheDocument();
    });

    it("renders brain icon", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} />);

      // Check for path elements which form the brain icon
      const container = screen.getByTestId("thinking-block-think-1");
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });

    it("chevron rotates when expanded", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} defaultOpen={false} />);

      const container = screen.getByTestId("thinking-block-think-1");
      const chevronSvg = container.querySelector("svg");
      expect(chevronSvg).not.toHaveClass("rotate-90");

      // Click to expand
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // After click, chevron should have rotate-90 class
      expect(chevronSvg).toHaveClass("rotate-90");
    });

    it("chevron has rotate-90 class when defaultOpen is true", () => {
      const block = createMockBlock();
      render(<ThinkingBlock block={block} defaultOpen={true} />);

      const container = screen.getByTestId("thinking-block-think-1");
      const chevronSvg = container.querySelector("svg");
      expect(chevronSvg).toHaveClass("rotate-90");
    });
  });
});

describe("ThinkingBlockList component", () => {
  describe("basic rendering", () => {
    it("renders with correct data-testid", () => {
      const blocks = [createMockBlock({ id: "think-1" })];
      render(<ThinkingBlockList blocks={blocks} />);

      expect(screen.getByTestId("thinking-block-list")).toBeInTheDocument();
    });

    it("renders multiple blocks", () => {
      const blocks = [
        createMockBlock({ id: "think-1" }),
        createMockBlock({ id: "think-2" }),
        createMockBlock({ id: "think-3" }),
      ];
      render(<ThinkingBlockList blocks={blocks} />);

      expect(screen.getByTestId("thinking-block-think-1")).toBeInTheDocument();
      expect(screen.getByTestId("thinking-block-think-2")).toBeInTheDocument();
      expect(screen.getByTestId("thinking-block-think-3")).toBeInTheDocument();
    });

    it("applies custom className to container", () => {
      const blocks = [createMockBlock()];
      render(<ThinkingBlockList blocks={blocks} className="my-list-class" />);

      expect(screen.getByTestId("thinking-block-list")).toHaveClass("my-list-class");
    });
  });

  describe("empty state", () => {
    it("returns null for empty blocks array", () => {
      const { container } = render(<ThinkingBlockList blocks={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for undefined blocks", () => {
      const { container } = render(<ThinkingBlockList blocks={undefined as unknown as ThinkingBlockType[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("defaultOpen prop", () => {
    it("passes defaultOpen to all blocks when true", () => {
      const blocks = [
        createMockBlock({ id: "think-1" }),
        createMockBlock({ id: "think-2" }),
      ];
      render(<ThinkingBlockList blocks={blocks} defaultOpen={true} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("passes defaultOpen to all blocks when false", () => {
      const blocks = [
        createMockBlock({ id: "think-1" }),
        createMockBlock({ id: "think-2" }),
      ];
      render(<ThinkingBlockList blocks={blocks} defaultOpen={false} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("defaults to false when not specified", () => {
      const blocks = [createMockBlock({ id: "think-1" })];
      render(<ThinkingBlockList blocks={blocks} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("block content", () => {
    it("renders block content correctly", () => {
      const blocks = [
        createMockBlock({ id: "think-1", content: "First thought process" }),
        createMockBlock({ id: "think-2", content: "Second thought process" }),
      ];
      render(<ThinkingBlockList blocks={blocks} defaultOpen={true} />);

      expect(screen.getByText("First thought process")).toBeInTheDocument();
      expect(screen.getByText("Second thought process")).toBeInTheDocument();
    });

    it("each block can be toggled independently", () => {
      const blocks = [
        createMockBlock({ id: "think-1" }),
        createMockBlock({ id: "think-2" }),
      ];
      render(<ThinkingBlockList blocks={blocks} />);

      const buttons = screen.getAllByRole("button");

      // Toggle first block only
      fireEvent.click(buttons[0]);

      expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
      expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
    });
  });
});
