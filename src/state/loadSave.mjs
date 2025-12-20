/**
 * @typedef {import('./chunkManager.mjs').ChunkManager} ChunkManager
 */

/**
 * Restores world state from a save file.
 *
 * Reconstructs block data into chunk-based storage.
 * Updates all Signal values to restore previous game state.
 *
 * @param {typeof globalThis} gThis - Global this or window object with blockGarden property
 * @param {File} file
 * @param {ChunkManager} world - Chunk manager to populate
 *
 * @returns {Promise<ChunkManager>}
 */
export async function loadSaveState(gThis, file, world) {
  const gzipStream = file
    .stream()
    .pipeThrough(new gThis.DecompressionStream("gzip"));

  const jsonText = await new gThis.Response(gzipStream).text();
  const saveData = gThis.JSON.parse(jsonText);

  // Clear existing world
  world.clear();

  // Populate chunks from save data
  gThis.Object.entries(saveData).forEach(([x, xz]) => {
    gThis.Object.entries(xz).forEach(([z, ys]) => {
      gThis.Object.entries(ys).forEach(([y, type]) => {
        // Use ChunkManager's set method (Map-compatible interface)
        world.set(`${x},${y},${z}`, type);
      });
    });
  });

  console.log("Save state loaded successfully");

  return world;
}
