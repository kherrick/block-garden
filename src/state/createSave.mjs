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
  // Save world blocks
  const worldData = {};
  world.forEach((type, key) => {
    const [x, y, z] = key.split(",").map(Number);

    if (!worldData[x]) {
      worldData[x] = {};
    }

    if (!worldData[x][z]) {
      worldData[x][z] = {};
    }

    worldData[x][z][y] = type;
  });

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
