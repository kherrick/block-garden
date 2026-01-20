/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock global Worker for Node environment
global.Worker = class {
  constructor() {}
  postMessage() {}
  terminate() {}
  onmessage() {}
};

// Mock dependencies
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
      this.generated = false;
      this.mesh = null;
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

    setBlock(x, y, z, type) {
      if (!this.inBounds(x, y, z)) return false;
      this.blocks[this.index(x, y, z)] = type;
      this.dirty = true;
      return true;
    }

    markModified(x, y, z, type) {
      if (!this.inBounds(x, y, z)) return;
      this.modifiedBlocks.set(this.index(x, y, z), type);
    }

    getModifications() {
      return this.modifiedBlocks;
    }

    applyModifications(mods) {
      for (const [idx, type] of mods) {
        this.blocks[idx] = type;
      }
      this.modifiedBlocks = new Map(mods);
      this.dirty = true;
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

const { ChunkManager } = await import("./chunkManager.mjs");
const { gameConfig } = await import("./config/index.mjs");

describe("Plant Persistence", () => {
  let manager;
  const generateChunk = jest.fn((chunk) => {
    chunk.generated = true;
  });
  const deleteChunkMesh = jest.fn();

  beforeEach(() => {
    manager = new ChunkManager();
    gameConfig.renderRadius.set(1);
    gameConfig.cacheRadius.set(2);
    generateChunk.mockClear();
    deleteChunkMesh.mockClear();
  });

  test("should persist plant growth timers and structures when chunk is unloaded", () => {
    const growthTimers = {};
    const plantStructures = {};

    // 1. Load chunk (0, 0)
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      deleteChunkMesh,
      growthTimers,
      plantStructures,
    );

    // 2. Add plant data for a block in chunk (0, 0) (world 5, 10, 5)
    const key = "5,10,5";
    growthTimers[key] = 10.5;
    plantStructures[key] = { type: "test_plant", blocks: [] };

    // 3. Move far away to unload (0, 0)
    manager.updateVisibleChunks(
      100,
      100,
      123,
      {},
      deleteChunkMesh,
      growthTimers,
      plantStructures,
    );

    // Verify chunk is unloaded
    expect(manager.getChunk(0, 0)).toBeUndefined();
    // Verify data is removed from active objects
    expect(growthTimers[key]).toBeUndefined();
    expect(plantStructures[key]).toBeUndefined();

    // Verify data is stored in manager
    const storedKey = "0,0";
    expect(manager.storedPlantStates.has(storedKey)).toBe(true);
    const stored = manager.storedPlantStates.get(storedKey);
    expect(stored.timers[key]).toBe(10.5);
    expect(stored.structures[key].type).toBe("test_plant");

    // 4. Move back to reload
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      deleteChunkMesh,
      growthTimers,
      plantStructures,
    );

    // Trigger restoration by marking chunk generated
    const chunk = manager.getChunk(0, 0);
    chunk.generated = true;

    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      deleteChunkMesh,
      growthTimers,
      plantStructures,
    );

    // Verify data is restored to active objects
    expect(growthTimers[key]).toBe(10.5);
    expect(plantStructures[key]).toBeDefined();
    expect(plantStructures[key].type).toBe("test_plant");

    // Verify stored data is cleared
    expect(manager.storedPlantStates.has(storedKey)).toBe(false);
  });
});
