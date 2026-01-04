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
          const blockId = chunk.getBlock(x, y, z);
          const worldX = baseX + x;
          const worldZ = baseZ + z;

          // Skip air blocks (id 0) to keep save file small
          if (blockId === 0) {
            continue;
          }

          if (!worldData[worldX]) {
            worldData[worldX] = {};
          }

          if (!worldData[worldX][worldZ]) {
            worldData[worldX][worldZ] = {};
          }

          // Save block ID for later restoration
          worldData[worldX][worldZ][y] = blockId;
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

  // Prepare stored chunks for save (merge currently loaded chunks' modifications)
  const storedChunksData = {};

  // 1. Add modifications from unloaded chunks
  for (const [key, mods] of world.storedChunks) {
    storedChunksData[key] = Object.fromEntries(mods);
  }

  // 2. Add modifications from loaded chunks
  for (const chunk of world.getAllChunks()) {
    const mods = chunk.getModifications();
    if (mods.size > 0) {
      const key = world.getChunkKey(chunk.chunkX, chunk.chunkZ);
      storedChunksData[key] = Object.fromEntries(mods);
    }
  }

  // 3. Add stored plant states
  const storedPlantStatesData = {};
  for (const [key, state] of world.storedPlantStates) {
    storedPlantStatesData[key] = state;
  }

  return {
    config: {
      seed: seed,
      version:
        typeof config?.version?.get === "function"
          ? config.version.get()
          : (config?.version ?? null),
      terrainOctaves: config.terrainOctaves?.get
        ? config.terrainOctaves.get()
        : 4,
      mountainScale: config.mountainScale?.get
        ? config.mountainScale.get()
        : 50,
      decorationDensity: config.decorationDensity?.get
        ? config.decorationDensity.get()
        : 100,
      caveThreshold: config.caveThreshold?.get
        ? config.caveThreshold.get()
        : 55,
      useCaves: config.useCaves?.get ? config.useCaves.get() : true,
      cloudDensity: config.cloudDensity?.get ? config.cloudDensity.get() : 100,
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
      growthTimers: state?.growthTimers ?? null,
      plantStructures: state?.plantStructures ?? null,
    },
    world: worldData,
    storedChunks: storedChunksData,
    storedPlantStates: storedPlantStatesData,
  };
}
