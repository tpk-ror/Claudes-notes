import { describe, it, expect } from "vitest";
import { metadata, viewport } from "./layout";
import { MIN_SUPPORTED_WIDTH } from "../components/layout";

describe("Root layout", () => {
  it("has correct metadata title", () => {
    expect(metadata.title).toBe("Claude's Notes");
  });

  it("has correct metadata description", () => {
    expect(metadata.description).toBe(
      "Visual interface for Claude Code planning capabilities"
    );
  });
});

describe("Viewport configuration", () => {
  it("has viewport width set to MIN_SUPPORTED_WIDTH", () => {
    expect(viewport.width).toBe(MIN_SUPPORTED_WIDTH);
  });

  it("has viewport width set to 1024", () => {
    expect(viewport.width).toBe(1024);
  });

  it("has initialScale set to 1", () => {
    expect(viewport.initialScale).toBe(1);
  });
});
