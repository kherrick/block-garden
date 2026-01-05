/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

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
      this.generated = false;
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

    get worldX() {
      return this.chunkX * CHUNK_SIZE_X;
    }

    get worldZ() {
      return this.chunkZ * CHUNK_SIZE_Z;
    }
  }

  return {
    Chunk: MockChunk,
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
  };
});

const { createSaveState } = await import("./createSave.mjs");
const { Chunk, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } =
  await import("../util/chunk.mjs");

describe("createSaveState", () => {
  let mockChunk1;
  let mockChunk2;
  let mockWorld;

  beforeEach(() => {
    // Create mock chunks at different positions
    mockChunk1 = new Chunk(0, 0); // Chunk at world (0, 0)
    mockChunk2 = new Chunk(1, 0); // Chunk at world (16, 0)

    // Set some blocks with block IDs
    mockChunk1.setBlock(0, 10, 0, 2); // Dirt (id: 2)
    mockChunk1.setBlock(5, 15, 5, 1); // Grass (id: 1)
    mockChunk2.setBlock(0, 20, 0, 3); // Stone (id: 3)

    // Mock ChunkManager
    mockWorld = {
      getAllChunks: jest.fn(() => [mockChunk1, mockChunk2]),
      storedChunks: new Map(),
      storedPlantStates: new Map(),
    };
  });

  test("should save blocks with their block IDs, not array indices", () => {
    const gThis = {
      blockGarden: {
        state: { seed: 12345 },
        config: { version: 1 },
      },
    };

    const saveState = createSaveState(mockWorld, gThis);

    // Verify blocks are saved with their IDs
    expect(saveState.world[0][0][10]).toBe(2); // Dirt at (0, 10, 0)
    expect(saveState.world[5][5][15]).toBe(1); // Grass at (5, 15, 5)
    expect(saveState.world[16][0][20]).toBe(3); // Stone at (16, 20, 0)
  });

  test("should skip air blocks (id 0) to minimize save file size", () => {
    const gThis = {
      blockGarden: {
        state: { seed: 12345 },
        config: { version: 1 },
      },
    };

    // Set an air block explicitly
    mockChunk1.setBlock(1, 10, 0, 0); // Air

    const saveState = createSaveState(mockWorld, gThis);

    // Air block at (1, 10, 0) should not be in save state
    expect(saveState.world[1]?.[0]?.[10]).toBeUndefined();
  });

  test("should save seed and version information", () => {
    const gThis = {
      blockGarden: {
        state: { seed: 99999 },
        config: { version: 2 },
      },
    };

    const saveState = createSaveState(mockWorld, gThis);

    expect(saveState.config.seed).toBe(99999);
    expect(saveState.config.version).toBe(2);
  });

  test("should handle missing state/config gracefully", () => {
    const gThis = {
      blockGarden: {
        state: {},
        config: {},
      },
    };

    const saveState = createSaveState(mockWorld, gThis);

    expect(saveState.config.seed).toBeNull();
    expect(saveState.config.version).toBeNull();
    expect(saveState.state.x).toBeNull();
    expect(saveState.state.y).toBeNull();
  });

  test("should create nested structure for world data", () => {
    const gThis = {
      blockGarden: {
        state: { seed: 12345 },
        config: { version: 1 },
      },
    };

    const saveState = createSaveState(mockWorld, gThis);

    // Should have nested objects: world[x][z][y] = blockId
    expect(typeof saveState.world).toBe("object");
    expect(typeof saveState.world[0]).toBe("object");
    expect(typeof saveState.world[0][0]).toBe("object");
    expect(typeof saveState.world[0][0][10]).toBe("number");
  });
});
