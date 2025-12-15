import { describe, it, expect, jest } from "@jest/globals";
import { getSelectedSeed } from "./getSelectedSeed.mjs";

describe("getSelectedSeed", () => {
  it("should return the trimmed text content of the selected seed element", () => {
    const mockElement = { textContent: "  Carrot Seed  " };
    const mockShadowRoot = {
      querySelector: jest.fn().mockReturnValue(mockElement),
    };

    const seedName = getSelectedSeed(mockShadowRoot);

    expect(mockShadowRoot.querySelector).toHaveBeenCalledWith("#selectedSeed");
    expect(seedName).toBe("Carrot Seed");
  });

  it("should return an empty string if the element has no text content", () => {
    const mockElement = { textContent: null };
    const mockShadowRoot = {
      querySelector: jest.fn().mockReturnValue(mockElement),
    };

    const seedName = getSelectedSeed(mockShadowRoot);
    expect(seedName).toBe("");
  });

  it("should return an empty string if the element is not found", () => {
    const mockShadowRoot = {
      querySelector: jest.fn().mockReturnValue(null),
    };

    const seedName = getSelectedSeed(mockShadowRoot);
    expect(seedName).toBe("");
  });

  it("should return an empty string if shadowRoot is null or undefined", () => {
    expect(getSelectedSeed(null)).toBe("");
    expect(getSelectedSeed(undefined)).toBe("");
  });

  it("should return an empty string if querySelector throws an error", () => {
    const mockShadowRoot = {
      querySelector: jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      }),
    };
    expect(getSelectedSeed(mockShadowRoot)).toBe("");
  });
});
