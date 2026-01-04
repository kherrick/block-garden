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
      if (!this.inBounds(x, y, z)) return 0;
      return this.blocks[this.index(x, y, z)];
    }

    setBlock(x, y, z, blockId) {
      if (!this.inBounds(x, y, z)) return false;
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
      world: {},
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

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
      world: {},
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
        plantStructures: { "0,0": { blocks: [1, 2, 3] } },
        growthTimers: { "0,0": 100 },
      },
      world: {},
      storedChunks: {},
      storedPlantStates: {},
    };

    await loadSaveState(globalThis, globalThis.shadow, saveState);

    expect(mockGameState.plantStructures).toEqual({
      "0,0": { blocks: [1, 2, 3] },
    });
    expect(mockGameState.growthTimers).toEqual({ "0,0": 100 });
  });

  test("should restore stored chunk modifications", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {},
      world: {},
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

    await loadSaveState(globalThis, globalThis.shadow, oldFormatSaveState);

    // Should load blocks even from old format
    expect(mockWorld.set).toHaveBeenCalledWith("0,10,0", 2);
    expect(mockWorld.set).toHaveBeenCalledWith("5,15,5", 1);
  });

  test("should dispatch reset event when loading completes", async () => {
    const saveState = {
      config: { seed: 12345, version: 1 },
      state: {},
      world: {},
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
});
