"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, Square, Loader2 } from "lucide-react";
import type { ChatStatus } from "@/hooks/use-cli-chat";

export interface AiChatInputProps {
  /** Callback when a message is submitted */
  onSubmit: (message: string) => void;
  /** Callback to stop the current stream */
  onStop?: () => void;
  /** Current chat status */
  status?: ChatStatus;
  /** Custom placeholder text */
  placeholder?: string;
  /** Custom class name */
  className?: string;
  /** Maximum number of rows */
  maxRows?: number;
  /** Minimum number of rows */
  minRows?: number;
}

/**
 * Chat input component following AI SDK patterns.
 * Provides a multi-line textarea with submit/stop controls.
 */
export function AiChatInput({
  onSubmit,
  onStop,
  status = "ready",
  placeholder = "Type a message...",
  className,
  maxRows = 10,
  minRows = 1,
}: AiChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isDisabled = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";
  const isSubmitting = status === "submitted";

  // Adjust textarea height based on content
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight, 10) || 24;
    const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;

    const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [maxRows, minRows]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = React.useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || isDisabled) return;

    onSubmit(trimmedValue);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isDisabled, onSubmit]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const handleFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn("flex gap-2 items-end", className)}
      data-testid="ai-chat-input-form"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={placeholder}
        rows={minRows}
        className={cn(
          "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2",
          "text-sm placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "overflow-y-auto"
        )}
        data-testid="ai-chat-input-textarea"
        aria-label="Message input"
      />

      {/* Stop button during streaming */}
      {(isStreaming || isSubmitting) && onStop && (
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onStop}
          data-testid="ai-chat-stop-button"
          aria-label="Stop generating"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isDisabled || !value.trim()}
        size="default"
        data-testid="ai-chat-submit-button"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
