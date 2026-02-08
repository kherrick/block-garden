/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock the state module before importing collectDrop
jest.unstable_mockModule("../core/systems/game/state.mjs", () => ({
  addMaterial: jest.fn(),
  addSeed: jest.fn(),
  toInventoryKey: jest.fn((name) => name.toUpperCase().replace(/ /g, "_")),
}));

// Mock blocks
jest.unstable_mockModule("../core/world/config/blocks.mjs", () => ({
  blocks: {
    getById: jest.fn(),
    getByName: jest.fn(),
  },
}));

describe("collectDrop", () => {
  let collectDrop;
  let addMaterial;
  let addSeed;
  let toInventoryKey;
  let blocks;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Import the mocked modules
    const stateMock = await import("../core/systems/game/state.mjs");
    addMaterial = stateMock.addMaterial;
    addSeed = stateMock.addSeed;
    toInventoryKey = stateMock.toInventoryKey;

    const blocksMock = await import("../core/world/config/blocks.mjs");
    blocks = blocksMock.blocks;

    // Import the module under test
    const module = await import("./collectDrop.mjs");
    collectDrop = module.collectDrop;
  });

  test("returns empty arrays for block with no drops", () => {
    blocks.getById.mockReturnValue({ name: "Air", drops: null });

    const result = collectDrop(0);

    expect(result).toEqual({ materials: [], seeds: [] });
    expect(addMaterial).not.toHaveBeenCalled();
    expect(addSeed).not.toHaveBeenCalled();
  });

  test("returns empty arrays for undefined block", () => {
    blocks.getById.mockReturnValue(undefined);

    const result = collectDrop(999);

    expect(result).toEqual({ materials: [], seeds: [] });
    expect(addMaterial).not.toHaveBeenCalled();
    expect(addSeed).not.toHaveBeenCalled();
  });

  test("collects single material drop", () => {
    blocks.getById.mockReturnValue({ name: "Dirt", drops: "Dirt" });
    blocks.getByName.mockReturnValue({ name: "Dirt", isSeed: false });

    const result = collectDrop(1);

    expect(addMaterial).toHaveBeenCalledWith("DIRT", 1);
    expect(addSeed).not.toHaveBeenCalled();
    expect(result.materials).toContain("Dirt");
    expect(result.seeds).toHaveLength(0);
  });

  test("collects multiple drops from one block", () => {
    blocks.getById.mockReturnValue({
      name: "Birch",
      drops: ["Birch", "Wood"],
    });
    blocks.getByName.mockImplementation((name) => {
      if (name === "Birch") return { name: "Birch", isSeed: true };
      if (name === "Wood") return { name: "Wood", isSeed: false };
      return null;
    });

    const result = collectDrop(114, { isRoot: true });

    expect(addSeed).toHaveBeenCalledWith("BIRCH", 2);
    expect(addMaterial).toHaveBeenCalledWith("WOOD", 1);
    expect(result.seeds).toContain("Birch");
    expect(result.materials).toContain("Wood");
  });

  test("handles seed drops correctly", () => {
    blocks.getById.mockReturnValue({ name: "Wheat", drops: "Wheat" });
    blocks.getByName.mockReturnValue({ name: "Wheat", isSeed: true });

    const result = collectDrop(10, { isRoot: true });

    expect(addSeed).toHaveBeenCalledWith("WHEAT", 2);
    expect(addMaterial).not.toHaveBeenCalled();
    expect(result.seeds).toContain("Wheat");
  });

  test("immature plant has 100% return rate only at root (misclick protection)", () => {
    blocks.getById.mockReturnValue({ name: "Wheat Growing", drops: "WHEAT" });
    blocks.getByName.mockReturnValue({ name: "Wheat", isSeed: true });

    // Root block
    const resultRoot = collectDrop(20, { isImmature: true, isRoot: true });
    expect(addSeed).toHaveBeenCalledWith("WHEAT", 1);
    expect(resultRoot.seeds).toContain("WHEAT");

    jest.clearAllMocks();

    // Non-root block
    const resultNonRoot = collectDrop(20, { isImmature: true, isRoot: false });
    expect(addSeed).not.toHaveBeenCalled();
    expect(resultNonRoot.seeds).toHaveLength(0);
  });

  test("immature plant does not drop other materials but drops Growing blocks", () => {
    blocks.getById.mockReturnValue({
      name: "Birch Growing",
      drops: ["Birch", "Birch Growing"],
    });
    blocks.getByName.mockImplementation((name) => {
      if (name === "Birch") return { name: "Birch", isSeed: true };
      if (name === "Birch Growing")
        return { name: "Birch Growing", isSeed: false };
      return null;
    });

    // Root block should drop Birch seed AND Birch Growing block
    const result = collectDrop(115, { isImmature: true, isRoot: true });

    expect(addSeed).toHaveBeenCalledWith("BIRCH", 1);
    expect(addMaterial).toHaveBeenCalledWith("BIRCH_GROWING", 1);
    expect(result.seeds).toContain("Birch");
    expect(result.materials).toContain("Birch Growing");
  });

  test("immature plant does not drop itself if it's not a Growing block", () => {
    blocks.getById.mockReturnValue({ name: "Stone", drops: "Stone" });
    blocks.getByName.mockReturnValue({ name: "Stone", isSeed: false });

    // Even if includeBlock is true, if it's "immature" (hypothetically), it shouldn't drop
    // unless it's a "Growing" block
    const result = collectDrop(3, { isImmature: true, includeBlock: true });

    expect(addMaterial).not.toHaveBeenCalled();
    expect(result.materials).toHaveLength(0);
  });

  test("handles unknown drop block gracefully", () => {
    blocks.getById.mockReturnValue({ name: "Custom", drops: "UNKNOWN" });
    blocks.getByName.mockReturnValue(null);

    const result = collectDrop(100);

    expect(addMaterial).not.toHaveBeenCalled();
    expect(addSeed).not.toHaveBeenCalled();
    expect(result).toEqual({ materials: [], seeds: [] });
  });
});
