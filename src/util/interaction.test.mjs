/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import { removeBlock } from "./interaction.mjs";

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
        get: jest.fn().mockReturnValue(0), // Blocks are gone
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

      // Mock world.get to return undefined (block doesn't exist after deletion)
      gameState.world.get.mockReturnValue(undefined);

      removeBlock(gameState);

      // Verify world.delete was called
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

      // Mock world.get to say both blocks are gone now
      gameState.world.get.mockReturnValue(undefined);

      removeBlock(gameState);

      // Verify plant structure was removed
      expect(gameState.plantStructures[structureKey]).toBeUndefined();
      expect(gameState.growthTimers[structureKey]).toBeUndefined();
    });

    test("should not remove plant if blocks still remain", () => {
      const structureKey = "10,20,30";

      gameState.plantStructures[structureKey] = {
        type: "CARROT",
        blocks: [
          { x: 10, y: 20, z: 30, blockId: 8 },
          { x: 10, y: 21, z: 30, blockId: 8 },
        ],
      };
      gameState.growthTimers[structureKey] = 3.5;

      // Mock world.get - first block is being removed, but second still exists
      gameState.world.get.mockImplementation((key) => {
        return key === "10,21,30" ? 8 : undefined;
      });

      removeBlock(gameState);

      // Verify plant structure still exists
      expect(gameState.plantStructures[structureKey]).toBeDefined();
      expect(gameState.growthTimers[structureKey]).toBe(3.5);
    });

    test("should handle removal when no plant structures exist", () => {
      gameState.plantStructures = {};

      expect(() => removeBlock(gameState)).not.toThrow();
      expect(gameState.world.delete).toHaveBeenCalledWith("10,20,30", true);
    });

    test("should not fail when plantStructures is null", () => {
      gameState.plantStructures = null;

      expect(() => removeBlock(gameState)).not.toThrow();
      expect(gameState.world.delete).toHaveBeenCalledWith("10,20,30", true);
    });
  });
});
