/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import { getBlock } from "./world.mjs";

describe("getBlock", () => {
  test("returns true for ground (y <= 0)", () => {
    const world = { hasBlock: jest.fn() };

    expect(getBlock(world, 0, 0, 0)).toBe(true);
    expect(getBlock(world, 10, -5, 10)).toBe(true);
  });

  test("calls world.hasBlock for y > 0 and returns its result", () => {
    const world = {
      hasBlock: jest.fn((x, y, z) => x === 1 && y === 2 && z === 3),
    };

    expect(getBlock(world, 1, 2, 3)).toBe(true);
    expect(world.hasBlock).toHaveBeenCalledWith(1, 2, 3);
    expect(getBlock(world, 4.7, 5.2, 6.9)).toBe(false);
    expect(world.hasBlock).toHaveBeenCalledWith(4, 5, 6);
  });
});
