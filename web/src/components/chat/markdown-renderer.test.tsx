import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MarkdownRenderer } from "./markdown-renderer";

// Mock shiki to avoid async loading issues in tests
vi.mock("shiki", () => ({
  codeToHtml: vi.fn().mockImplementation((code) =>
    Promise.resolve(`<pre class="shiki"><code>${code}</code></pre>`)
  ),
  bundledLanguages: {
    javascript: true,
    typescript: true,
    python: true,
  },
}));

describe("MarkdownRenderer component", () => {
  describe("basic rendering", () => {
    it("renders plain text content", () => {
      render(<MarkdownRenderer content="Hello, world!" />);

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
      expect(screen.getByText("Hello, world!")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<MarkdownRenderer content="Test" className="custom-class" />);

      const renderer = screen.getByTestId("markdown-renderer");
      expect(renderer).toHaveClass("custom-class");
      expect(renderer).toHaveClass("markdown-content");
    });

    it("handles empty content", () => {
      render(<MarkdownRenderer content="" />);

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });
  });

  describe("headers", () => {
    it("renders h1 headers", () => {
      render(<MarkdownRenderer content="# Heading 1" />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 1");
    });

    it("renders h2 headers", () => {
      render(<MarkdownRenderer content="## Heading 2" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 2");
    });

    it("renders h3 headers", () => {
      render(<MarkdownRenderer content="### Heading 3" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 3");
    });

    it("renders all heading levels", () => {
      const markdown = `
# H1
## H2
### H3
#### H4
##### H5
###### H6
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("H1");
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("H2");
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("H3");
      expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("H4");
      expect(screen.getByRole("heading", { level: 5 })).toHaveTextContent("H5");
      expect(screen.getByRole("heading", { level: 6 })).toHaveTextContent("H6");
    });
  });

  describe("paragraphs", () => {
    it("renders paragraphs correctly", () => {
      render(<MarkdownRenderer content="This is a paragraph." />);

      const paragraph = screen.getByText("This is a paragraph.");
      expect(paragraph.tagName.toLowerCase()).toBe("p");
    });

    it("renders multiple paragraphs", () => {
      const markdown = `
First paragraph.

Second paragraph.
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByText("First paragraph.")).toBeInTheDocument();
      expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    });
  });

  describe("lists", () => {
    it("renders unordered lists", () => {
      const markdown = `
- Item 1
- Item 2
- Item 3
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const list = screen.getByRole("list");
      expect(list.tagName.toLowerCase()).toBe("ul");
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("renders ordered lists", () => {
      const markdown = `
1. First
2. Second
3. Third
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const list = screen.getByRole("list");
      expect(list.tagName.toLowerCase()).toBe("ol");
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("renders nested lists", () => {
      const markdown = `
- Parent 1
  - Child 1.1
  - Child 1.2
- Parent 2
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByText("Parent 1")).toBeInTheDocument();
      expect(screen.getByText("Child 1.1")).toBeInTheDocument();
      expect(screen.getByText("Child 1.2")).toBeInTheDocument();
      expect(screen.getByText("Parent 2")).toBeInTheDocument();
    });
  });

  describe("links", () => {
    it("renders links correctly", () => {
      render(<MarkdownRenderer content="Visit [Google](https://google.com)" />);

      const link = screen.getByRole("link", { name: "Google" });
      expect(link).toHaveAttribute("href", "https://google.com");
    });

    it("opens links in new tab", () => {
      render(<MarkdownRenderer content="[Link](https://example.com)" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders multiple links", () => {
      const markdown = "Check [Site A](https://a.com) and [Site B](https://b.com)";
      render(<MarkdownRenderer content={markdown} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
    });
  });

  describe("emphasis", () => {
    it("renders bold text", () => {
      render(<MarkdownRenderer content="This is **bold** text" />);

      const bold = screen.getByText("bold");
      expect(bold.tagName.toLowerCase()).toBe("strong");
    });

    it("renders italic text", () => {
      render(<MarkdownRenderer content="This is *italic* text" />);

      const italic = screen.getByText("italic");
      expect(italic.tagName.toLowerCase()).toBe("em");
    });

    it("renders bold and italic combined", () => {
      render(<MarkdownRenderer content="This is ***bold and italic*** text" />);

      // The combined syntax wraps in both strong and em
      const strongElement = screen.getByText("bold and italic").closest("strong");
      expect(strongElement).toBeInTheDocument();
    });
  });

  describe("code", () => {
    it("renders inline code", () => {
      render(<MarkdownRenderer content="Use the `console.log()` function" />);

      const code = screen.getByText("console.log()");
      expect(code.tagName.toLowerCase()).toBe("code");
      expect(code).toHaveClass("bg-muted");
    });

    it("renders code blocks", () => {
      const markdown = `
\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      // Code blocks now use the CodeBlock component with data-testid
      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();
    });

    it("renders code blocks with language annotation", () => {
      const markdown = `
\`\`\`typescript
const greeting: string = "Hello";
\`\`\`
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      // CodeBlock component sets data-language on its wrapper
      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toHaveAttribute("data-language", "typescript");
    });

    it("renders code blocks without language", () => {
      const markdown = `
\`\`\`
plain code
\`\`\`
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const codeBlock = screen.getByTestId("code-block");
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveAttribute("data-language", "");
    });
  });

  describe("blockquotes", () => {
    it("renders blockquotes", () => {
      render(<MarkdownRenderer content="> This is a quote" />);

      const blockquote = screen.getByText("This is a quote").closest("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote).toHaveClass("border-l-4");
    });

    it("renders multi-line blockquotes", () => {
      const markdown = `
> Line 1
> Line 2
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote).toHaveTextContent("Line 1");
      expect(blockquote).toHaveTextContent("Line 2");
    });
  });

  describe("horizontal rules", () => {
    it("renders horizontal rules", () => {
      render(<MarkdownRenderer content={"Above\n\n---\n\nBelow"} />);

      const renderer = screen.getByTestId("markdown-renderer");
      const hr = renderer.querySelector("hr");
      expect(hr).toBeInTheDocument();
    });
  });

  describe("tables (GFM)", () => {
    it("renders tables", () => {
      const markdown = `
| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    it("renders table headers", () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(2);
      expect(headers[0]).toHaveTextContent("Header 1");
      expect(headers[1]).toHaveTextContent("Header 2");
    });

    it("renders table cells", () => {
      const markdown = `
| A | B |
|---|---|
| 1 | 2 |
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const cells = screen.getAllByRole("cell");
      expect(cells).toHaveLength(2);
    });
  });

  describe("task lists (GFM)", () => {
    it("renders task lists with checkboxes", () => {
      const markdown = `
- [x] Completed task
- [ ] Pending task
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it("renders checkboxes as disabled", () => {
      const markdown = "- [x] Task";
      render(<MarkdownRenderer content={markdown} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });
  });

  describe("strikethrough (GFM)", () => {
    it("renders strikethrough text", () => {
      render(<MarkdownRenderer content="This is ~~deleted~~ text" />);

      const deleted = screen.getByText("deleted");
      expect(deleted.tagName.toLowerCase()).toBe("del");
    });
  });

  describe("complex content", () => {
    it("renders mixed content correctly", () => {
      const markdown = `
# Title

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello");
}
\`\`\`

## List

- Item 1
- Item 2

> A quote
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Title");
      expect(screen.getByText("bold")).toBeInTheDocument();
      expect(screen.getByText("italic")).toBeInTheDocument();
      expect(screen.getByText(/function hello/)).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("A quote")).toBeInTheDocument();
    });

    it("handles real-world assistant response", () => {
      const markdown = `
I'll help you implement that feature. Here's the plan:

## Implementation Steps

1. **Create the component** - We'll start with a new React component
2. **Add the styling** - Using Tailwind CSS
3. **Write tests** - Ensure everything works

### Code

\`\`\`typescript
export function MyComponent() {
  return <div>Hello</div>;
}
\`\`\`

Let me know if you have any questions!
      `.trim();
      render(<MarkdownRenderer content={markdown} />);

      expect(screen.getByText("Implementation Steps")).toBeInTheDocument();
      expect(screen.getByText(/Create the component/)).toBeInTheDocument();
      expect(screen.getByText(/export function MyComponent/)).toBeInTheDocument();
      expect(screen.getByText(/Let me know if you have any questions!/)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles content with HTML entities", () => {
      render(<MarkdownRenderer content="Use &lt;div&gt; tags" />);

      expect(screen.getByTestId("markdown-renderer")).toHaveTextContent("Use <div> tags");
    });

    it("handles content with special characters", () => {
      render(<MarkdownRenderer content="Price: $100 & more" />);

      expect(screen.getByText(/Price: \$100 & more/)).toBeInTheDocument();
    });

    it("handles very long content", () => {
      const longContent = "A".repeat(10000);
      render(<MarkdownRenderer content={longContent} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("handles content with only whitespace", () => {
      render(<MarkdownRenderer content="   \n\n   " />);

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });
  });
});
