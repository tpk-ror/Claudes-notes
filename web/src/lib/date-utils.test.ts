import { describe, it, expect } from "vitest";
import {
  startOfDay,
  getDaysDifference,
  getDateGroup,
  getDateGroupLabel,
  getDateGroupInfo,
  DATE_GROUP_ORDER,
  compareDateGroups,
  formatSessionDate,
  type DateGroup,
} from "./date-utils";

describe("date-utils", () => {
  describe("startOfDay", () => {
    it("returns midnight of the given date", () => {
      const date = new Date("2026-01-15T14:30:45.000Z");
      const result = startOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("preserves the date part", () => {
      const date = new Date("2026-01-15T14:30:45.000Z");
      const result = startOfDay(date);

      expect(result.getFullYear()).toBe(date.getFullYear());
      expect(result.getMonth()).toBe(date.getMonth());
      expect(result.getDate()).toBe(date.getDate());
    });

    it("does not mutate the original date", () => {
      const date = new Date("2026-01-15T14:30:45.000Z");
      const originalTime = date.getTime();
      startOfDay(date);

      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe("getDaysDifference", () => {
    it("returns 0 for the same day", () => {
      const date1 = new Date("2026-01-15T10:00:00.000Z");
      const date2 = new Date("2026-01-15T22:00:00.000Z");

      expect(getDaysDifference(date1, date2)).toBe(0);
    });

    it("returns 1 for consecutive days", () => {
      const yesterday = new Date("2026-01-14T10:00:00.000Z");
      const today = new Date("2026-01-15T10:00:00.000Z");

      expect(getDaysDifference(yesterday, today)).toBe(1);
    });

    it("returns 7 for a week difference", () => {
      const weekAgo = new Date("2026-01-08T10:00:00.000Z");
      const today = new Date("2026-01-15T10:00:00.000Z");

      expect(getDaysDifference(weekAgo, today)).toBe(7);
    });

    it("returns negative for future dates compared to past", () => {
      const today = new Date("2026-01-15T10:00:00.000Z");
      const yesterday = new Date("2026-01-14T10:00:00.000Z");

      expect(getDaysDifference(today, yesterday)).toBe(-1);
    });

    it("handles year boundaries", () => {
      const lastYear = new Date("2025-12-31T10:00:00.000Z");
      const thisYear = new Date("2026-01-01T10:00:00.000Z");

      expect(getDaysDifference(lastYear, thisYear)).toBe(1);
    });
  });

  describe("getDateGroup", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");

    it("returns 'today' for same day", () => {
      const date = new Date("2026-01-15T08:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("today");
    });

    it("returns 'yesterday' for previous day", () => {
      const date = new Date("2026-01-14T20:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("yesterday");
    });

    it("returns 'previous7days' for 2 days ago", () => {
      const date = new Date("2026-01-13T12:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("previous7days");
    });

    it("returns 'previous7days' for 7 days ago", () => {
      const date = new Date("2026-01-08T12:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("previous7days");
    });

    it("returns 'previous30days' for 8 days ago", () => {
      const date = new Date("2026-01-07T12:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("previous30days");
    });

    it("returns 'previous30days' for 30 days ago", () => {
      const date = new Date("2025-12-16T12:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("previous30days");
    });

    it("returns 'older' for more than 30 days ago", () => {
      const date = new Date("2025-12-15T12:00:00.000Z");
      expect(getDateGroup(date, now)).toBe("older");
    });

    it("uses current date when now is not provided", () => {
      const today = new Date();
      // Same day should be today
      expect(getDateGroup(today)).toBe("today");
    });
  });

  describe("getDateGroupLabel", () => {
    it("returns 'Today' for today group", () => {
      expect(getDateGroupLabel("today")).toBe("Today");
    });

    it("returns 'Yesterday' for yesterday group", () => {
      expect(getDateGroupLabel("yesterday")).toBe("Yesterday");
    });

    it("returns 'Previous 7 Days' for previous7days group", () => {
      expect(getDateGroupLabel("previous7days")).toBe("Previous 7 Days");
    });

    it("returns 'Previous 30 Days' for previous30days group", () => {
      expect(getDateGroupLabel("previous30days")).toBe("Previous 30 Days");
    });

    it("returns 'Older' for older group", () => {
      expect(getDateGroupLabel("older")).toBe("Older");
    });
  });

  describe("getDateGroupInfo", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");

    it("returns key and label for today", () => {
      const date = new Date("2026-01-15T08:00:00.000Z");
      const info = getDateGroupInfo(date, now);

      expect(info.key).toBe("today");
      expect(info.label).toBe("Today");
    });

    it("returns key and label for yesterday", () => {
      const date = new Date("2026-01-14T08:00:00.000Z");
      const info = getDateGroupInfo(date, now);

      expect(info.key).toBe("yesterday");
      expect(info.label).toBe("Yesterday");
    });

    it("returns key and label for previous7days", () => {
      const date = new Date("2026-01-10T08:00:00.000Z");
      const info = getDateGroupInfo(date, now);

      expect(info.key).toBe("previous7days");
      expect(info.label).toBe("Previous 7 Days");
    });
  });

  describe("DATE_GROUP_ORDER", () => {
    it("has all date groups in order", () => {
      expect(DATE_GROUP_ORDER).toEqual([
        "today",
        "yesterday",
        "previous7days",
        "previous30days",
        "older",
      ]);
    });

    it("has today first", () => {
      expect(DATE_GROUP_ORDER[0]).toBe("today");
    });

    it("has older last", () => {
      expect(DATE_GROUP_ORDER[DATE_GROUP_ORDER.length - 1]).toBe("older");
    });
  });

  describe("compareDateGroups", () => {
    it("returns negative when first group is more recent", () => {
      expect(compareDateGroups("today", "yesterday")).toBeLessThan(0);
    });

    it("returns positive when first group is older", () => {
      expect(compareDateGroups("older", "today")).toBeGreaterThan(0);
    });

    it("returns 0 for the same group", () => {
      expect(compareDateGroups("today", "today")).toBe(0);
    });

    it("correctly orders all groups", () => {
      const groups: DateGroup[] = ["older", "today", "previous30days", "yesterday", "previous7days"];
      const sorted = groups.sort(compareDateGroups);

      expect(sorted).toEqual([
        "today",
        "yesterday",
        "previous7days",
        "previous30days",
        "older",
      ]);
    });
  });

  describe("formatSessionDate", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");

    it("returns time format for today", () => {
      const date = new Date("2026-01-15T14:30:00.000Z");
      const result = formatSessionDate(date, now);

      // Should contain time components (may vary by locale)
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("returns time format for yesterday", () => {
      const date = new Date("2026-01-14T09:15:00.000Z");
      const result = formatSessionDate(date, now);

      // Should contain time components
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("returns date format for older dates", () => {
      const date = new Date("2026-01-10T14:30:00.000Z");
      const result = formatSessionDate(date, now);

      // Should contain month and day (format depends on locale)
      // Jan 10 or 10 Jan or similar
      expect(result).toMatch(/\d{1,2}|Jan/i);
    });

    it("returns date format for previous30days", () => {
      const date = new Date("2025-12-25T14:30:00.000Z");
      const result = formatSessionDate(date, now);

      // Should contain month and day
      expect(result).toMatch(/\d{1,2}|Dec/i);
    });

    it("returns date format for much older dates", () => {
      const date = new Date("2025-06-15T14:30:00.000Z");
      const result = formatSessionDate(date, now);

      // Should contain month and day
      expect(result).toMatch(/\d{1,2}|Jun/i);
    });
  });
});
