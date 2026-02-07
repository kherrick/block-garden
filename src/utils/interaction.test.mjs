/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock the collectDrop module
jest.unstable_mockModule("./collectDrop.mjs", () => ({
  collectDrop: jest.fn(() => ({ materials: [], seeds: [] })),
}));

// Mock the state module to avoid Worker instantiation
jest.unstable_mockModule("../core/systems/game/state.mjs", () => ({
  getMaterialCount: jest.fn(() => 0),
  getSeedCount: jest.fn(() => 0),
  removeMaterial: jest.fn(() => true),
  removeSeed: jest.fn(() => true),
  toInventoryKey: jest.fn((name) => name.toUpperCase().replace(/ /g, "_")),
}));

// Import module under test after mocks
const { removeBlock } = await import("./interaction.mjs");

describe("Block Removal & Plant Harvesting", () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      hit: {
        x: 10,
        y: 20,
        z: 30,
        face: { x: 1, y: 0, z: 0 },
      },
      world: {
        get: jest.fn().mockReturnValue(0),
        delete: jest.fn(),
        set: jest.fn(),
      },
      plantStructures: {},
      growthTimers: {},
      curBlock: { get: () => 1 },
      x: 0,
      y: 0,
      z: 0,
      playerWidth: 0.6,
      playerHeight: 1.8,
    };
  });

  describe("removeBlock with plant structure cleanup", () => {
    test("should remove plant structure when last block is harvested", () => {
      const structureKey = "10,20,30";

      // Set up a plant with one block at the hit location
      gameState.plantStructures[structureKey] = {
        type: "MUSHROOM",
        blocks: [{ x: 10, y: 20, z: 30, blockId: 5 }],
      };

      gameState.growthTimers[structureKey] = 2.5;

      // Mock world.get to return blockId 5
      gameState.world.get.mockReturnValue(5);

      removeBlock(gameState);

      // Verify world.delete was called (final block with mesh update true)
      expect(gameState.world.delete).toHaveBeenCalledWith("10,20,30", true);

      // Verify plant structure was removed
      expect(gameState.plantStructures[structureKey]).toBeUndefined();
      expect(gameState.growthTimers[structureKey]).toBeUndefined();
    });

    test("should remove plant when all blocks are harvested", () => {
      const structureKey = "10,20,30";

      // Set up a plant with multiple blocks, only one is being hit
      gameState.plantStructures[structureKey] = {
        type: "WHEAT",
        blocks: [
          { x: 10, y: 20, z: 30, blockId: 8 },
          { x: 10, y: 21, z: 30, blockId: 8 },
        ],
      };

      gameState.growthTimers[structureKey] = 1.0;

      // Mock world.get to return blockId 8
      gameState.world.get.mockReturnValue(8);

      removeBlock(gameState);

      // Verify plant structure was removed
      expect(gameState.plantStructures[structureKey]).toBeUndefined();
      expect(gameState.growthTimers[structureKey]).toBeUndefined();
    });

    test("should handle removal when no plant structures exist", () => {
      gameState.plantStructures = {};
      gameState.world.get.mockReturnValue(1); // Regular block

      expect(() => removeBlock(gameState)).not.toThrow();
      expect(gameState.world.delete).toHaveBeenCalledWith("10,20,30", true);
    });

    test("should not fail when plantStructures is null", () => {
      gameState.plantStructures = null;
      gameState.world.get.mockReturnValue(1); // Regular block

      expect(() => removeBlock(gameState)).not.toThrow();
      expect(gameState.world.delete).toHaveBeenCalledWith("10,20,30", true);
    });
  });
});
