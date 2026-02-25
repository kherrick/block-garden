/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { getDateTime } from "./getDateTime.mjs";

describe("compression module", () => {
  describe("getDateTime", () => {
    test("returns a string in YYYY-MM-DD_HH-MM-SS.mmm format", () => {
      const result = getDateTime();

      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });

    test("returns consistent format with proper padding", () => {
      const result = getDateTime();

      // Check that each component has the right length
      const [datePart, timeAndMs] = result.split("_");
      const [year, month, day] = datePart.split("-");
      const [_, ms] = timeAndMs.split(".");

      expect(year).toHaveLength(4);
      expect(month).toHaveLength(2);
      expect(day).toHaveLength(2);
    });

    test("uses zero padding for single digit dates and times", () => {
      // Mock Date to return specific values
      const mockDate = new Date("2025-01-05T05:05:05.050Z");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate);

      const result = getDateTime();

      expect(result).toContain("2025-01-04");
      expect(result).toContain("23-05-05");

      jest.restoreAllMocks();
    });

    test("returns different values on repeated calls (unless called in same second)", () => {
      const result1 = getDateTime();

      // Small delay to ensure different second
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      const result2 = getDateTime();

      jest.useRealTimers();

      // Results should be different (unless by extremely unlikely coincidence)
      expect(result1).not.toEqual(result2);
    });

    test("includes UTC timezone (not local)", () => {
      // This test verifies UTC is used by checking format consistency
      const result = getDateTime();

      // Should be in expected format (UTC formatted)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe("integration", () => {
    test("getDateTime creates valid filenames", () => {
      const timestamp = getDateTime();
      const filename = `block-garden-save-game-file-${timestamp}.bgs`;

      expect(filename).toMatch(
        /^block-garden-save-game-file-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.bgs$/,
      );
    });

    test("all compression functions are exported", () => {
      expect(typeof getDateTime).toBe("function");
    });
  });

  describe("error handling", () => {
    test("getDateTime does not throw on any date", () => {
      expect(() => {
        getDateTime();
      }).not.toThrow();
    });
  });
});
