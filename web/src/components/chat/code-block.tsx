"use client";

import * as React from "react";
import { codeToHtml, type BundledLanguage, bundledLanguages } from "shiki";
import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

/**
 * Check if a language is supported by Shiki.
 */
function isSupportedLanguage(lang: string): lang is BundledLanguage {
  return lang in bundledLanguages;
}

/**
 * CodeBlock component with syntax highlighting powered by Shiki.
 * Uses async highlighting with a loading state.
 */
export function CodeBlock({ code, language = "", className }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function highlight() {
      try {
        // Normalize language name
        const lang = language.toLowerCase().trim();

        // Use the language if supported, otherwise fallback to plaintext
        const highlightLang = isSupportedLanguage(lang) ? lang : "plaintext";

        const html = await codeToHtml(code, {
          lang: highlightLang,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });

        if (mounted) {
          setHighlightedHtml(html);
          setIsLoading(false);
        }
      } catch {
        // If highlighting fails, we'll show the plain code
        if (mounted) {
          setHighlightedHtml(null);
          setIsLoading(false);
        }
      }
    }

    highlight();

    return () => {
      mounted = false;
    };
  }, [code, language]);

  // Show loading state or plain code while highlighting
  if (isLoading || highlightedHtml === null) {
    return (
      <pre
        className={cn(
          "bg-muted rounded-md p-3 my-2 overflow-x-auto text-sm",
          className
        )}
        data-testid="code-block"
        data-language={language}
      >
        <code className="block text-sm font-mono">{code}</code>
      </pre>
    );
  }

  // Render syntax highlighted code
  return (
    <div
      className={cn(
        "shiki-code-block rounded-md my-2 overflow-x-auto text-sm [&>pre]:p-3 [&>pre]:m-0 [&>pre]:overflow-x-auto",
        className
      )}
      data-testid="code-block"
      data-language={language}
      data-highlighted="true"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
