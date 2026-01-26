/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock block configuration
jest.unstable_mockModule("../../world/config/blocks.mjs", () => ({
  blockNames: {
    WHEAT: "WHEAT",
    WHEAT_GROWING: "WHEAT_GROWING",
    WHEAT_STALK: "WHEAT_STALK",
    WHEAT_GRAIN: "WHEAT_GRAIN",
    CARROT: "CARROT",
    CARROT_LEAVES: "CARROT_LEAVES",
    PINE_TREE: "PINE_TREE",
    PINE_LOG: "PINE_LOG",
    PINE_LEAVES: "PINE_LEAVES",
    BIRCH: "BIRCH",
    BIRCH_LOG: "BIRCH_LOG",
    BIRCH_LEAVES: "BIRCH_LEAVES",
    BAMBOO: "BAMBOO",
    BAMBOO_STALK: "BAMBOO_STALK",
    CACTUS: "CACTUS",
    CACTUS_SEGMENT: "CACTUS_SEGMENT",
  },
}));

jest.unstable_mockModule("../../world/config/getBlockIdByName.mjs", () => ({
  getBlockIdByName: jest.fn((name) => {
    const blockIds = {
      WHEAT_GROWING: 101,
      WHEAT_STALK: 102,
      WHEAT_GRAIN: 103,
      CARROT: 104,
      CARROT_LEAVES: 105,
      PINE_LOG: 106,
      PINE_LEAVES: 107,
      BIRCH_LOG: 108,
      BIRCH_LEAVES: 109,
      BAMBOO_STALK: 110,
      CACTUS: 111,
      CACTUS_SEGMENT: 112,
    };
    return blockIds[name] || 0;
  }),
}));

describe("Plant Structure Generators", () => {
  describe("Wheat", () => {
    let generateWheatStructure;

    beforeAll(async () => {
      const module = await import("./wheat.mjs");

      generateWheatStructure = module.generateWheatStructure;
    });

    test("should generate only growing block for early stage", () => {
      const structure = generateWheatStructure(10, 20, 30, 0.1);

      expect(structure).toHaveLength(1);
      expect(structure[0]).toEqual({ x: 10, y: 20, z: 30, blockId: 101 });
    });

    test("should generate stalk at medium stage", () => {
      const structure = generateWheatStructure(10, 20, 30, 0.4);

      expect(structure).toHaveLength(1);
      expect(structure[0]).toEqual({ x: 10, y: 20, z: 30, blockId: 102 });
    });

    test("should generate tall stalk at late stage", () => {
      const structure = generateWheatStructure(10, 20, 30, 0.6);

      expect(structure).toHaveLength(2);
      expect(structure[0]).toEqual({ x: 10, y: 20, z: 30, blockId: 102 });
      expect(structure[1]).toEqual({ x: 10, y: 21, z: 30, blockId: 102 });
    });

    test("should generate full wheat with grain at final stage", () => {
      const structure = generateWheatStructure(10, 20, 30, 0.9);

      expect(structure).toHaveLength(3);
      expect(structure[0]).toEqual({ x: 10, y: 20, z: 30, blockId: 102 });
      expect(structure[1]).toEqual({ x: 10, y: 21, z: 30, blockId: 102 });
      expect(structure[2]).toEqual({ x: 10, y: 22, z: 30, blockId: 103 });
    });

    test("should handle exact threshold values correctly", () => {
      // At exactly 0.2, should switch from growing to stalk
      const structureAtThreshold = generateWheatStructure(10, 20, 30, 0.2);
      expect(structureAtThreshold).toHaveLength(1);

      // Just above 0.5, should add second stalk
      const structureAt51 = generateWheatStructure(10, 20, 30, 0.51);
      expect(structureAt51).toHaveLength(2);

      // Just above 0.8, should add grain
      const structureAt81 = generateWheatStructure(10, 20, 30, 0.81);
      expect(structureAt81).toHaveLength(3);
    });
  });

  describe("Carrot", () => {
    let generateCarrotStructure;

    beforeAll(async () => {
      const module = await import("./carrot.mjs");

      generateCarrotStructure = module.generateCarrotStructure;
    });

    test("should generate carrot structure", () => {
      const structure = generateCarrotStructure(10, 20, 30, 0.5);

      expect(structure).toBeDefined();
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);
    });

    test("should include multiple blocks at full growth", () => {
      const structure = generateCarrotStructure(10, 20, 30, 1.0);

      expect(structure.length).toBeGreaterThan(1);
    });
  });

  describe("Pine Tree", () => {
    let generatePineTreeStructure;

    beforeAll(async () => {
      const module = await import("./pineTree.mjs");

      generatePineTreeStructure = module.generatePineTreeStructure;
    });

    test("should generate pine tree structure", () => {
      const structure = generatePineTreeStructure(10, 20, 30, 0.5);

      expect(structure).toBeDefined();
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);
    });

    test("should generate complex structure at full growth", () => {
      const structure = generatePineTreeStructure(10, 20, 30, 1.0);

      // Pine trees should have many blocks
      expect(structure.length).toBeGreaterThan(10);
    });

    test("should generate taller tree at higher progress", () => {
      const smallTree = generatePineTreeStructure(10, 20, 30, 0.3);
      const largeTree = generatePineTreeStructure(10, 20, 30, 0.9);

      expect(largeTree.length).toBeGreaterThanOrEqual(smallTree.length);
    });
  });

  describe("Birch Tree", () => {
    let generateBirchStructure;

    beforeAll(async () => {
      const module = await import("./birch.mjs");

      generateBirchStructure = module.generateBirchStructure;
    });

    test("should generate birch tree structure", () => {
      const structure = generateBirchStructure(10, 20, 30, 0.5);

      expect(structure).toBeDefined();
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);
    });

    test("should generate complex structure at full growth", () => {
      const structure = generateBirchStructure(10, 20, 30, 1.0);

      // Birch trees should have many blocks
      expect(structure.length).toBeGreaterThan(10);
    });
  });

  describe("Bamboo", () => {
    let generateBambooStructure;

    beforeAll(async () => {
      const module = await import("./bamboo.mjs");

      generateBambooStructure = module.generateBambooStructure;
    });

    test("should generate bamboo structure", () => {
      const structure = generateBambooStructure(10, 20, 30, 0.5);

      expect(structure).toBeDefined();
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);
    });

    test("should use bamboo stalk blocks", () => {
      const structure = generateBambooStructure(10, 20, 30, 1.0);
      const hasBamboo = structure.some((block) => block.blockId === 110);

      expect(hasBamboo).toBe(true);
    });

    test("should generate taller bamboo at higher progress", () => {
      const smallBamboo = generateBambooStructure(10, 20, 30, 0.2);
      const largeBamboo = generateBambooStructure(10, 20, 30, 0.8);

      expect(largeBamboo.length).toBeGreaterThanOrEqual(smallBamboo.length);
    });
  });

  describe("Cactus", () => {
    let generateCactusStructure;

    beforeAll(async () => {
      const module = await import("./cactus.mjs");

      generateCactusStructure = module.generateCactusStructure;
    });

    test("should generate cactus structure", () => {
      const structure = generateCactusStructure(10, 20, 30, 0.5);

      expect(structure).toBeDefined();
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBeGreaterThan(0);
    });

    test("should generate single growing block at early stage", () => {
      const structure = generateCactusStructure(10, 20, 30, 0.05);

      expect(structure).toHaveLength(1);
      expect(structure[0].x).toBe(10);
      expect(structure[0].y).toBe(20);
      expect(structure[0].z).toBe(30);
    });

    test("should generate taller cactus at higher progress", () => {
      const smallCactus = generateCactusStructure(10, 20, 30, 0.3);
      const largeCactus = generateCactusStructure(10, 20, 30, 0.9);

      expect(largeCactus.length).toBeGreaterThanOrEqual(smallCactus.length);
    });

    test("should generate cactus with arms at high progress", () => {
      const structure = generateCactusStructure(10, 20, 30, 0.9);

      // At high progress, cactus should have arms
      const hasArms = structure.some(
        (block) => block.x !== 10 || block.z !== 30,
      );

      expect(hasArms).toBe(true);
    });
  });

  describe("Plant Generators Index", () => {
    let generators;

    beforeAll(async () => {
      const module = await import("./index.mjs");

      generators = module.generators;
    });

    test("should export generators object", () => {
      expect(typeof generators).toBe("object");
      expect(generators).not.toBeNull();
    });

    test("should have generator for WHEAT", () => {
      expect(generators.WHEAT).toBeDefined();
      expect(typeof generators.WHEAT).toBe("function");
    });

    test("should have generator for CARROT", () => {
      expect(generators.CARROT).toBeDefined();
      expect(typeof generators.CARROT).toBe("function");
    });

    test("should have generator for PINE_TREE", () => {
      expect(generators.PINE_TREE).toBeDefined();
      expect(typeof generators.PINE_TREE).toBe("function");
    });

    test("should have generator for BIRCH", () => {
      expect(generators.BIRCH).toBeDefined();
      expect(typeof generators.BIRCH).toBe("function");
    });

    test("should have generator for BAMBOO", () => {
      expect(generators.BAMBOO).toBeDefined();
      expect(typeof generators.BAMBOO).toBe("function");
    });

    test("should have generator for CACTUS", () => {
      expect(generators.CACTUS).toBeDefined();
      expect(typeof generators.CACTUS).toBe("function");
    });
  });
});
