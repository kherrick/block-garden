/**
 * @jest-environment node
 */
import { formatName } from "./formatWorldName.mjs";

describe("formatName", () => {
  test("should remove special characters", () => {
    expect(formatName("Test@World#Name$")).toBe("Testworldname");
  });

  test("should replace spaces with hyphens", () => {
    expect(formatName("Test World Name")).toBe("Test-World-Name");
  });

  test("should capitalize first letter of each word", () => {
    expect(formatName("test world name")).toBe("Test-World-Name");
  });

  test("should handle empty string", () => {
    expect(formatName("")).toBe("");
  });

  test("should handle string with only special characters", () => {
    expect(formatName("@#$%^&*")).toBe("");
  });

  test("should preserve alphanumeric characters", () => {
    expect(formatName("Test123World456")).toBe("Test123world456");
  });

  test("should handle null input", () => {
    expect(formatName(null)).toBe("");
  });

  test("should handle undefined input", () => {
    expect(formatName(undefined)).toBe("");
  });

  test("should handle string with multiple spaces", () => {
    expect(formatName("Test  World   Name")).toBe("Test-World-Name");
  });

  test("should handle string with leading and trailing spaces", () => {
    expect(formatName("  Test World Name  ")).toBe("Test-World-Name");
  });

  test("should handle already formatted name", () => {
    expect(formatName("Test-World-Name")).toBe("Test-world-name");
  });
});
