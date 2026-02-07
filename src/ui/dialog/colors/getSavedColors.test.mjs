/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock localForage
jest.unstable_mockModule("localforage", () => ({
  default: {
    getItem: jest.fn(),
  },
}));

const { getSavedColors } = await import("./getSavedColors.mjs");
const localForage = (await import("localforage")).default;

// Suppress console.log and console.error
const originalLog = console.log;
const originalError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

describe("getSavedColors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return saved colors when found", async () => {
    const mockColors = { air: "87ceeb", grass: "7cfc00" };
    localForage.getItem.mockResolvedValue(mockColors);

    const result = await getSavedColors("test-key");

    expect(result).toEqual(mockColors);
    expect(localForage.getItem).toHaveBeenCalledWith("test-key");
    expect(console.log).toHaveBeenCalledWith(
      "Loaded custom colors:",
      2,
      "properties",
    );
  });

  test("should return empty object when no saved colors", async () => {
    localForage.getItem.mockResolvedValue(null);

    const result = await getSavedColors("test-key");

    expect(result).toEqual({});
    expect(localForage.getItem).toHaveBeenCalledWith("test-key");
  });

  test("should return empty object when saved colors is not an object", async () => {
    localForage.getItem.mockResolvedValue("not an object");

    const result = await getSavedColors("test-key");

    expect(result).toEqual({});
  });

  test("should handle errors gracefully", async () => {
    localForage.getItem.mockRejectedValue(new Error("Storage error"));

    const result = await getSavedColors("test-key");

    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load saved colors:",
      expect.any(Error),
    );
  });

  test("should handle empty object", async () => {
    localForage.getItem.mockResolvedValue({});

    const result = await getSavedColors("test-key");

    expect(result).toEqual({});
    expect(console.log).toHaveBeenCalledWith(
      "Loaded custom colors:",
      0,
      "properties",
    );
  });
});
