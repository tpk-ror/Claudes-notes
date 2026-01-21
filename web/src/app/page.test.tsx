import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Claude's Notes"
    );
  });

  it("renders the New Session button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "New Session" })).toBeInTheDocument();
  });

  it("renders the Sessions sidebar", () => {
    render(<Home />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });

  it("applies Tailwind classes to container", () => {
    const { container } = render(<Home />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("flex");
    expect(mainDiv).toHaveClass("h-screen");
    expect(mainDiv).toHaveClass("bg-background");
  });
});
