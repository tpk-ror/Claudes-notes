"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AsciiMascot } from "./ascii-mascot";

export interface StreamingIndicatorProps {
  variant?: "inline" | "block" | "cursor";
  className?: string;
}

/**
 * StreamingIndicator component that shows a visual indicator during streaming.
 * Supports three variants:
 * - 'cursor': Original blinking cursor (|)
 * - 'inline': ASCII mascot face inline with text
 * - 'block': ASCII mascot with body, centered block display
 */
export function StreamingIndicator({
  variant = "inline",
  className,
}: StreamingIndicatorProps) {
  if (variant === "cursor") {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5 ml-1", className)}
        data-testid="streaming-indicator"
        aria-label="Loading"
        role="status"
      >
        <span className="animate-pulse">|</span>
      </span>
    );
  }

  if (variant === "block") {
    return (
      <div
        className={cn("flex justify-center py-2", className)}
        data-testid="streaming-indicator"
      >
        <AsciiMascot variant="block" />
      </div>
    );
  }

  // Default: inline variant
  return (
    <span
      className={cn("inline-flex items-center ml-1", className)}
      data-testid="streaming-indicator"
    >
      <AsciiMascot variant="inline" />
    </span>
  );
}
