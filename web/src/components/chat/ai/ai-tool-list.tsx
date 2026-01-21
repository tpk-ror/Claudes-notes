"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
} from "lucide-react";
import type { ToolInvocation } from "@/hooks/use-cli-chat";

export interface AiToolCardProps {
  tool: ToolInvocation;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Individual tool call card with collapsible content and status indicators.
 */
export function AiToolCard({
  tool,
  isStreaming = false,
  className,
}: AiToolCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Auto-expand when running
  React.useEffect(() => {
    if (tool.status === "running") {
      setIsOpen(true);
    }
  }, [tool.status]);

  const statusIcon = React.useMemo(() => {
    switch (tool.status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  }, [tool.status]);

  const statusLabel = React.useMemo(() => {
    switch (tool.status) {
      case "pending":
        return "Pending";
      case "running":
        return "Running...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "";
    }
  }, [tool.status]);

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-background",
        tool.status === "running" && "border-primary/50",
        tool.status === "error" && "border-destructive/50",
        className
      )}
      data-testid={`ai-tool-${tool.id}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-left",
          "text-sm hover:bg-muted/50 transition-colors"
        )}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-mono font-medium truncate flex-1">
          {tool.name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {statusIcon}
          <span className="hidden sm:inline">{statusLabel}</span>
        </span>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-border px-3 py-2 space-y-2">
          {/* Arguments */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Arguments
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          </div>

          {/* Result (if available) */}
          {tool.result && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {tool.isError ? "Error" : "Result"}
              </div>
              <pre
                className={cn(
                  "text-xs p-2 rounded overflow-x-auto max-h-48",
                  tool.isError ? "bg-destructive/10 text-destructive" : "bg-muted"
                )}
              >
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface AiToolListProps {
  toolCalls: ToolInvocation[];
  isStreaming?: boolean;
  className?: string;
}

/**
 * List of tool call cards
 */
export function AiToolList({
  toolCalls,
  isStreaming = false,
  className,
}: AiToolListProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)} data-testid="ai-tool-list">
      {toolCalls.map((tool) => (
        <AiToolCard key={tool.id} tool={tool} isStreaming={isStreaming} />
      ))}
    </div>
  );
}
