"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Custom components for ReactMarkdown rendering with Tailwind styles.
 */
const markdownComponents: Components = {
  // Headers
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-bold mt-3 mb-1 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-sm font-bold mt-2 mb-1 first:mt-0" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props}>
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="my-2 first:mt-0 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="ml-2" {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary underline hover:text-primary/80 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Code - inline only; block code is handled by pre
  code: ({ className, children, ...props }) => {
    // Inline code - no className or not a language class
    // Block code (with language-xxx class) will be handled by pre component
    if (!className || !className.startsWith("language-")) {
      return (
        <code
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Block code with language - let it pass through, pre will handle it
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  // Pre - handles code blocks with syntax highlighting
  pre: ({ children, node }) => {
    // Extract the raw code from the AST node
    // node.children[0] is the code element in the markdown AST
    const codeNode = node?.children?.[0];
    if (codeNode?.tagName === "code") {
      // Get language from className
      const className = codeNode.properties?.className as string[] | undefined;
      const languageClass = className?.find((c: string) =>
        c.startsWith("language-")
      );
      const language = languageClass?.replace("language-", "") || "";

      // Get code content from the text children
      const codeContent = codeNode.children
        ?.filter((c: { type: string }) => c.type === "text")
        .map((c: { value: string }) => c.value)
        .join("")
        .replace(/\n$/, "") || "";

      return <CodeBlock code={codeContent} language={language} />;
    }

    // Fallback for non-code pre blocks
    return (
      <pre className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-sm">
        {children}
      </pre>
    );
  },

  // Block quotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-muted-foreground/30 pl-4 my-2 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: (props) => <hr className="my-4 border-border" {...props} />,

  // Tables (GFM support)
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-3 py-2 text-left font-semibold border border-border" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 border border-border" {...props}>
      {children}
    </td>
  ),

  // Task list items (GFM support)
  input: ({ type, checked, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="mr-2 pointer-events-none"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};

/**
 * MarkdownRenderer component that renders markdown content with proper styling.
 * Supports GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)} data-testid="markdown-renderer">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
