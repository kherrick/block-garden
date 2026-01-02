/**
 * @typedef {import('../state/chunkManager.mjs').ChunkManager} ChunkManager
 */

/**
 * Checks if a block exists at the given coordinates.
 * The ground is considered to be at y<=0.
 *
 * @param {ChunkManager} world
 * @param {number} x
 * @param {number} y
 * @param {number} z
 *
 * @returns {boolean}
 */
export function getBlock(world, x, y, z) {
  if (y <= 0) {
    return true;
  }

  // Use ChunkManager's hasBlock method
  return world.hasBlock(Math.floor(x), Math.floor(y), Math.floor(z));
}
