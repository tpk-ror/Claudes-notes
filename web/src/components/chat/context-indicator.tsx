"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlanContext } from "@/types/plan-files";

export interface ContextIndicatorProps {
  /** The loaded plan context */
  context: PlanContext | null;
  /** Called when user wants to clear the context */
  onClear: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * ContextIndicator shows the currently loaded plan context above the chat input.
 *
 * Displays:
 * - File icon and filename
 * - "Clear Context" button
 */
export function ContextIndicator({
  context,
  onClear,
  className,
}: ContextIndicatorProps) {
  if (!context) return null;

  // Truncate filename for display
  const displayName = context.fileName.length > 30
    ? context.fileName.slice(0, 27) + "..."
    : context.fileName;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-t-lg border border-b-0 border-border",
        className
      )}
      data-testid="context-indicator"
    >
      {/* File icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-muted-foreground"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>

      {/* Filename */}
      <span className="text-sm text-foreground truncate" title={context.fileName}>
        {displayName}
      </span>

      {/* Separator */}
      <span className="text-muted-foreground/50">|</span>

      {/* Content size indicator */}
      <span className="text-xs text-muted-foreground">
        {formatContentSize(context.content.length)}
      </span>

      {/* Clear button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-auto h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        data-testid="clear-context-btn"
      >
        Clear Context
      </Button>
    </div>
  );
}

/**
 * Format content size for display
 */
function formatContentSize(chars: number): string {
  if (chars < 1000) {
    return `${chars} chars`;
  } else if (chars < 10000) {
    return `${(chars / 1000).toFixed(1)}k chars`;
  } else {
    return `${Math.round(chars / 1000)}k chars`;
  }
}
