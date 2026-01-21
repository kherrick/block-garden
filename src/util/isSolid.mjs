/** @typedef {import('../state/chunkManager.mjs').ChunkManager} ChunkManager */
/** @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition */

import { getBlockById } from "../state/config/blocks.mjs";

/**
 * Tests whether a block at a given world position is solid.
 *
 * Returns true if position is out of bounds or on a solid block (defensive behavior).
 * Non-solid blocks (water, flowers, leaves, etc.) return false allowing player passage.
 *
 * @param {ChunkManager} world - ChunkManager instance
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 *
 * @returns {boolean} True if position is solid or out of bounds, false if non-solid or air
 */
export function isSolid(world, x, y, z) {
  // Out of bounds above world = treat as solid (ceiling)
  if (y >= 256) {
    return true;
  }

  // Bottom boundary is always solid
  if (y <= 0) {
    return true;
  }

  const blockType = world.getBlock(x, y, z);

  // Air = not solid
  if (blockType === 0) {
    return false;
  }

  const blockDef = getBlockById(blockType);

  // Unknown block type = treat as non-solid to be safe
  if (!blockDef) {
    return false;
  }

  return blockDef.solid || false;
}
