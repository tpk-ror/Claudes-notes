"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ReasoningBlock, ToolInvocation } from "@/hooks/use-cli-chat";
import { parseQuestionWithOptions } from "@/lib/option-parser";
import { StreamingIndicator } from "../streaming-indicator";
import { MarkdownRenderer } from "../markdown-renderer";
import { InteractiveOptions } from "../interactive-options";
import { AiReasoningBlock } from "./ai-reasoning";
import { AiToolList } from "./ai-tool-list";

export interface AiMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isLatestAssistant?: boolean;
  /** Active reasoning blocks during streaming */
  activeReasoning?: ReasoningBlock[];
  /** Active tool calls during streaming */
  activeToolCalls?: ToolInvocation[];
  onOptionSelect?: (value: string) => void;
  className?: string;
}

/**
 * Individual message component for AI SDK integration.
 * Displays chat bubbles with reasoning, tool calls, and interactive options.
 */
export function AiMessageItem({
  message,
  isStreaming = false,
  isLatestAssistant = false,
  activeReasoning,
  activeToolCalls,
  onOptionSelect,
  className,
}: AiMessageItemProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Parse for interactive options
  const parsedQuestion = React.useMemo(() => {
    if (!isAssistant || !isLatestAssistant || isStreaming) return null;
    return parseQuestionWithOptions(message.content);
  }, [isAssistant, isLatestAssistant, isStreaming, message.content]);

  // Use active reasoning/tools if streaming, otherwise use from message
  const reasoningBlocks = isStreaming ? activeReasoning : message.reasoning;
  const toolCalls = isStreaming ? activeToolCalls : message.toolCalls;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        isUser && "items-end",
        isAssistant && "items-start",
        className
      )}
      data-testid={`ai-message-${message.id}`}
      data-role={message.role}
    >
      {/* Role indicator */}
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isUser && "text-primary",
          isAssistant && "text-muted-foreground"
        )}
      >
        {message.role}
      </span>

      {/* Reasoning blocks (shown before message content during streaming) */}
      {isAssistant && reasoningBlocks && reasoningBlocks.length > 0 && (
        <div className="w-full max-w-[85%] space-y-2">
          {reasoningBlocks.map((block) => (
            <AiReasoningBlock
              key={block.id}
              id={block.id}
              content={block.content}
              isStreaming={isStreaming && !block.isComplete}
              isOpen={isStreaming && !block.isComplete}
            />
          ))}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[85%]",
          isUser && "bg-primary text-primary-foreground",
          isAssistant && "bg-secondary text-secondary-foreground"
        )}
      >
        {isAssistant ? (
          <div className="break-words">
            {isStreaming && message.content.length === 0 ? (
              <StreamingIndicator variant="block" />
            ) : (
              <>
                <MarkdownRenderer content={message.content} />
                {isStreaming && <StreamingIndicator variant="inline" />}
              </>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
      </div>

      {/* Tool calls display */}
      {isAssistant && toolCalls && toolCalls.length > 0 && (
        <AiToolList
          toolCalls={toolCalls}
          isStreaming={isStreaming}
          className="w-full max-w-[85%]"
        />
      )}

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground">
        {formatTimestamp(message.createdAt)}
      </span>

      {/* Interactive options */}
      {parsedQuestion && onOptionSelect && (
        <InteractiveOptions
          question={parsedQuestion}
          onSelect={onOptionSelect}
          className="w-full max-w-[85%] mt-2 p-3 bg-secondary/50 rounded-lg border border-border"
        />
      )}
    </div>
  );
}

function formatTimestamp(date?: Date): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
