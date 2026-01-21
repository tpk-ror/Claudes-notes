"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";

export interface AiReasoningBlockProps {
  /** Unique identifier for the block */
  id: string;
  /** Reasoning/thinking content */
  content: string;
  /** Whether this block is currently streaming */
  isStreaming?: boolean;
  /** Whether the block should be open by default */
  isOpen?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Reasoning/thinking block component following AI SDK patterns.
 * Auto-opens during streaming and can be collapsed when complete.
 */
export function AiReasoningBlock({
  id,
  content,
  isStreaming = false,
  isOpen: defaultOpen = false,
  className,
}: AiReasoningBlockProps) {
  // Auto-open during streaming
  const [isOpen, setIsOpen] = React.useState(defaultOpen || isStreaming);

  // Update open state when streaming status changes
  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  const handleToggle = () => {
    // Only allow toggle when not streaming
    if (!isStreaming) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      className={cn(
        "border border-border/50 rounded-lg bg-muted/30 overflow-hidden",
        isStreaming && "border-primary/30 animate-pulse-subtle",
        className
      )}
      data-testid={`ai-reasoning-${id}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isStreaming}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-left",
          "text-sm text-muted-foreground hover:bg-muted/50",
          "transition-colors",
          isStreaming && "cursor-default"
        )}
        aria-expanded={isOpen}
        aria-controls={`reasoning-content-${id}`}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <Brain className="h-4 w-4 shrink-0" />
        <span className="font-medium">
          {isStreaming ? "Thinking..." : "Reasoning"}
        </span>
        {isStreaming && (
          <span className="ml-auto flex gap-1">
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div
          id={`reasoning-content-${id}`}
          className="px-3 pb-3 pt-1 text-sm text-muted-foreground whitespace-pre-wrap"
        >
          {content || (isStreaming ? "Processing..." : "No content")}
        </div>
      )}
    </div>
  );
}

export interface AiReasoningListProps {
  blocks: Array<{
    id: string;
    content: string;
    isComplete?: boolean;
  }>;
  isStreaming?: boolean;
  className?: string;
}

/**
 * List of reasoning blocks
 */
export function AiReasoningList({
  blocks,
  isStreaming = false,
  className,
}: AiReasoningListProps) {
  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((block, index) => {
        const isLastBlock = index === blocks.length - 1;
        const blockIsStreaming = isStreaming && isLastBlock && !block.isComplete;

        return (
          <AiReasoningBlock
            key={block.id}
            id={block.id}
            content={block.content}
            isStreaming={blockIsStreaming}
            isOpen={blockIsStreaming}
          />
        );
      })}
    </div>
  );
}
