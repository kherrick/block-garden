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
    localX: ((worldX % 16) + 16) % 16,
    localZ: ((worldZ % 16) + 16) % 16,
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

  const createMockChunk = () => {
    const blocks = new Uint8Array(16 * 128 * 16);
    const index = (x, y, z) => x + z * 16 + y * 16 * 16;
    const inBounds = (x, y, z) =>
      x >= 0 && x < 16 && y >= 0 && y < 128 && z >= 0 && z < 16;

    return {
      blocks,
      emissiveBlocks: new Set(),
      emissivesVerified: false,
      dirty: false,
      lightMap: null,
      index,
      localFromIndex: (idx) => {
        const layer = 16 * 16;
        const y = Math.floor(idx / layer);
        const rem = idx % layer;
        const z = Math.floor(rem / 16);
        const x = rem % 16;
        return { x, y, z };
      },
      getBlock: jest.fn((x, y, z) => {
        if (!inBounds(x, y, z)) {
          return 0;
        }

        return blocks[index(x, y, z)];
      }),
      setBlock: jest.fn((x, y, z, val) => {
        if (inBounds(x, y, z)) {
          blocks[index(x, y, z)] = val;
        }
      }),
      setBlocks: jest.fn((x, y, z, val) => {
        if (inBounds(x, y, z)) {
          blocks[index(x, y, z)] = val;
        }
      }),
    };
  };

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  beforeEach(() => {
    mockChunk = createMockChunk();

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
    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap).toBeInstanceOf(lightSystem.LightMap);
  });

  test("should clear existing lightMap", () => {
    const existingLightMap = new lightSystem.LightMap();
    existingLightMap.set(5, 5, 5, 10);
    mockChunk.lightMap = existingLightMap;

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(0);
  });

  test("should identify emissive blocks as light sources", () => {
    // Place an emissive block at (5, 5, 5)
    mockChunk.setBlock(5, 5, 5, 1);

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
  });

  test("should propagate light from emissive blocks", () => {
    // Place an emissive block at (8, 8, 8)
    mockChunk.setBlock(8, 8, 8, 1);

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Check that light propagated to adjacent blocks
    expect(mockChunk.lightMap.get(8, 8, 8)).toBe(15);
    expect(mockChunk.lightMap.get(7, 8, 8)).toBe(14); // One block away
    expect(mockChunk.lightMap.get(9, 8, 8)).toBe(14);
  });

  test("should not propagate light through solid blocks", () => {
    // Emissive at (5,10,10)
    mockChunk.setBlock(5, 10, 10, 1);

    // Solid wall x=6..10
    for (let x = 6; x <= 10; x++) {
      for (let y = 5; y <= 15; y++) {
        for (let z = 5; z <= 15; z++) {
          mockChunk.setBlock(x, y, z, 2);
        }
      }
    }

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Emissive block should have full light
    expect(mockChunk.lightMap.get(5, 10, 10)).toBe(15);

    // Light should propagate away from the solid wall
    expect(mockChunk.lightMap.get(4, 10, 10)).toBe(14);

    // Solid wall should block light
    expect(mockChunk.lightMap.get(6, 10, 10)).toBe(0);
    expect(mockChunk.lightMap.get(11, 10, 10)).toBe(0);
  });

  test("should propagate light through non-solid blocks", () => {
    // Place an emissive block at (5, 5, 5) and a non-solid block at (6, 5, 5)
    mockChunk.setBlock(5, 5, 5, 1);
    mockChunk.setBlock(6, 5, 5, 3); // Non-solid

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
    expect(mockChunk.lightMap.get(6, 5, 5)).toBe(14); // Through non-solid
    expect(mockChunk.lightMap.get(7, 5, 5)).toBe(13); // Beyond
  });

  test("should attenuate light over distance", () => {
    // Emissive at (5, 5, 5)
    mockChunk.setBlock(5, 5, 5, 1);

    lightSystem.propagateLight(mockChunk, mockBlockDefs);

    // Check attenuation
    expect(mockChunk.lightMap.get(5, 5, 5)).toBe(15);
    expect(mockChunk.lightMap.get(6, 5, 5)).toBe(14);
    expect(mockChunk.lightMap.get(7, 5, 5)).toBe(13);
    expect(mockChunk.lightMap.get(8, 5, 5)).toBe(12);
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
    lightMap.set(10, 64, 4, 12); // local

    const mockChunk = { lightMap };
    const mockChunkManager = {
      getChunk: jest.fn().mockReturnValue(mockChunk),
    };

    // worldX = chunkX*16 + 10, worldZ = chunkZ*16 + 4
    // Using chunkX=0, chunkZ=0 for simplicity
    const lightLevel = lightSystem.getLightLevel(mockChunkManager, 10, 64, 4);

    expect(lightLevel).toBe(12);
  });
});

describe("updateLightOnBlockChange", () => {
  let lightSystem;
  let createMockChunk;

  beforeAll(async () => {
    lightSystem = await import("./lightSystem.mjs");
  });

  beforeEach(() => {
    createMockChunk = () => {
      const blocks = new Uint8Array(16 * 128 * 16);
      const index = (x, y, z) => x + z * 16 + y * 16 * 16;
      const inBounds = (x, y, z) =>
        x >= 0 && x < 16 && y >= 0 && y < 128 && z >= 0 && z < 16;

      return {
        blocks,
        emissiveBlocks: new Set(),
        emissivesVerified: false,
        dirty: false,
        lightMap: null,
        index,
        localFromIndex: (idx) => {
          const layer = 16 * 16;
          const y = Math.floor(idx / layer);
          const rem = idx % layer;
          const z = Math.floor(rem / 16);
          const x = rem % 16;
          return { x, y, z };
        },
        getBlock: jest.fn((x, y, z) => {
          if (!inBounds(x, y, z)) return 0;
          return blocks[index(x, y, z)];
        }),
        setBlock: (x, y, z, val) => {
          if (inBounds(x, y, z)) blocks[index(x, y, z)] = val;
        },
      };
    };
  });

  test("should mark chunk as dirty after light update", () => {
    const mockChunk = createMockChunk();
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
    const mainChunk = createMockChunk();
    const neighborChunkXNeg = createMockChunk();
    const neighborChunkXPos = createMockChunk();

    const mockChunkManager = {
      getChunk: jest.fn().mockImplementation((chunkX, chunkZ) => {
        if (chunkX === 6 && chunkZ === 8) {
          return mainChunk;
        }

        if (chunkX === 5 && chunkZ === 8) {
          return neighborChunkXNeg;
        }

        if (chunkX === 7 && chunkZ === 8) {
          return neighborChunkXPos;
        }

        return null;
      }),
    };

    const mockBlockDefs = {
      getById: jest.fn().mockReturnValue(null),
    };

    // Trigger update at X boundary (localX = 0)
    // 96 = 6*16 + 0
    // 128 = 8*16 + 0
    lightSystem.updateLightOnBlockChange(
      mockChunkManager,
      96,
      64,
      128,
      mockBlockDefs,
    );

    expect(mainChunk.dirty).toBe(true);
    expect(neighborChunkXNeg.dirty).toBe(true);
  });

  test("should update all four neighbor chunks when at corner", () => {
    const mainChunk = createMockChunk();
    const neighborXNeg = createMockChunk();
    const neighborXPos = createMockChunk();
    const neighborZNeg = createMockChunk();
    const neighborZPos = createMockChunk();

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
    lightSystem.updateLightOnBlockChange(
      mockChunkManager,
      96,
      64,
      128,
      mockBlockDefs,
    );

    expect(mainChunk.dirty).toBe(true);
    expect(neighborXNeg.dirty).toBe(true);
    expect(neighborXPos.dirty).toBe(true);
    expect(neighborZNeg.dirty).toBe(true);
    expect(neighborZPos.dirty).toBe(true);
  });
});
