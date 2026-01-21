"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion, ParsedOption } from "@/types/plan-files";

export interface InteractiveOptionsProps {
  /** The parsed question with options */
  question: ParsedQuestion;
  /** Called when user selects an option */
  onSelect: (value: string) => void;
  /** Whether the options are disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * InteractiveOptions component displays clickable option buttons
 * for questions detected in agent output.
 *
 * Features:
 * - Clickable chips/buttons for each option
 * - "Other" option with text input for custom responses
 * - Keyboard navigation (arrows + enter)
 * - Visual selection feedback
 */
export function InteractiveOptions({
  question,
  onSelect,
  disabled = false,
  className,
}: InteractiveOptionsProps) {
  const [showOtherInput, setShowOtherInput] = React.useState(false);
  const [otherValue, setOtherValue] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Total options including "Other" if allowed
  const totalOptions = question.allowOther
    ? question.options.length + 1
    : question.options.length;

  const handleOptionClick = React.useCallback(
    (option: ParsedOption) => {
      if (disabled) return;
      onSelect(option.value);
    },
    [disabled, onSelect]
  );

  const handleOtherClick = React.useCallback(() => {
    if (disabled) return;
    setShowOtherInput(true);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const handleOtherSubmit = React.useCallback(() => {
    if (disabled || !otherValue.trim()) return;
    onSelect(otherValue.trim());
    setShowOtherInput(false);
    setOtherValue("");
  }, [disabled, otherValue, onSelect]);

  const handleOtherKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleOtherSubmit();
      } else if (e.key === "Escape") {
        setShowOtherInput(false);
        setOtherValue("");
      }
    },
    [handleOtherSubmit]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || showOtherInput) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalOptions);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0) {
            if (focusedIndex < question.options.length) {
              handleOptionClick(question.options[focusedIndex]);
            } else if (question.allowOther) {
              handleOtherClick();
            }
          }
          break;
      }
    },
    [
      disabled,
      showOtherInput,
      focusedIndex,
      totalOptions,
      question.options,
      question.allowOther,
      handleOptionClick,
      handleOtherClick,
    ]
  );

  // Focus management for keyboard navigation
  React.useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const buttons = containerRef.current.querySelectorAll("button");
      buttons[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-3", className)}
      onKeyDown={handleKeyDown}
      data-testid="interactive-options"
    >
      {/* Question label for context */}
      <p className="text-sm text-muted-foreground font-medium">
        Select an option:
      </p>

      {/* Option buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Options">
        {question.options.map((option, index) => (
          <Button
            key={option.id}
            variant={focusedIndex === index ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleOptionClick(option)}
            disabled={disabled}
            className={cn(
              "transition-all hover:scale-105",
              focusedIndex === index && "ring-2 ring-ring ring-offset-1"
            )}
            data-testid={`option-${option.id}`}
            tabIndex={focusedIndex === index ? 0 : -1}
          >
            <span className="text-muted-foreground mr-1 font-mono text-xs">
              {option.index}.
            </span>
            {option.label}
          </Button>
        ))}

        {/* "Other" option */}
        {question.allowOther && !showOtherInput && (
          <Button
            variant={
              focusedIndex === question.options.length ? "secondary" : "ghost"
            }
            size="sm"
            onClick={handleOtherClick}
            disabled={disabled}
            className={cn(
              "border border-dashed border-muted-foreground/30",
              focusedIndex === question.options.length &&
                "ring-2 ring-ring ring-offset-1"
            )}
            data-testid="option-other"
            tabIndex={focusedIndex === question.options.length ? 0 : -1}
          >
            Other...
          </Button>
        )}
      </div>

      {/* "Other" text input */}
      {showOtherInput && (
        <div className="flex gap-2 items-center" data-testid="other-input-group">
          <input
            ref={inputRef}
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={handleOtherKeyDown}
            placeholder="Type your answer..."
            className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={disabled}
            data-testid="other-input"
          />
          <Button
            size="sm"
            onClick={handleOtherSubmit}
            disabled={disabled || !otherValue.trim()}
            data-testid="other-submit"
          >
            Submit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowOtherInput(false);
              setOtherValue("");
            }}
            disabled={disabled}
            data-testid="other-cancel"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground/60">
        Use arrow keys to navigate, Enter to select
      </p>
    </div>
  );
}
