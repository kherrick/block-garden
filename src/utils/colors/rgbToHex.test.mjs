import { rgbToHex } from "./rgbToHex.mjs";

describe("rgbToHex", () => {
  test("should convert RGB to hex", () => {
    expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
  });

  test("should convert white to hex", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
  });

  test("should convert black to hex", () => {
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
  });

  test("should convert green to hex", () => {
    expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
  });

  test("should convert blue to hex", () => {
    expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
  });

  test("should handle mid-range values", () => {
    expect(rgbToHex(128, 128, 128)).toBe("#808080");
  });

  test("should handle zero values", () => {
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
  });

  test("should handle maximum values", () => {
    expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
  });

  test("should handle mixed values", () => {
    expect(rgbToHex(100, 150, 200)).toBe("#6496c8");
  });

  test("should handle single digit hex values", () => {
    expect(rgbToHex(15, 15, 15)).toBe("#0f0f0f");
  });
});
