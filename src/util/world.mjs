/** @typedef {import('../state/chunkManager.mjs').ChunkManager} ChunkManager */

import { isSolid } from "./isSolid.mjs";

/**
 * Checks if a solid block exists at the given coordinates.
 * Non-solid blocks (water, flowers, leaves, etc.) are not considered obstacles.
 * The ground is considered to be solid at y<=0.
 *
 * @param {ChunkManager} world
 * @param {number} x
 * @param {number} y
 * @param {number} z
 *
 * @returns {boolean}
 */
export function getBlock(world, x, y, z) {
  return isSolid(world, x, y, z);
}
