/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock Signal class
class MockSignal {
  constructor(value) {
    this.value = value;
  }

  get() {
    return this.value;
  }

  set(value) {
    this.value = value;
  }
}

// Mock the chunk module
jest.unstable_mockModule("../util/chunk.mjs", () => {
  const CHUNK_SIZE_X = 16;
  const CHUNK_SIZE_Y = 128;
  const CHUNK_SIZE_Z = 16;
  const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

  class MockChunk {
    constructor(chunkX, chunkZ) {
      this.chunkX = chunkX;
      this.chunkZ = chunkZ;
      this.blocks = new Uint8Array(CHUNK_VOLUME);
      this.dirty = true;
      this.modifiedBlocks = new Map();
    }

    index(x, y, z) {
      return x + z * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
    }

    inBounds(x, y, z) {
      return (
        x >= 0 &&
        x < CHUNK_SIZE_X &&
        y >= 0 &&
        y < CHUNK_SIZE_Y &&
        z >= 0 &&
        z < CHUNK_SIZE_Z
      );
    }

    getBlock(x, y, z) {
      if (!this.inBounds(x, y, z)) {
        return 0;
      }

      return this.blocks[this.index(x, y, z)];
    }

    setBlock(x, y, z, blockId) {
      if (!this.inBounds(x, y, z)) {
        return false;
      }

      this.blocks[this.index(x, y, z)] = blockId;
      this.dirty = true;

      return true;
    }

    getModifications() {
      return this.modifiedBlocks;
    }
  }

  return {
    Chunk: MockChunk,
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
    worldToChunk: (worldX, worldZ) => {
      const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
      const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);
      const localX = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const localZ = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

      return { chunkX, chunkZ, localX, localZ };
    },
  };
});

// Mock noise initialization
jest.unstable_mockModule("../util/noise.mjs", () => ({
  initNoise: jest.fn(),
}));

// Mock globalThis utilities
globalThis.Object = Object;

const { loadSaveState } = await import("./loadSave.mjs");
const { Chunk, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } =
  await import("../util/chunk.mjs");

describe("loadSaveState", () => {
  let mockGameState;
  let mockWorld;

  beforeEach(() => {
    // Create mock world with set method
    mockWorld = {
      set: jest.fn(),
      clear: jest.fn(),
      get: jest.fn((key) => {
        // Return falsy for all blocks (simulating no blocks)
        return null;
      }),
      getChunk: jest.fn(() => ({ generated: false, restored: false })),
      storedChunks: new Map(),
      storedPlantStates: new Map(),
    };

    // Create mock game state
    mockGameState = {
      seed: null,
      x: 0,
      y: 0,
      z: 0,
      dx: 0,
      dy: 0,
      dz: 0,
      onGround: false,
      inventory: {},
      curBlock: new MockSignal(0),
      world: mockWorld,
      plantStructures: {},
      growthTimers: {},
    };

    // Mock globalThis.blockGarden
    globalThis.blockGarden = {
      state: mockGameState,
      config: {},
    };

    // Mock shadow
    globalThis.shadow = {
      dispatchEvent: jest.fn(),
    };
  });

  test("should return false for null or undefined save state", async () => {
    const result = await loadSaveState(globalThis, globalThis.shadow, null);

    expect(result).toBe(false);
  });

  test("should return false for empty world data", async () => {
    const saveState = {
      config: { seed: 12345 },
      state: { x: 0, y: 0, z: 0 },
      world: {},
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(false);
  });

  test("should return false for world data with columns but no blocks", async () => {
    const saveState = {
      world: { 0: { 0: {} } },
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(false);
  });

  test("should return false for package.json-like structure", async () => {
    const saveState = {
      name: "block-garden",
      version: "1.0.0",
      dependencies: {
        localforage: "^1.10.0",
      },
      scripts: {
        start: "npm start",
      },
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(false);
  });

  test("should return false for 3-level nested non-game JSON", async () => {
    const saveState = {
      metadata: {
        tags: [{ id: "tag1", value: "foo" }],
      },
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(false);
  });

  test("should return true for valid world data", async () => {
    const saveState = {
      world: { 0: { 0: { 10: 1 } } },
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(true);
  });

  test("should load blocks with their block IDs", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {
        x: 5,
        y: 10,
        z: 15,
        inventory: { dirt: 10 },
        curBlock: 2,
      },
      world: {
        0: { 0: { 10: 2 } }, // Dirt at (0, 0, 10)
        5: { 5: { 15: 1 } }, // Grass at (5, 5, 15)
        16: { 0: { 20: 3 } }, // Stone at (16, 0, 20)
      },
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    // Verify blocks are loaded with their IDs
    expect(mockWorld.set).toHaveBeenCalledWith("0,10,0", 2); // Dirt
    expect(mockWorld.set).toHaveBeenCalledWith("5,15,5", 1); // Grass
    expect(mockWorld.set).toHaveBeenCalledWith("16,20,0", 3); // Stone
  });

  test("should restore player position from save state", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {
        x: 50,
        y: 60,
        z: 70,
        dx: 1,
        dy: -0.5,
        dz: 0.2,
        onGround: true,
        inventory: { stone: 20 },
        curBlock: 3,
      },
      world: { 0: { 0: { 0: 1 } } },
      storedChunks: {},
      storedPlantStates: {},
    };

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      saveState,
    );

    expect(result).toBe(true);
    expect(mockGameState.x).toBe(50);
    expect(mockGameState.y).toBe(60);
    expect(mockGameState.z).toBe(70);
    expect(mockGameState.dx).toBe(1);
    expect(mockGameState.dy).toBe(-0.5);
    expect(mockGameState.dz).toBe(0.2);
    expect(mockGameState.onGround).toBe(true);
    expect(mockGameState.inventory).toEqual({ stone: 20 });
    expect(mockGameState.curBlock.get()).toBe(3);
  });

  test("should initialize empty inventory if missing from save", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {
        // No inventory field
      },
      world: { 0: { 0: { 0: 1 } } },
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    expect(mockGameState.inventory).toEqual({});
  });

  test("should initialize plant structures and growth timers", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {
        plantStructures: { "0,0,0": { blocks: [1, 2, 3] } },
        growthTimers: { "0,0,0": 100 },
      },
      world: { 0: { 0: { 0: 1 } } },
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    // Verify plants are put into storedPlantStates for future restoration
    expect(mockGameState.plantStructures).toEqual({});
    expect(mockGameState.growthTimers).toEqual({});

    expect(mockWorld.storedPlantStates.has("0,0")).toBe(true);

    const stored = mockWorld.storedPlantStates.get("0,0");
    expect(stored.structures["0,0,0"]).toEqual({ blocks: [1, 2, 3] });
    expect(stored.timers["0,0,0"]).toBe(100);
  });

  test("should restore stored chunk modifications", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {},
      world: { 0: { 0: { 0: 1 } } },
      storedChunks: {
        "1,0": {
          100: 2,
          200: 1,
        },
      },
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    // Verify stored chunks were restored
    expect(mockWorld.storedChunks.has("1,0")).toBe(true);

    const mods = mockWorld.storedChunks.get("1,0");
    expect(mods.get(100)).toBe(2);
    expect(mods.get(200)).toBe(1);
  });

  test("should handle loading from old save format (direct world data)", async () => {
    const oldFormatSaveState = {
      0: { 0: { 10: 2 } }, // Old format: direct world data
      5: { 5: { 15: 1 } },
    };

    // This tests backward compatibility - loadSaveState should handle
    // both new format (with config/state/world fields) and old format

    const result = await loadSaveState(
      globalThis,
      globalThis.shadow,
      oldFormatSaveState,
    );

    expect(result).toBe(true);

    // Should load blocks even from old format
    expect(mockWorld.set).toHaveBeenCalledWith("0,10,0", 2);
    expect(mockWorld.set).toHaveBeenCalledWith("5,15,5", 1);
  });

  test("should dispatch reset event when loading completes", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {},
      world: { 0: { 0: { 0: 1 } } },
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    expect(globalThis.shadow.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "block-garden-reset",
      }),
    );
  });

  test("should clamp generation settings to valid ranges", async () => {
    const saveState = {
      config: {
        terrainOctaves: 20, // Should be clamped to 8
        mountainScale: 500, // Should be clamped to 100
        decorationDensity: -50, // Should be clamped to 0
        cloudDensity: 150, // Should be clamped to 100
        seed: Number.MAX_SAFE_INTEGER + 1000, // Should be clamped to MAX_SAFE_INTEGER
      },
      world: { 0: { 0: { 0: 1 } } },
    };

    const configSignals = {
      terrainOctaves: new MockSignal(0),
      mountainScale: new MockSignal(0),
      decorationDensity: new MockSignal(0),
      cloudDensity: new MockSignal(0),
      caveThreshold: new MockSignal(0),
      useCaves: new MockSignal(true),
    };

    globalThis.blockGarden.config = configSignals;

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    expect(configSignals.terrainOctaves.get()).toBe(8);
    expect(configSignals.mountainScale.get()).toBe(100);
    expect(configSignals.decorationDensity.get()).toBe(0);
    expect(configSignals.cloudDensity.get()).toBe(100);
    expect(mockGameState.seed).toBe(Number.MAX_SAFE_INTEGER);
  });
});
