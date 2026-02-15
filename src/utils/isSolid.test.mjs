/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

jest.unstable_mockModule("../core/world/config/blocks.mjs", () => ({
  blockNames: {
    AIR: "Air",
    DIRT: "Dirt",
    WATER: "Water",
    STONE: "Stone",
    CLOUD: "Cloud",
  },
  blocks: [],
  getBlockById: jest.fn().mockImplementation((id) => {
    const blocks = {
      0: { name: "Air", solid: false },
      1: { name: "Dirt", solid: true },
      2: { name: "Water", solid: false },
      3: { name: "Stone", solid: true },
      72: { name: "Cloud", solid: false },
    };

    return blocks[id];
  }),
}));

describe("isSolid", () => {
  let isSolid;

  beforeEach(async () => {
    const module = await import("./isSolid.mjs");

    isSolid = module.isSolid;
  });

  test("should return true for out of bounds (above world)", () => {
    const mockWorld = {
      getBlock: jest.fn(),
    };

    const result = isSolid(mockWorld, 10, 256, 20);

    expect(result).toBe(true);
    expect(mockWorld.getBlock).not.toHaveBeenCalled();
  });

  test("should return true for bottom boundary", () => {
    const mockWorld = {
      getBlock: jest.fn(),
    };

    const result = isSolid(mockWorld, 10, 0, 20);

    expect(result).toBe(true);
    expect(mockWorld.getBlock).not.toHaveBeenCalled();
  });

  test("should return false for air block", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(0),
    };

    const result = isSolid(mockWorld, 10, 10, 20);

    expect(result).toBe(false);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(10, 10, 20);
  });

  test("should return true for solid block", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(1),
    };

    const result = isSolid(mockWorld, 10, 10, 20);

    expect(result).toBe(true);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(10, 10, 20);
  });

  test("should return false for non-solid block", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(2),
    };

    const result = isSolid(mockWorld, 10, 10, 20);

    expect(result).toBe(false);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(10, 10, 20);
  });

  test("should return false for unknown block type", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(999),
    };

    const result = isSolid(mockWorld, 10, 10, 20);

    expect(result).toBe(false);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(10, 10, 20);
  });

  test("should handle boundary conditions", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(0),
    };

    // Just below max height
    expect(isSolid(mockWorld, 10, 255, 20)).toBe(false);
    // Just above min height
    expect(isSolid(mockWorld, 10, 1, 20)).toBe(false);
  });

  test("should handle negative coordinates", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(1),
    };

    const result = isSolid(mockWorld, -10, 10, -20);

    expect(result).toBe(true);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(-10, 10, -20);
  });

  test("should handle large coordinates", () => {
    const mockWorld = {
      getBlock: jest.fn().mockReturnValue(3),
    };

    const result = isSolid(mockWorld, 1000, 100, 2000);

    expect(result).toBe(true);
    expect(mockWorld.getBlock).toHaveBeenCalledWith(1000, 100, 2000);
  });
});
