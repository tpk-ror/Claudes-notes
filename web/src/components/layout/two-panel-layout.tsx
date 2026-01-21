"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TwoPanelLayoutProps {
  /** Content for the left panel (typically Chat) */
  leftPanel: React.ReactNode;
  /** Content for the right panel (typically Plan) */
  rightPanel: React.ReactNode;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the left panel */
  leftPanelClassName?: string;
  /** Custom class name for the right panel */
  rightPanelClassName?: string;
  /** Default width ratio for the left panel (0-1, default 0.5) */
  defaultLeftWidth?: number;
  /** Minimum width for each panel in pixels */
  minPanelWidth?: number;
}

/**
 * TwoPanelLayout provides a resizable two-panel layout for Chat and Plan panels.
 *
 * Features:
 * - Side-by-side panels that fill available height
 * - Draggable divider for resizing panels
 * - Minimum panel widths to prevent panels from becoming too small
 * - Keyboard accessible divider (left/right arrows to resize)
 * - Maintains aspect ratio on window resize
 */
export function TwoPanelLayout({
  leftPanel,
  rightPanel,
  className,
  leftPanelClassName,
  rightPanelClassName,
  defaultLeftWidth = 0.5,
  minPanelWidth = 300,
}: TwoPanelLayoutProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [leftWidthPercent, setLeftWidthPercent] = React.useState(
    defaultLeftWidth * 100
  );
  const [isDragging, setIsDragging] = React.useState(false);

  // Handle mouse drag to resize panels
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  // Handle keyboard navigation for divider
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const step = 2; // 2% per key press

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLeftWidthPercent((prev) => Math.max(20, prev - step));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setLeftWidthPercent((prev) => Math.min(80, prev + step));
      }
    },
    []
  );

  // Handle mouse move during drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const newLeftWidth = e.clientX - rect.left;

      // Enforce minimum widths
      const minPercent = (minPanelWidth / containerWidth) * 100;
      const maxPercent = 100 - minPercent;

      const newPercent = (newLeftWidth / containerWidth) * 100;
      const clampedPercent = Math.max(minPercent, Math.min(maxPercent, newPercent));

      setLeftWidthPercent(clampedPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minPanelWidth]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full overflow-hidden",
        isDragging && "select-none cursor-col-resize",
        className
      )}
      data-testid="two-panel-layout"
    >
      {/* Left panel (Chat) */}
      <div
        className={cn(
          "h-full overflow-hidden border-r border-border",
          leftPanelClassName
        )}
        style={{ width: `${leftWidthPercent}%` }}
        data-testid="left-panel"
      >
        {leftPanel}
      </div>

      {/* Resizable divider */}
      <div
        className={cn(
          "relative shrink-0 w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging && "bg-primary"
        )}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(leftWidthPercent)}
        aria-valuemin={20}
        aria-valuemax={80}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        data-testid="panel-divider"
      >
        {/* Visual indicator for drag handle */}
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right panel (Plan) */}
      <div
        className={cn("h-full overflow-hidden flex-1", rightPanelClassName)}
        data-testid="right-panel"
      >
        {rightPanel}
      </div>
    </div>
  );
}
