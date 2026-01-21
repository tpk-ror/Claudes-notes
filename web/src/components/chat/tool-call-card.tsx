"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/store";

export interface ToolCallCardProps {
  toolCall: ToolCall;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * ToolCallCard component displays a tool invocation with
 * name, arguments, and results in a collapsible card.
 */
export function ToolCallCard({
  toolCall,
  defaultOpen = false,
  className,
}: ToolCallCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const hasResult = toolCall.result !== undefined && toolCall.result !== null;

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

  // Format arguments for display
  const formattedArgs = React.useMemo(() => {
    try {
      return JSON.stringify(toolCall.arguments, null, 2);
    } catch {
      return String(toolCall.arguments);
    }
  }, [toolCall.arguments]);

  // Get argument summary for collapsed state
  const argSummary = React.useMemo(() => {
    const keys = Object.keys(toolCall.arguments || {});
    if (keys.length === 0) return "no args";
    if (keys.length === 1) return `${keys[0]}: ...`;
    return `${keys.length} args`;
  }, [toolCall.arguments]);

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        hasResult
          ? "border-border bg-card"
          : "border-yellow-500/30 bg-yellow-500/5",
        className
      )}
      data-testid={`tool-call-${toolCall.id}`}
    >
      {/* Header - clickable toggle */}
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2",
          "text-sm",
          "hover:bg-muted/50",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-controls={`tool-content-${toolCall.id}`}
      >
        {/* Chevron icon */}
        <svg
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          data-testid="chevron-icon"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Tool icon (wrench) */}
        <svg
          className={cn(
            "h-4 w-4 shrink-0",
            hasResult ? "text-muted-foreground" : "text-yellow-600 dark:text-yellow-500"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          data-testid="tool-icon"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>

        {/* Tool name */}
        <span className="font-medium text-foreground">{toolCall.name}</span>

        {/* Status indicator */}
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 text-xs",
            hasResult ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500"
          )}
          data-testid="tool-status"
        >
          {hasResult ? (
            <>
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Complete</span>
            </>
          ) : (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Running</span>
            </>
          )}
        </span>

        {/* Collapsed summary */}
        {!isOpen && (
          <span className="text-xs text-muted-foreground ml-2">
            ({argSummary})
          </span>
        )}
      </button>

      {/* Collapsible content */}
      <div
        id={`tool-content-${toolCall.id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="border-t border-border">
          {/* Arguments section */}
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              Arguments
            </div>
            <pre
              className={cn(
                "text-xs font-mono bg-muted/50 rounded p-2",
                "overflow-x-auto max-h-[200px] overflow-y-auto",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
              data-testid="tool-arguments"
            >
              {formattedArgs}
            </pre>
          </div>

          {/* Result section (if available) */}
          {hasResult && (
            <div className="px-3 py-2 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                Result
              </div>
              <pre
                className={cn(
                  "text-xs font-mono bg-muted/50 rounded p-2",
                  "overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words",
                  "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                )}
                data-testid="tool-result"
              >
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ToolCallCardListProps {
  toolCalls: ToolCall[];
  defaultOpen?: boolean;
  className?: string;
}

/**
 * ToolCallCardList renders multiple tool call cards
 * with consistent styling and spacing.
 */
export function ToolCallCardList({
  toolCalls,
  defaultOpen = false,
  className,
}: ToolCallCardListProps) {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-testid="tool-call-list"
    >
      {toolCalls.map((toolCall) => (
        <ToolCallCard
          key={toolCall.id}
          toolCall={toolCall}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  );
}
