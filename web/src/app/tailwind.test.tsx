import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("Tailwind CSS configuration", () => {
  it("applies Tailwind classes to the container", () => {
    const { container } = render(<Home />);
    // The main container should have flex and height classes
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("flex", "h-screen", "bg-background");
  });

  it("applies Tailwind classes to the heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-lg", "font-semibold");
  });

  it("renders the Claude's Notes title", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Claude's Notes");
  });
});
