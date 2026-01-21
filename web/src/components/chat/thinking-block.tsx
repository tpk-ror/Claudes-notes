"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ThinkingBlock as ThinkingBlockType } from "@/store";

export interface ThinkingBlockProps {
  block: ThinkingBlockType;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * ThinkingBlock component displays Claude's thinking/reasoning content
 * in a collapsible container with smooth animations.
 */
export function ThinkingBlock({
  block,
  defaultOpen = false,
  className,
}: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const toggleOpen = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleOpen();
      }
    },
    [toggleOpen]
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 overflow-hidden",
        className
      )}
      data-testid={`thinking-block-${block.id}`}
    >
      {/* Header - clickable toggle */}
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2",
          "text-sm text-muted-foreground",
          "hover:bg-muted/50 hover:text-foreground",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-controls={`thinking-content-${block.id}`}
      >
        {/* Chevron icon */}
        <svg
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Brain icon for thinking */}
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
          <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
          <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
          <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
          <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
          <path d="M6 18a4 4 0 0 1-1.967-.516" />
          <path d="M19.967 17.484A4 4 0 0 1 18 18" />
        </svg>

        <span className="font-medium">Thinking</span>

        {/* Content length indicator */}
        {block.content && (
          <span className="ml-auto text-xs opacity-60">
            {formatContentLength(block.content)}
          </span>
        )}
      </button>

      {/* Collapsible content */}
      <div
        id={`thinking-content-${block.id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="border-t border-border px-3 py-3">
          <div
            className={cn(
              "text-sm text-muted-foreground whitespace-pre-wrap break-words",
              "max-h-[400px] overflow-y-auto",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
          >
            {block.content || (
              <span className="italic opacity-60">No content</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format content length for display
 */
function formatContentLength(content: string): string {
  const chars = content.length;
  if (chars < 1000) {
    return `${chars} chars`;
  }
  const k = Math.round(chars / 1000);
  return `${k}k chars`;
}

export interface ThinkingBlockListProps {
  blocks: ThinkingBlockType[];
  defaultOpen?: boolean;
  className?: string;
}

/**
 * ThinkingBlockList renders multiple thinking blocks
 * with consistent styling and spacing.
 */
export function ThinkingBlockList({
  blocks,
  defaultOpen = false,
  className,
}: ThinkingBlockListProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-testid="thinking-block-list"
    >
      {blocks.map((block) => (
        <ThinkingBlock key={block.id} block={block} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}
