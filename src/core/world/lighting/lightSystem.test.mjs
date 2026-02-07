/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../meshing/chunk.mjs", () => ({
  CHUNK_SIZE_X: 16,
  CHUNK_SIZE_Y: 128,
  CHUNK_SIZE_Z: 16,
  worldToChunk: jest.fn((worldX, worldZ) => ({
    chunkX: Math.floor(worldX / 16),
    chunkZ: Math.floor(worldZ / 16),
    localX: worldX % 16,
    localZ: worldZ % 16,
  })),
}));

describe("Light System Constants", () => {
  test("should export MAX_LIGHT_LEVEL", async () => {
    const { MAX_LIGHT_LEVEL } = await import("./lightSystem.mjs");

    expect(MAX_LIGHT_LEVEL).toBe(15);
  });

  test("should export TORCH_LIGHT_LEVEL", async () => {
    const { TORCH_LIGHT_LEVEL } = await import("./lightSystem.mjs");

    expect(TORCH_LIGHT_LEVEL).toBe(14);
  });

  test("should export MAX_LIGHT_RADIUS", async () => {
    const { MAX_LIGHT_RADIUS } = await import("./lightSystem.mjs");

    expect(MAX_LIGHT_RADIUS).toBe(16);
  });

  test("should export MIN_AMBIENT_LIGHT", async () => {
    const { MIN_AMBIENT_LIGHT } = await import("./lightSystem.mjs");

    expect(MIN_AMBIENT_LIGHT).toBe(0.0625);
  });
});

describe("lightLevelToBrightness", () => {
  let lightSystem;

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  test("should convert light level 0 to minimum brightness", () => {
    const brightness = lightSystem.lightLevelToBrightness(0);

    expect(brightness).toBeCloseTo(0.0352);
  });

  test("should convert light level 15 to maximum brightness", () => {
    const brightness = lightSystem.lightLevelToBrightness(15);

    expect(brightness).toBeCloseTo(1.0);
  });

  test("should convert light level 7 to intermediate brightness", () => {
    const brightness = lightSystem.lightLevelToBrightness(7);

    expect(brightness).toBeGreaterThan(0.0352);
    expect(brightness).toBeLessThan(1.0);
  });

  test("should handle edge cases", () => {
    expect(lightSystem.lightLevelToBrightness(0)).toBeCloseTo(0.0352);
    expect(lightSystem.lightLevelToBrightness(15)).toBe(1.0);
  });
});

describe("LightMap class", () => {
  let LightMap;

  beforeAll(async () => {
    const module = await import("./lightSystem.mjs");

    LightMap = module.LightMap;
  });

  test("should initialize with correct dimensions", () => {
    const lightMap = new LightMap(16, 128, 16);

    expect(lightMap.sizeX).toBe(16);
    expect(lightMap.sizeY).toBe(128);
    expect(lightMap.sizeZ).toBe(16);
    expect(lightMap.data.length).toBe(16 * 128 * 16);
  });

  test("should initialize with default chunk dimensions", () => {
    const lightMap = new LightMap();

    expect(lightMap.sizeX).toBe(16);
    expect(lightMap.sizeY).toBe(128);
    expect(lightMap.sizeZ).toBe(16);
  });

  test("getIndex should calculate correct index", () => {
    const lightMap = new LightMap(16, 128, 16);
    const index = lightMap.getIndex(1, 2, 3);

    expect(index).toBe(1 + 2 * 16 + 3 * 16 * 128);
  });

  test("get should return 0 for out of bounds coordinates", () => {
    const lightMap = new LightMap(16, 128, 16);

    expect(lightMap.get(-1, 0, 0)).toBe(0);
    expect(lightMap.get(0, -1, 0)).toBe(0);
    expect(lightMap.get(0, 0, -1)).toBe(0);
    expect(lightMap.get(16, 0, 0)).toBe(0);
    expect(lightMap.get(0, 128, 0)).toBe(0);
    expect(lightMap.get(0, 0, 16)).toBe(0);
  });

  test("get should return light level for valid coordinates", () => {
    const lightMap = new LightMap(16, 128, 16);

    lightMap.data[lightMap.getIndex(5, 10, 15)] = 7;

    expect(lightMap.get(5, 10, 15)).toBe(7);
  });

  test("set should clamp light level to valid range", () => {
    const lightMap = new LightMap(16, 128, 16);

    lightMap.set(5, 10, 15, 20); // Above max
    expect(lightMap.get(5, 10, 15)).toBe(15);

    lightMap.set(5, 10, 15, -5); // Below min
    expect(lightMap.get(5, 10, 15)).toBe(0);

    lightMap.set(5, 10, 15, 10); // Valid
    expect(lightMap.get(5, 10, 15)).toBe(10);
  });

  test("set should ignore out of bounds coordinates", () => {
    const lightMap = new LightMap(16, 128, 16);
    lightMap.set(-1, 0, 0, 10);
    lightMap.set(0, -1, 0, 10);
    lightMap.set(0, 0, -1, 10);
    lightMap.set(16, 0, 0, 10);
    lightMap.set(0, 128, 0, 10);
    lightMap.set(0, 0, 16, 10);

    // Should not throw and should not set anything
    expect(lightMap.get(0, 0, 0)).toBe(0);
  });

  test("clear should reset all light values to 0", () => {
    const lightMap = new LightMap(16, 128, 16);

    lightMap.set(5, 10, 15, 10);
    lightMap.set(3, 20, 7, 12);

    expect(lightMap.get(5, 10, 15)).toBe(10);

    lightMap.clear();

    expect(lightMap.get(5, 10, 15)).toBe(0);
    expect(lightMap.get(3, 20, 7)).toBe(0);
  });
});

describe("propagateLight", () => {
  let lightSystem;
  let mockChunk;
  let mockBlockDefs;

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  beforeEach(() => {
    mockChunk = {
      getBlock: jest.fn(),
      lightMap: null,
      dirty: false,
    };

    mockBlockDefs = {
      getById: jest.fn((blockId) => {
        if (blockId === 1) {
          return { emissive: 15, solid: true };
        }

        if (blockId === 2) {
          return { emissive: 0, solid: true };
        }

        if (blockId === 3) {
          return { emissive: 0, solid: false };
        }

        return null;
      }),
    };
  });

  test("should initialize lightMap if it doesn't exist", () => {
    mockChunk.getBlock.mockReturnValue(0);

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap).toBeInstanceOf(lightSystem.LightMap);
  });

  test("should clear existing lightMap", () => {
    const existingLightMap = new lightSystem.LightMap();
    existingLightMap.set(5, 5, 5, 10);

    mockChunk.lightMap = existingLightMap;
    mockChunk.getBlock.mockReturnValue(0);

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(0);
  });

  test("should identify emissive blocks as light sources", () => {
    // Place an emissive block at (5, 5, 5)
    mockChunk.getBlock.mockImplementation((x, y, z) => {
      if (x === 5 && y === 5 && z === 5) {
        // Emissive block
        return 1;
      }

      return 0;
    });

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
  });

  test("should propagate light from emissive blocks", () => {
    // Place an emissive block at (8, 8, 8)
    mockChunk.getBlock.mockImplementation((x, y, z) => {
      if (x === 8 && y === 8 && z === 8) {
        // Emissive block
        return 1;
      }

      // Air
      return 0;
    });

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Check that light propagated to adjacent blocks
    expect(mockChunk.lightMap.get(8, 8, 8)).toBe(15);
    expect(mockChunk.lightMap.get(7, 8, 8)).toBe(14); // One block away
    expect(mockChunk.lightMap.get(9, 8, 8)).toBe(14);
    expect(mockChunk.lightMap.get(8, 7, 8)).toBe(14);
    expect(mockChunk.lightMap.get(8, 9, 8)).toBe(14);
    expect(mockChunk.lightMap.get(8, 8, 7)).toBe(14);
    expect(mockChunk.lightMap.get(8, 8, 9)).toBe(14);
  });

  test("should not propagate light through solid blocks", () => {
    // Create a wall of solid blocks to prevent light from going around
    mockChunk.getBlock.mockImplementation((x, y, z) => {
      if (x === 5 && y === 10 && z === 10) {
        // Emissive at (5,10,10)
        return 1;
      }

      if (x >= 6 && x <= 10 && y >= 5 && y <= 15 && z >= 5 && z <= 15) {
        // Solid wall
        return 2;
      }

      // Air elsewhere
      return 0;
    });

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Emissive block should have full light
    expect(mockChunk.lightMap.get(5, 10, 10)).toBe(15);

    // Light should propagate away from the solid wall
    expect(mockChunk.lightMap.get(4, 10, 10)).toBe(14);
    expect(mockChunk.lightMap.get(3, 10, 10)).toBe(13);

    // Solid wall should block light
    // First block in wall should not have light (not emissive)
    expect(mockChunk.lightMap.get(6, 10, 10)).toBe(0);

    // Beyond the solid wall should also have no light
    expect(mockChunk.lightMap.get(11, 10, 10)).toBe(0);
  });

  test("should propagate light through non-solid blocks", () => {
    // Place an emissive block at (5, 5, 5) and a non-solid block at (6, 5, 5)
    mockChunk.getBlock.mockImplementation((x, y, z) => {
      if (x === 5 && y === 5 && z === 5) {
        // Emissive
        return 1;
      }

      if (x === 6 && y === 5 && z === 5) {
        // Non-solid
        return 3;
      }

      return 0;
    });

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Light should pass through the non-solid block
    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
    expect(mockChunk.lightMap.get(6, 5, 5)).toBe(14); // Through non-solid
    expect(mockChunk.lightMap.get(7, 5, 5)).toBe(13); // Beyond
  });

  test("should attenuate light over distance", () => {
    // Create a straight line of air from an emissive block
    mockChunk.getBlock.mockImplementation((x, y, z) => {
      if (x === 5 && y === 5 && z === 5) {
        // Emissive
        return 1;
      }

      // Air in same row
      if (y === 5 && z === 5) {
        return 0;
      }

      return 0;
    });

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Check attenuation
    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
    expect(mockChunk.lightMap.get(6, 5, 5)).toBe(14);
    expect(mockChunk.lightMap.get(7, 5, 5)).toBe(13);
    expect(mockChunk.lightMap.get(8, 5, 5)).toBe(12);
    expect(mockChunk.lightMap.get(9, 5, 5)).toBe(11);
  });
});

describe("getLightLevel", () => {
  let lightSystem;

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  test("should return 0 if chunk doesn't exist", () => {
    const mockChunkManager = {
      getChunk: jest.fn().mockReturnValue(null),
    };

    const lightLevel = lightSystem.getLightLevel(
      mockChunkManager,
      100,
      64,
      200,
    );

    expect(lightLevel).toBe(0);
  });

  test("should return 0 if chunk has no lightMap", () => {
    const mockChunk = {};
    const mockChunkManager = {
      getChunk: jest.fn().mockReturnValue(mockChunk),
    };

    const lightLevel = lightSystem.getLightLevel(
      mockChunkManager,
      100,
      64,
      200,
    );

    expect(lightLevel).toBe(0);
  });

  test("should return light level from chunk's lightMap", () => {
    const lightMap = new lightSystem.LightMap();
    lightMap.set(10, 64, 4, 12); // Set light at local position (10, 64, 4)

    const mockChunk = { lightMap };
    const mockChunkManager = {
      getChunk: jest.fn().mockReturnValue(mockChunk),
    };

    // World position 100, 64, 200 should map to local (100 % 16 = 4, 64, 200 % 16 = 12)
    // Wait, let me recalculate: worldX=100, chunkX=6, localX=4; worldZ=200, chunkZ=12, localZ=8
    // Actually, let me adjust the test
    const lightLevel = lightSystem.getLightLevel(
      mockChunkManager,
      170, // 170 = 10*16 + 10
      64,
      132, // 132 = 8*16 + 4
    );

    expect(lightLevel).toBe(12);
  });
});

describe("updateLightOnBlockChange", () => {
  let lightSystem;

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  test("should mark chunk as dirty after light update", () => {
    const mockChunk = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const mockChunkManager = {
      getChunk: jest.fn().mockReturnValue(mockChunk),
    };

    const mockBlockDefs = {
      getById: jest.fn().mockReturnValue(null),
    };

    lightSystem.updateLightOnBlockChange(
      mockChunkManager,
      100,
      64,
      200,
      mockBlockDefs,
    );

    expect(mockChunk.dirty).toBe(true);
  });

  test("should update neighbor chunks near boundaries", () => {
    const mainChunk = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborChunkXNeg = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborChunkXPos = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const mockChunkManager = {
      getChunk: jest.fn().mockImplementation((chunkX, chunkZ) => {
        if (chunkX === 6 && chunkZ === 8) {
          // Main chunk at (6, 8)
          return mainChunk;
        }

        if (chunkX === 5 && chunkZ === 8) {
          // X-1 neighbor
          return neighborChunkXNeg;
        }

        if (chunkX === 7 && chunkZ === 8) {
          // X+1 neighbor
          return neighborChunkXPos;
        }

        return null;
      }),
    };

    const mockBlockDefs = {
      getById: jest.fn().mockReturnValue(null),
    };

    // Trigger update at X boundary (localX = 0)
    lightSystem.updateLightOnBlockChange(
      mockChunkManager,
      96, // 96 = 6*16 + 0 (at X boundary)
      64,
      128, // 128 = 8*16 + 0
      mockBlockDefs,
    );

    // Main chunk and X-1 neighbor should be dirty
    expect(mainChunk.dirty).toBe(true);
    expect(neighborChunkXNeg.dirty).toBe(true);
  });

  test("should update all four neighbor chunks when at corner", () => {
    const mainChunk = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborXNeg = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborXPos = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborZNeg = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const neighborZPos = {
      getBlock: jest.fn().mockReturnValue(0),
      lightMap: null,
      dirty: false,
    };

    const mockChunkManager = {
      getChunk: jest.fn().mockImplementation((chunkX, chunkZ) => {
        if (chunkX === 6 && chunkZ === 8) {
          return mainChunk;
        }

        if (chunkX === 5 && chunkZ === 8) {
          return neighborXNeg;
        }

        if (chunkX === 7 && chunkZ === 8) {
          return neighborXPos;
        }

        if (chunkX === 6 && chunkZ === 7) {
          return neighborZNeg;
        }

        if (chunkX === 6 && chunkZ === 9) {
          return neighborZPos;
        }

        return null;
      }),
    };

    const mockBlockDefs = {
      getById: jest.fn().mockReturnValue(null),
    };

    // Trigger update at corner boundary (localX = 0, localZ = 0)
    // When localX=0 and localZ=0, all four neighbor chunks are within MAX_LIGHT_RADIUS
    lightSystem.updateLightOnBlockChange(
      mockChunkManager,
      96, // 96 = 6*16 + 0 (X boundary)
      64,
      128, // 128 = 8*16 + 0 (Z boundary)
      mockBlockDefs,
    );

    // All chunks should be dirty (main + all 4 neighbors)
    expect(mainChunk.dirty).toBe(true);
    expect(neighborXNeg.dirty).toBe(true);

    // At X+ boundary (0 >= 16-16)
    expect(neighborXPos.dirty).toBe(true);
    expect(neighborZNeg.dirty).toBe(true);

    // At Z+ boundary (0 >= 16-16)
    expect(neighborZPos.dirty).toBe(true);
  });
});
