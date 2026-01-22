/**
 * @jest-environment node
 */
import {
  blocks,
  getBlockById,
  getBlockIndexById,
  getBlockByIndex,
} from "./blocks.mjs";

describe("Block helper functions", () => {
  test("getBlockIndexById should return correct array index for a block ID", () => {
    // Test a few known blocks
    const dirtyIndex = getBlockIndexById(2); // Dirt has id: 2
    expect(dirtyIndex).toBeDefined();
    expect(typeof dirtyIndex).toBe("number");
    expect(blocks[dirtyIndex].id).toBe(2);
  });

  test("getBlockById should return correct block definition for a block ID", () => {
    const dirtBlock = getBlockById(2);
    expect(dirtBlock).toBeDefined();
    expect(dirtBlock.id).toBe(2);
    expect(dirtBlock.name).toBe("Dirt");
    expect(dirtBlock.solid).toBe(true);
    expect(dirtBlock.drops).toBe("DIRT");
  });

  test("getBlockByIndex should return correct block definition for an array index", () => {
    const block = getBlockByIndex(0);
    expect(block).toBeDefined();
    expect(block.id).toBe(0); // Air
    expect(block.name).toBe("Air");
  });

  test("should handle invalid block IDs gracefully", () => {
    const result = getBlockById(99999);
    expect(result).toBeUndefined();
  });

  test("should handle invalid indices gracefully", () => {
    const result = getBlockByIndex(99999);
    expect(result).toBeUndefined();
  });

  test("should map all block IDs to valid array indices", () => {
    // Verify that every block in the array can be found by its ID
    blocks.forEach((block, index) => {
      const foundIndex = getBlockIndexById(block.id);
      expect(foundIndex).toBe(index);
      expect(getBlockById(block.id)).toBe(block);
    });
  });

  test("block IDs should be unique", () => {
    const ids = new Set();
    blocks.forEach((block) => {
      expect(ids.has(block.id)).toBe(false); // Should not already exist
      ids.add(block.id);
    });
    expect(ids.size).toBe(blocks.length);
  });

  test("should support looking up specific blocks by ID", () => {
    // Test various block IDs that match tiles.mjs
    const testBlocks = [
      { id: 0, name: "Air" },
      { id: 1, name: "Grass" },
      { id: 2, name: "Dirt" },
      { id: 3, name: "Stone" },
    ];

    testBlocks.forEach(({ id, name }) => {
      const block = getBlockById(id);
      expect(block).toBeDefined();
      expect(block.id).toBe(id);
      expect(block.name).toBe(name);
    });
  });
});
