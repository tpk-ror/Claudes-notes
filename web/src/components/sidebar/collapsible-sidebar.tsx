"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SessionHistorySidebar, type SessionHistorySidebarProps } from "./session-history-sidebar";
import { PlanFileList } from "./plan-file-list";
import type { PlanFileInfo } from "@/types/plan-files";

export interface CollapsibleSidebarProps extends SessionHistorySidebarProps {
  /** Width of the expanded sidebar in pixels */
  width?: number;
  /** Whether the sidebar is initially collapsed */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Header content to display above the session list */
  header?: React.ReactNode;
  /** Project path for loading plan files */
  projectPath?: string;
  /** Called when a plan file is selected */
  onSelectPlanFile?: (file: PlanFileInfo) => void;
  /** Currently selected plan file name */
  selectedPlanFileName?: string | null;
}

/**
 * CollapsibleSidebar wraps SessionHistorySidebar with collapse/expand functionality.
 *
 * Features:
 * - Toggle button to collapse/expand the sidebar
 * - Smooth CSS transitions for width changes
 * - Collapsed state shows only a toggle button
 * - Keyboard accessible toggle (Enter/Space)
 * - Preserves session selection and scroll position
 */
export function CollapsibleSidebar({
  className,
  width = 280,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  header,
  projectPath,
  onSelectPlanFile,
  selectedPlanFileName,
  ...sessionHistoryProps
}: CollapsibleSidebarProps) {
  const [plansExpanded, setPlansExpanded] = React.useState(true);
  // Support both controlled and uncontrolled modes
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggle = React.useCallback(() => {
    const newCollapsed = !isCollapsed;
    setInternalCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-background transition-[width] duration-200 ease-in-out",
        className
      )}
      style={{ width: isCollapsed ? 48 : width }}
      data-testid="collapsible-sidebar"
      data-collapsed={isCollapsed}
      aria-label="Session sidebar"
    >
      {/* Toggle button */}
      <div
        className={cn(
          "flex items-center border-b border-border",
          isCollapsed ? "justify-center p-2" : "justify-between p-2"
        )}
      >
        {!isCollapsed && header && (
          <div className="flex-1 truncate text-sm font-medium" data-testid="sidebar-header">
            {header}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          aria-controls="sidebar-content"
          data-testid="sidebar-toggle"
          className="shrink-0"
        >
          {/* Chevron icon - rotates based on collapsed state */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-transform duration-200",
              isCollapsed ? "rotate-0" : "rotate-180"
            )}
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </div>

      {/* Sidebar content */}
      <div
        id="sidebar-content"
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-200",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        data-testid="sidebar-content"
        aria-hidden={isCollapsed}
      >
        {/* Sessions section */}
        <div className="border-b border-border">
          <SessionHistorySidebar {...sessionHistoryProps} />
        </div>

        {/* Plans section */}
        {projectPath && onSelectPlanFile && (
          <div data-testid="plans-section">
            {/* Section header */}
            <button
              onClick={() => setPlansExpanded(!plansExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              data-testid="plans-section-toggle"
            >
              <span>Plans</span>
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
                className={cn(
                  "transition-transform duration-200",
                  plansExpanded ? "rotate-180" : "rotate-0"
                )}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Plan files list */}
            {plansExpanded && (
              <PlanFileList
                projectPath={projectPath}
                onSelectFile={onSelectPlanFile}
                selectedFileName={selectedPlanFileName}
              />
            )}
          </div>
        )}
      </div>

      {/* Collapsed state: show icon to indicate sessions */}
      {isCollapsed && (
        <div
          className="flex flex-1 flex-col items-center pt-4 text-muted-foreground"
          data-testid="collapsed-indicator"
          aria-hidden="true"
        >
          {/* Sessions icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
    </aside>
  );
}
