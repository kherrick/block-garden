/**
 * @jest-environment node
 */
import {
  Chunk,
  worldToChunk,
  chunkToWorld,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  CHUNK_VOLUME,
} from "./chunk.mjs";

describe("Chunk class", () => {
  test("constructor initializes properties", () => {
    const chunk = new Chunk(2, 3);
    expect(chunk.chunkX).toBe(2);
    expect(chunk.chunkZ).toBe(3);
    expect(chunk.blocks.length).toBe(CHUNK_VOLUME);
    expect(chunk.dirty).toBe(true);
    expect(chunk.mesh).toBeNull();
  });

  test("index() computes correct array index", () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.index(0, 0, 0)).toBe(0);
    expect(chunk.index(1, 0, 0)).toBe(1);
    expect(chunk.index(0, 1, 0)).toBe(CHUNK_SIZE_X * CHUNK_SIZE_Z);
    expect(chunk.index(0, 0, 1)).toBe(CHUNK_SIZE_X);
  });

  test("inBounds() returns true for valid and false for invalid coords", () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.inBounds(0, 0, 0)).toBe(true);
    expect(
      chunk.inBounds(CHUNK_SIZE_X - 1, CHUNK_SIZE_Y - 1, CHUNK_SIZE_Z - 1),
    ).toBe(true);
    expect(chunk.inBounds(-1, 0, 0)).toBe(false);
    expect(chunk.inBounds(0, -1, 0)).toBe(false);
    expect(chunk.inBounds(0, 0, -1)).toBe(false);
    expect(chunk.inBounds(CHUNK_SIZE_X, 0, 0)).toBe(false);
    expect(chunk.inBounds(0, CHUNK_SIZE_Y, 0)).toBe(false);
    expect(chunk.inBounds(0, 0, CHUNK_SIZE_Z)).toBe(false);
  });

  test("getBlock() returns 0 for out-of-bounds and correct value for in-bounds", () => {
    const chunk = new Chunk(0, 0);
    chunk.blocks[chunk.index(1, 2, 3)] = 5;
    expect(chunk.getBlock(1, 2, 3)).toBe(5);
    expect(chunk.getBlock(-1, 0, 0)).toBe(0);
    expect(chunk.getBlock(0, -1, 0)).toBe(0);
    expect(chunk.getBlock(0, 0, -1)).toBe(0);
    expect(chunk.getBlock(CHUNK_SIZE_X, 0, 0)).toBe(0);
    expect(chunk.getBlock(0, CHUNK_SIZE_Y, 0)).toBe(0);
    expect(chunk.getBlock(0, 0, CHUNK_SIZE_Z)).toBe(0);
  });

  test("setBlock() sets value and marks dirty", () => {
    const chunk = new Chunk(0, 0);
    const result = chunk.setBlock(1, 2, 3, 7);
    expect(result).toBe(true);
    expect(chunk.getBlock(1, 2, 3)).toBe(7);
    expect(chunk.dirty).toBe(true);
  });

  test("setBlock() returns false for out-of-bounds", () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.setBlock(-1, 0, 0, 1)).toBe(false);
    expect(chunk.setBlock(0, -1, 0, 1)).toBe(false);
    expect(chunk.setBlock(0, 0, -1, 1)).toBe(false);
    expect(chunk.setBlock(CHUNK_SIZE_X, 0, 0, 1)).toBe(false);
    expect(chunk.setBlock(0, CHUNK_SIZE_Y, 0, 1)).toBe(false);
    expect(chunk.setBlock(0, 0, CHUNK_SIZE_Z, 1)).toBe(false);
  });

  test("isEmpty() returns true for empty and false for non-empty", () => {
    const chunk = new Chunk(0, 0);
    expect(chunk.isEmpty()).toBe(true);
    chunk.setBlock(1, 2, 3, 1);
    expect(chunk.isEmpty()).toBe(false);
  });

  test("clear() resets all blocks to 0 and marks dirty", () => {
    const chunk = new Chunk(0, 0);
    chunk.setBlock(1, 2, 3, 1);
    chunk.clear();
    expect(chunk.isEmpty()).toBe(true);
    expect(chunk.dirty).toBe(true);
  });

  test("worldX and worldZ getters return correct world coordinates", () => {
    const chunk = new Chunk(2, 3);
    expect(chunk.worldX).toBe(2 * CHUNK_SIZE_X);
    expect(chunk.worldZ).toBe(3 * CHUNK_SIZE_Z);
  });
});

describe("worldToChunk and chunkToWorld", () => {
  test("worldToChunk returns correct chunk and local coordinates", () => {
    const { chunkX, chunkZ, localX, localZ } = worldToChunk(33, 45);
    expect(chunkX).toBe(Math.floor(33 / CHUNK_SIZE_X));
    expect(chunkZ).toBe(Math.floor(45 / CHUNK_SIZE_Z));
    expect(localX).toBe(((33 % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X);
    expect(localZ).toBe(((45 % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z);
  });

  test("chunkToWorld returns correct world coordinates", () => {
    const chunkX = 2,
      chunkZ = 3,
      localX = 5,
      localZ = 7;
    const { worldX, worldZ } = chunkToWorld(chunkX, chunkZ, localX, localZ);
    expect(worldX).toBe(chunkX * CHUNK_SIZE_X + localX);
    expect(worldZ).toBe(chunkZ * CHUNK_SIZE_Z + localZ);
  });
});
