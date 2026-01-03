/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock isSolid before importing getBlock
jest.unstable_mockModule("./isSolid.mjs", () => ({
  isSolid: jest.fn(() => false),
}));

const { getBlock } = await import("./world.mjs");
const { isSolid } = await import("./isSolid.mjs");

describe("getBlock", () => {
  beforeEach(() => {
    isSolid.mockReset();
    isSolid.mockReturnValue(false);
  });

  test("returns true for solid blocks", () => {
    const world = { getBlock: jest.fn(() => 1) }; // Block type 1 = solid

    isSolid.mockReturnValue(true);
    expect(getBlock(world, 0, 0, 0)).toBe(true);
  });

  test("returns false for non-solid blocks and air", () => {
    const world = { getBlock: jest.fn(() => 0) }; // Block type 0 = air

    isSolid.mockReturnValue(false);
    expect(getBlock(world, 10, 5, 10)).toBe(false);
  });

  test("calls isSolid with correct coordinates", () => {
    const world = { getBlock: jest.fn() };

    getBlock(world, 4.7, 5.2, 6.9);
    expect(isSolid).toHaveBeenCalledWith(world, 4.7, 5.2, 6.9);
  });
});
