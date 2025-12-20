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
export function createSaveState(world) {
  const saveData = {};

  // Use the Map-compatible forEach to iterate all blocks
  world.forEach((type, key) => {
    const [x, y, z] = key.split(",").map(Number);
    if (!saveData[x]) {
      saveData[x] = {};
    }

    if (!saveData[x][z]) {
      saveData[x][z] = {};
    }

    saveData[x][z][y] = type;
  });

  return saveData;
}
