import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PlanStatusBadge,
  isDraftPlan,
  canApprovePlan,
  canRejectPlan,
  canEditPlan,
} from "./plan-status-badge";
import type { PlanStatus } from "@/store/types";

describe("PlanStatusBadge", () => {
  describe("basic rendering", () => {
    it("renders with data-testid", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<PlanStatusBadge status="draft" className="custom-class" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass(
        "custom-class"
      );
    });

    it("renders with data-status attribute", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "data-status",
        "draft"
      );
    });

    it("renders with aria-label for accessibility", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "aria-label",
        "Plan status: Draft"
      );
    });
  });

  describe("draft status", () => {
    it("displays Draft label", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("displays pencil icon", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByText("✎")).toBeInTheDocument();
    });

    it("has yellow styling classes", () => {
      render(<PlanStatusBadge status="draft" />);
      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveClass("bg-yellow-100");
      expect(badge).toHaveClass("text-yellow-800");
      expect(badge).toHaveClass("border-yellow-300");
    });

    it("sets data-status to draft", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "data-status",
        "draft"
      );
    });
  });

  describe("approved status", () => {
    it("displays Approved label", () => {
      render(<PlanStatusBadge status="approved" />);
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    it("displays checkmark icon", () => {
      render(<PlanStatusBadge status="approved" />);
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("has green styling classes", () => {
      render(<PlanStatusBadge status="approved" />);
      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
      expect(badge).toHaveClass("border-green-300");
    });

    it("sets data-status to approved", () => {
      render(<PlanStatusBadge status="approved" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "data-status",
        "approved"
      );
    });
  });

  describe("executed status", () => {
    it("displays Executed label", () => {
      render(<PlanStatusBadge status="executed" />);
      expect(screen.getByText("Executed")).toBeInTheDocument();
    });

    it("displays bullet icon", () => {
      render(<PlanStatusBadge status="executed" />);
      expect(screen.getByText("●")).toBeInTheDocument();
    });

    it("has blue styling classes", () => {
      render(<PlanStatusBadge status="executed" />);
      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
      expect(badge).toHaveClass("border-blue-300");
    });

    it("sets data-status to executed", () => {
      render(<PlanStatusBadge status="executed" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "data-status",
        "executed"
      );
    });
  });

  describe("archived status", () => {
    it("displays Archived label", () => {
      render(<PlanStatusBadge status="archived" />);
      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("displays box icon", () => {
      render(<PlanStatusBadge status="archived" />);
      expect(screen.getByText("▫")).toBeInTheDocument();
    });

    it("has gray styling classes", () => {
      render(<PlanStatusBadge status="archived" />);
      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
      expect(badge).toHaveClass("border-gray-300");
    });

    it("sets data-status to archived", () => {
      render(<PlanStatusBadge status="archived" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "data-status",
        "archived"
      );
    });
  });

  describe("styling", () => {
    it("has inline-flex layout", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("inline-flex");
    });

    it("has items-center for vertical alignment", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("items-center");
    });

    it("has gap-1 between icon and text", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("gap-1");
    });

    it("has rounded-full for pill shape", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("rounded-full");
    });

    it("has text-xs for small text", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("text-xs");
    });

    it("has font-medium for semi-bold text", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("font-medium");
    });

    it("has border class", () => {
      render(<PlanStatusBadge status="draft" />);
      expect(screen.getByTestId("plan-status-badge")).toHaveClass("border");
    });

    it("has padding classes", () => {
      render(<PlanStatusBadge status="draft" />);
      const badge = screen.getByTestId("plan-status-badge");
      expect(badge).toHaveClass("px-2");
      expect(badge).toHaveClass("py-0.5");
    });
  });

  describe("accessibility", () => {
    it("has aria-hidden on icon", () => {
      render(<PlanStatusBadge status="draft" />);
      const icon = screen.getByText("✎");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it.each([
      ["draft", "Draft"],
      ["approved", "Approved"],
      ["executed", "Executed"],
      ["archived", "Archived"],
    ] as const)("has correct aria-label for %s status", (status, label) => {
      render(<PlanStatusBadge status={status} />);
      expect(screen.getByTestId("plan-status-badge")).toHaveAttribute(
        "aria-label",
        `Plan status: ${label}`
      );
    });
  });
});

describe("isDraftPlan", () => {
  it("returns true for draft status", () => {
    expect(isDraftPlan("draft")).toBe(true);
  });

  it("returns false for approved status", () => {
    expect(isDraftPlan("approved")).toBe(false);
  });

  it("returns false for executed status", () => {
    expect(isDraftPlan("executed")).toBe(false);
  });

  it("returns false for archived status", () => {
    expect(isDraftPlan("archived")).toBe(false);
  });
});

describe("canApprovePlan", () => {
  it("returns true for draft status", () => {
    expect(canApprovePlan("draft")).toBe(true);
  });

  it("returns false for approved status", () => {
    expect(canApprovePlan("approved")).toBe(false);
  });

  it("returns false for executed status", () => {
    expect(canApprovePlan("executed")).toBe(false);
  });

  it("returns false for archived status", () => {
    expect(canApprovePlan("archived")).toBe(false);
  });
});

describe("canRejectPlan", () => {
  it("returns true for draft status", () => {
    expect(canRejectPlan("draft")).toBe(true);
  });

  it("returns false for approved status", () => {
    expect(canRejectPlan("approved")).toBe(false);
  });

  it("returns false for executed status", () => {
    expect(canRejectPlan("executed")).toBe(false);
  });

  it("returns false for archived status", () => {
    expect(canRejectPlan("archived")).toBe(false);
  });
});

describe("canEditPlan", () => {
  it("returns true for draft status", () => {
    expect(canEditPlan("draft")).toBe(true);
  });

  it("returns false for approved status", () => {
    expect(canEditPlan("approved")).toBe(false);
  });

  it("returns false for executed status", () => {
    expect(canEditPlan("executed")).toBe(false);
  });

  it("returns false for archived status", () => {
    expect(canEditPlan("archived")).toBe(false);
  });
});
