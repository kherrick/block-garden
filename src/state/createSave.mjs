import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "../util/chunk.mjs";

/**
 * @typedef {import('./chunkManager.mjs').ChunkManager} ChunkManager
 */

/**
 * Creates a save file from chunk-based world storage.
 *
 * @param {ChunkManager} world - The chunk manager
 *
 * @returns {Object} Serializable save file
 */
export function createSaveState(world, gThis) {
  // Save world blocks from all loaded chunks (including air blocks where player dug)
  const worldData = {};

  for (const chunk of world.getAllChunks()) {
    const baseX = chunk.worldX;
    const baseZ = chunk.worldZ;

    // Iterate through all blocks in the chunk
    for (let y = 1; y < CHUNK_SIZE_Y; y++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
          const type = chunk.getBlock(x, y, z);
          const worldX = baseX + x;
          const worldZ = baseZ + z;

          // Skip air blocks to keep save file small
          if (type === 0) {
            continue;
          }

          if (!worldData[worldX]) {
            worldData[worldX] = {};
          }

          if (!worldData[worldX][worldZ]) {
            worldData[worldX][worldZ] = {};
          }

          worldData[worldX][worldZ][y] = type;
        }
      }
    }
  }

  // Try to get state/config from gThis, fallback to globalThis, fallback to empty
  let state = gThis?.blockGarden?.state;
  let config = gThis?.blockGarden?.config;
  if (
    !state &&
    typeof globalThis !== "undefined" &&
    globalThis.blockGarden?.state
  ) {
    state = globalThis.blockGarden.state;
  }

  if (
    !config &&
    typeof globalThis !== "undefined" &&
    globalThis.blockGarden?.config
  ) {
    config = globalThis.blockGarden.config;
  }

  // Only use state/config for seed
  const seed = state?.seed ?? config?.seed ?? null;

  return {
    config: {
      seed: seed,
      version: config?.version ?? null,
    },
    state: {
      x: state?.x ?? null,
      y: state?.y ?? null,
      z: state?.z ?? null,
      dx: state?.dx ?? null,
      dy: state?.dy ?? null,
      dz: state?.dz ?? null,
      onGround: state?.onGround ?? null,
      inventory: state?.inventory ?? null,
      curBlock: state?.curBlock?.get
        ? state.curBlock.get()
        : (state?.curBlock ?? null),
    },
    world: worldData,
  };
}
