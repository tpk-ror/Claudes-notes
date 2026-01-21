import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CodeBlock } from "./code-block";

// Mock shiki to avoid async loading issues in tests
vi.mock("shiki", () => ({
  codeToHtml: vi.fn(),
  bundledLanguages: {
    javascript: true,
    typescript: true,
    python: true,
    rust: true,
    go: true,
    html: true,
    css: true,
    json: true,
    plaintext: true,
  },
}));

import { codeToHtml } from "shiki";

const mockCodeToHtml = vi.mocked(codeToHtml);

describe("CodeBlock component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("basic rendering", () => {
    it("renders with data-testid", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="const x = 1;" language="javascript" />);

      await waitFor(() => {
        expect(screen.getByTestId("code-block")).toBeInTheDocument();
      });
    });

    it("applies custom className", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(
        <CodeBlock code="const x = 1;" language="javascript" className="custom-class" />
      );

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveClass("custom-class");
      });
    });

    it("displays code content", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>const x = 1;</code></pre>");
      render(<CodeBlock code="const x = 1;" />);

      await waitFor(() => {
        expect(screen.getByText("const x = 1;")).toBeInTheDocument();
      });
    });

    it("sets data-language attribute", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId("code-block")).toHaveAttribute(
          "data-language",
          "typescript"
        );
      });
    });
  });

  describe("loading state", () => {
    it("shows plain code while loading", () => {
      // Create a promise that never resolves to simulate loading
      mockCodeToHtml.mockImplementation(
        () => new Promise(() => {})
      );

      render(<CodeBlock code="loading code" language="javascript" />);

      // Should show the code in a pre/code element during loading
      expect(screen.getByText("loading code")).toBeInTheDocument();
      const pre = screen.getByTestId("code-block");
      expect(pre.tagName.toLowerCase()).toBe("pre");
    });

    it("does not have data-highlighted during loading", () => {
      mockCodeToHtml.mockImplementation(
        () => new Promise(() => {})
      );

      render(<CodeBlock code="test" language="javascript" />);

      expect(screen.getByTestId("code-block")).not.toHaveAttribute(
        "data-highlighted"
      );
    });
  });

  describe("syntax highlighting", () => {
    it("calls codeToHtml with correct parameters", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>highlighted</code></pre>");

      render(<CodeBlock code="const x = 1;" language="javascript" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith("const x = 1;", {
          lang: "javascript",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });
      });
    });

    it("normalizes language to lowercase", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      render(<CodeBlock code="const x = 1;" language="JavaScript" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: "javascript" })
        );
      });
    });

    it("uses plaintext for unsupported languages", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      render(<CodeBlock code="test" language="unsupported-language" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: "plaintext" })
        );
      });
    });

    it("uses plaintext when no language specified", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      render(<CodeBlock code="test" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: "plaintext" })
        );
      });
    });

    it("renders highlighted HTML after loading", async () => {
      mockCodeToHtml.mockResolvedValue(
        '<pre class="shiki"><code><span style="color:#d73a49">const</span> x = 1;</code></pre>'
      );

      render(<CodeBlock code="const x = 1;" language="javascript" />);

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveAttribute("data-highlighted", "true");
      });
    });

    it("sets data-highlighted when highlighting completes", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      render(<CodeBlock code="test" language="javascript" />);

      await waitFor(() => {
        expect(screen.getByTestId("code-block")).toHaveAttribute(
          "data-highlighted",
          "true"
        );
      });
    });
  });

  describe("error handling", () => {
    it("shows plain code when highlighting fails", async () => {
      mockCodeToHtml.mockRejectedValue(new Error("Highlighting failed"));

      render(<CodeBlock code="error code" language="javascript" />);

      await waitFor(() => {
        expect(screen.getByText("error code")).toBeInTheDocument();
      });
    });

    it("does not crash when codeToHtml throws", async () => {
      mockCodeToHtml.mockRejectedValue(new Error("Shiki error"));

      expect(() => {
        render(<CodeBlock code="test" language="javascript" />);
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.getByTestId("code-block")).toBeInTheDocument();
      });
    });
  });

  describe("styling", () => {
    it("has rounded corners", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="test" />);

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveClass("rounded-md");
      });
    });

    it("has overflow handling", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="test" />);

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveClass("overflow-x-auto");
      });
    });

    it("has margin styling", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="test" />);

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveClass("my-2");
      });
    });

    it("has text-sm styling", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");
      render(<CodeBlock code="test" />);

      await waitFor(() => {
        const codeBlock = screen.getByTestId("code-block");
        expect(codeBlock).toHaveClass("text-sm");
      });
    });
  });

  describe("language support", () => {
    it.each([
      ["javascript", "javascript"],
      ["typescript", "typescript"],
      ["python", "python"],
      ["rust", "rust"],
      ["go", "go"],
      ["html", "html"],
      ["css", "css"],
      ["json", "json"],
    ])("supports %s language", async (input, expected) => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      render(<CodeBlock code="test" language={input} />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: expected })
        );
      });
    });
  });

  describe("multiline code", () => {
    it("handles multiline code", async () => {
      const code = `function hello() {
  console.log("Hello");
}`;
      mockCodeToHtml.mockResolvedValue(`<pre><code>${code}</code></pre>`);

      render(<CodeBlock code={code} language="javascript" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(code, expect.any(Object));
      });
    });

    it("preserves code content exactly", () => {
      const code = "line1\nline2\nline3";
      mockCodeToHtml.mockImplementation(() => new Promise(() => {}));

      render(<CodeBlock code={code} />);

      // Check that the code block contains the content
      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toHaveTextContent("line1");
      expect(codeBlock).toHaveTextContent("line2");
      expect(codeBlock).toHaveTextContent("line3");
    });
  });

  describe("cleanup", () => {
    it("does not update state after unmount", async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockCodeToHtml.mockReturnValue(promise as Promise<string>);

      const { unmount } = render(
        <CodeBlock code="test" language="javascript" />
      );

      // Unmount before the promise resolves
      unmount();

      // Resolve after unmount
      resolvePromise!("<pre><code>test</code></pre>");

      // No error should occur
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe("reactivity", () => {
    it("re-highlights when code changes", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>first</code></pre>");

      const { rerender } = render(
        <CodeBlock code="first" language="javascript" />
      );

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith("first", expect.any(Object));
      });

      mockCodeToHtml.mockResolvedValue("<pre><code>second</code></pre>");

      rerender(<CodeBlock code="second" language="javascript" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith("second", expect.any(Object));
      });
    });

    it("re-highlights when language changes", async () => {
      mockCodeToHtml.mockResolvedValue("<pre><code>test</code></pre>");

      const { rerender } = render(
        <CodeBlock code="test" language="javascript" />
      );

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: "javascript" })
        );
      });

      rerender(<CodeBlock code="test" language="typescript" />);

      await waitFor(() => {
        expect(mockCodeToHtml).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ lang: "typescript" })
        );
      });
    });
  });
});
