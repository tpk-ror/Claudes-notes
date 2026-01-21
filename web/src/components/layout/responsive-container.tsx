"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimum supported width for the application */
export const MIN_SUPPORTED_WIDTH = 1024;

export interface ResponsiveContainerProps {
  /** Content to render inside the container */
  children: React.ReactNode;
  /** Custom class name for the container */
  className?: string;
  /** Minimum width in pixels (default: 1024) */
  minWidth?: number;
  /** Whether to show a warning message when viewport is too narrow */
  showWarning?: boolean;
  /** Custom warning message */
  warningMessage?: string;
}

/**
 * ResponsiveContainer enforces a minimum width for the application layout.
 *
 * Features:
 * - Sets min-width CSS property to prevent layout from becoming too narrow
 * - Horizontal scroll appears when viewport is smaller than minimum
 * - Optional warning message when viewport is too narrow
 * - Full height container for app-level layouts
 */
export function ResponsiveContainer({
  children,
  className,
  minWidth = MIN_SUPPORTED_WIDTH,
  showWarning = false,
  warningMessage = "This application is best viewed on screens 1024px or wider.",
}: ResponsiveContainerProps) {
  const [isTooNarrow, setIsTooNarrow] = React.useState(false);

  React.useEffect(() => {
    // Only check viewport width on client side
    if (typeof window === "undefined") return;

    const checkWidth = () => {
      setIsTooNarrow(window.innerWidth < minWidth);
    };

    // Initial check
    checkWidth();

    // Listen for resize events
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [minWidth]);

  return (
    <div
      className={cn("relative h-screen w-full overflow-x-auto", className)}
      style={{ minWidth: `${minWidth}px` }}
      data-testid="responsive-container"
      data-too-narrow={isTooNarrow}
    >
      {/* Warning banner for narrow viewports */}
      {showWarning && isTooNarrow && (
        <div
          className="sticky left-0 top-0 z-50 w-full bg-yellow-500/90 px-4 py-2 text-center text-sm font-medium text-yellow-950"
          data-testid="narrow-viewport-warning"
          role="alert"
        >
          {warningMessage}
        </div>
      )}
      {children}
    </div>
  );
}
