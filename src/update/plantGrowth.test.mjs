/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import {
  checkAndRemoveFarmedPlant,
  updatePlantGrowth,
  updateStructure,
} from "./plantGrowth.mjs";
import { generateWillowTreeStructure } from "../generate/plants/willowTree.mjs";
import { generatePineTreeStructure } from "../generate/plants/pineTree.mjs";
import { generateBirchStructure } from "../generate/plants/birch.mjs";
import { blocks as blockDefs, blockNames } from "../state/config/blocks.mjs";
import { generateBambooStructure } from "../generate/plants/bamboo.mjs";

describe("Plant Farming & Harvest", () => {
  let gameState;

  beforeEach(() => {
    gameState = {
      world: {
        get: jest.fn(),
        delete: jest.fn(),
        set: jest.fn(),
      },
      plantStructures: {},
      growthTimers: {},
    };
  });

  describe("checkAndRemoveFarmedPlant", () => {
    test("should remove plant structure when all blocks are harvested", () => {
      const key = "10,20,30";
      gameState.plantStructures[key] = {
        type: "MUSHROOM",
        blocks: [
          { x: 10, y: 20, z: 30, blockId: 5 },
          { x: 10, y: 21, z: 30, blockId: 5 },
        ],
      };
      gameState.growthTimers[key] = 5.5;

      // Mock world.get to return undefined (blocks don't exist)
      gameState.world.get.mockReturnValue(undefined);

      const result = checkAndRemoveFarmedPlant(gameState, key);

      expect(result).toBe(true);
      expect(gameState.plantStructures[key]).toBeUndefined();
      expect(gameState.growthTimers[key]).toBeUndefined();
    });

    test("should not remove plant if some blocks still exist", () => {
      const key = "10,20,30";
      gameState.plantStructures[key] = {
        type: "CARROT",
        blocks: [
          { x: 10, y: 20, z: 30, blockId: 8 },
          { x: 10, y: 21, z: 30, blockId: 8 },
        ],
      };
      gameState.growthTimers[key] = 3.2;

      // Mock world.get - first block exists, second doesn't
      gameState.world.get.mockImplementation((key) => {
        return key === "10,20,30" ? 8 : undefined;
      });

      const result = checkAndRemoveFarmedPlant(gameState, key);

      expect(result).toBe(false);
      expect(gameState.plantStructures[key]).toBeDefined();
      expect(gameState.growthTimers[key]).toBe(3.2);
    });

    test("should remove plant with empty blocks array", () => {
      const key = "5,10,5";
      gameState.plantStructures[key] = {
        type: "WHEAT",
        blocks: [],
      };
      gameState.growthTimers[key] = 1.0;

      const result = checkAndRemoveFarmedPlant(gameState, key);

      expect(result).toBe(true);
      expect(gameState.plantStructures[key]).toBeUndefined();
      expect(gameState.growthTimers[key]).toBeUndefined();
    });

    test("should return false if plant structure doesn't exist", () => {
      const result = checkAndRemoveFarmedPlant(gameState, "nonexistent");

      expect(result).toBe(false);
    });

    test("should not fail if plantStructures is null", () => {
      gameState.plantStructures = null;

      const result = checkAndRemoveFarmedPlant(gameState, "some,key");

      expect(result).toBe(false);
    });
  });

  describe("Tree growth - Regression tests for plant disappearance bug", () => {
    let mockGameState;

    beforeEach(() => {
      mockGameState = {
        world: new Map(),
        growthTimers: {},
        plantStructures: {},
        fastGrowth: false,
      };
    });

    test("Bamboo should maintain visible blocks during intermediate growth (height=0)", () => {
      // Test progress < 0.1 (growing block directly)
      const blocks1 = generateBambooStructure(0, 10, 0, 0.05);

      expect(blocks1.length).toBeGreaterThan(0);

      const growingBlockId = blockDefs.find(
        (b) => b.name === blockNames.BAMBOO_GROWING,
      ).id;

      expect(blocks1.some((b) => b.blockId === growingBlockId)).toBe(true);

      // Test height===0 condition: progress where Math.floor(8 * progress) === 0
      // This happens when 0.1 <= progress < 0.125 (8 * 0.125 = 1)
      const blocks2 = generateBambooStructure(0, 10, 0, 0.11);
      expect(blocks2.length).toBeGreaterThan(0);
      expect(blocks2.some((b) => b.blockId === growingBlockId)).toBe(true);
    });

    test("Birch tree should maintain visible blocks during intermediate growth (height=0)", () => {
      const blocks = generateBirchStructure(0, 10, 0, 0.12);

      expect(blocks.length).toBeGreaterThan(0);
      const growingBlockId = blockDefs.find(
        (b) => b.name === blockNames.BIRCH_GROWING,
      ).id;
      expect(blocks.some((b) => b.blockId === growingBlockId)).toBe(true);
    });

    test("Pine tree should maintain visible blocks during intermediate growth (height=0)", () => {
      const blocks = generatePineTreeStructure(0, 10, 0, 0.1);

      expect(blocks.length).toBeGreaterThan(0);

      const growingBlockId = blockDefs.find(
        (b) => b.name === blockNames.PINE_TREE_GROWING,
      ).id;

      expect(blocks.some((b) => b.blockId === growingBlockId)).toBe(true);
    });

    test("Willow tree maintains visible blocks at all growth stages", () => {
      const testCases = [
        { progress: 0.05, expected: "GROWING", minBlocks: 1 },
        { progress: 0.15, expected: "TRUNK", minBlocks: 5 }, // height=5 trunks
        { progress: 0.5, expected: "TRUNK", minBlocks: 5 },
      ];

      testCases.forEach(({ progress, expected, minBlocks }) => {
        const blocks = generateWillowTreeStructure(0, 10, 0, progress);
        expect(blocks.length).toBeGreaterThanOrEqual(minBlocks);

        if (expected === "GROWING") {
          const growingId = blockDefs.find(
            (b) => b.name === blockNames.WILLOW_TREE_GROWING,
          )?.id;

          expect(blocks.some((b) => b.blockId === growingId)).toBe(true);
        }
      });
    });

    test("Bamboo should not disappear during growth progression", () => {
      const key = "0,10,0";

      mockGameState.growthTimers[key] = 5.0;

      mockGameState.plantStructures[key] = {
        type: blockNames.BAMBOO,
        blocks: [],
      };

      // Test progression through critical ranges:
      // 0.1 <= progress < 0.125 (height===0, shows GROWING)
      // 0.125 <= progress < 0.25  (height=1-2, shows stalk)
      for (let progress = 0.05; progress < 0.3; progress += 0.02) {
        updateStructure(mockGameState, key, progress, blockNames.BAMBOO);

        expect(mockGameState.plantStructures[key]).toBeDefined();

        expect(
          mockGameState.plantStructures[key].blocks.length,
        ).toBeGreaterThan(0);
      }
    });

    test("Birch tree should not disappear during growth progression", () => {
      const key = "0,10,0";
      mockGameState.growthTimers[key] = 5.0;

      mockGameState.plantStructures[key] = {
        type: blockNames.BIRCH,
        blocks: [],
      };

      // Testing progress range where height would be 0 without the fix
      for (let progress = 0.1; progress < 0.17; progress += 0.03) {
        updateStructure(mockGameState, key, progress, blockNames.BIRCH);

        expect(mockGameState.plantStructures[key]).toBeDefined();

        expect(
          mockGameState.plantStructures[key].blocks.length,
        ).toBeGreaterThan(0);
      }
    });

    test("Pine tree should not disappear during growth progression", () => {
      const key = "0,10,0";
      mockGameState.growthTimers[key] = 5.0;

      mockGameState.plantStructures[key] = {
        type: blockNames.PINE_TREE,
        blocks: [],
      };

      // Testing progress range where height would be 0 without the fix
      for (let progress = 0.1; progress < 0.15; progress += 0.02) {
        updateStructure(mockGameState, key, progress, blockNames.PINE_TREE);

        expect(mockGameState.plantStructures[key]).toBeDefined();

        expect(
          mockGameState.plantStructures[key].blocks.length,
        ).toBeGreaterThan(0);
      }
    });

    test("Willow tree should not disappear during growth progression", () => {
      const key = "0,10,0";
      mockGameState.growthTimers[key] = 5.0;

      mockGameState.plantStructures[key] = {
        type: blockNames.WILLOW_TREE,
        blocks: [],
      };

      // Simulate multiple growth updates at different progress levels
      // Testing progress range 0.1 to 0.2 where height would be 0 without the fix
      for (let progress = 0.1; progress < 0.2; progress += 0.02) {
        updateStructure(mockGameState, key, progress, blockNames.WILLOW_TREE);

        expect(mockGameState.plantStructures[key]).toBeDefined();
        expect(
          mockGameState.plantStructures[key].blocks.length,
        ).toBeGreaterThan(0);
      }
    });

    test("Multiple trees growing simultaneously should all persist", () => {
      const keys = ["0,10,0", "-1,9,2", "4,7,2", "1,8,6"];

      keys.forEach((key) => {
        mockGameState.growthTimers[key] = 5.0;

        mockGameState.plantStructures[key] = {
          type: blockNames.WILLOW_TREE,
          blocks: [],
        };
      });

      // Simulate growth updates - this matches the user's bug report scenario
      for (let i = 0; i < 300; i++) {
        updatePlantGrowth(mockGameState);

        // All plants that have active timers should have structures and blocks
        keys.forEach((key) => {
          if (mockGameState.growthTimers[key] !== undefined) {
            expect(mockGameState.plantStructures[key]).toBeDefined();

            expect(
              mockGameState.plantStructures[key].blocks.length,
            ).toBeGreaterThan(0);
          }
        });
      }
    });
  });
});
