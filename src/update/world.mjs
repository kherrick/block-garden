/**
 * @typedef {import('../state/state.mjs').GameState} GameState
 */

import { getBlockById } from "../state/config/blocks.mjs";

/** Maximum gravity updates per frame to prevent CPU spikes */
const GRAVITY_UPDATES_PER_FRAME = 200;

/** Maximum distance (in blocks) from player for gravity processing */
const GRAVITY_ACTIVE_RADIUS = 64;

/**
 * Check if a position is within the active gravity region around the player.
 *
 * @param {number} x - Block X
 * @param {number} z - Block Z
 * @param {number} playerX - Player X
 * @param {number} playerZ - Player Z
 * @returns {boolean}
 */
function isInActiveRegion(x, z, playerX, playerZ) {
  const dx = Math.abs(x - playerX);
  const dz = Math.abs(z - playerZ);
  return dx <= GRAVITY_ACTIVE_RADIUS && dz <= GRAVITY_ACTIVE_RADIUS;
}

/**
 * Updates the world state, applying physics to blocks.
 *
 * Uses a gravity candidate queue instead of iterating all blocks.
 * Only processes blocks within the active region around the player.
 *
 * @param {GameState} state
 * @returns {void}
 */
export function updateWorld(state) {
  const { world, x: playerX, z: playerZ } = state;
  const gravityQueue = world.gravityQueue;

  if (!gravityQueue || gravityQueue.size === 0) {
    return;
  }

  // Dequeue candidates up to the per-frame budget
  const candidates = gravityQueue.dequeue(GRAVITY_UPDATES_PER_FRAME);
  const changes = [];

  for (const candidate of candidates) {
    const { x, y, z } = candidate;

    // Skip if outside active region
    if (!isInActiveRegion(x, z, playerX, playerZ)) {
      // Re-enqueue for later when player is nearby
      gravityQueue.enqueue(x, y, z);
      continue;
    }

    // Verify block still exists and still has gravity
    const type = world.getBlock(x, y, z);
    if (type === 0) {
      continue; // Block was removed
    }

    const blockDef = getBlockById(type);
    if (!blockDef || !blockDef.gravity) {
      continue; // No longer a gravity block
    }

    // Check block below
    const belowType = world.getBlock(x, y - 1, z);
    if (belowType === 0) {
      // Block below is air - schedule the move
      changes.push({ x, y, z, type });
    }
    // If not air, block is resting - no action needed
  }

  // Apply all changes (delete then set to avoid conflicts)
  for (const change of changes) {
    const { x, y, z, type } = change;

    // Delete from current position (don't trigger player-modified)
    world.setBlock(x, y, z, 0);

    // Set at new position (don't trigger player-modified)
    world.setBlock(x, y - 1, z, type);

    // Re-enqueue at new position for continued falling
    gravityQueue.enqueue(x, y - 1, z);

    // Check if any gravity blocks were above the old position
    const aboveType = world.getBlock(x, y + 1, z);
    if (aboveType !== 0) {
      const aboveDef = getBlockById(aboveType);
      if (aboveDef && aboveDef.gravity) {
        gravityQueue.enqueue(x, y + 1, z);
      }
    }
  }
}
