/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

import { processSaveData } from "./saveData.mjs";

describe("saveData", () => {
  test("should process .txt file", async () => {
    const mockData = {
      text: jest.fn().mockResolvedValue('{"key":"value"}'),
    };

    const result = await processSaveData(mockData, "test.txt", globalThis);

    expect(result).toBe('{"key":"value"}');
    expect(mockData.text).toHaveBeenCalled();
  });

  test("should process unknown file extension", async () => {
    const mockData = {
      text: jest.fn().mockResolvedValue('{"unknown":"format"}'),
    };

    const result = await processSaveData(mockData, "test.unknown", globalThis);

    expect(result).toBe('{"unknown":"format"}');
  });

  test("should throw error for invalid JSON", async () => {
    const mockData = {
      text: jest.fn().mockResolvedValue("not valid json"),
    };

    await expect(
      processSaveData(mockData, "test.txt", globalThis),
    ).rejects.toThrow("Invalid game state: not valid JSON.");
  });

  test("should handle whitespace in .txt files", async () => {
    const mockData = {
      text: jest.fn().mockResolvedValue('  {\n  "key":  "value"  }  '),
    };

    const result = await processSaveData(mockData, "test.txt", globalThis);

    expect(result).toBe('{"key":"value"}');
  });
});
