/**
 * @typedef {import('../state/state.mjs').GameState} GameState
 */

import { blocks as blockTypes } from "../state/config/blocks.mjs";
import { getBlock } from "../util/world.mjs";

/**
 * Updates the world state, applying physics to blocks.
 * @param {GameState} state
 * @returns {void}
 */
export function updateWorld(state) {
  const { world } = state;
  const changes = [];

  for (const [key, type] of world.entries()) {
    const block = blockTypes[type];
    if (block && block.gravity) {
      const [x, y, z] = key.split(",").map(Number);

      if (!getBlock(world, x, y - 1, z)) {
        changes.push({ from: key, to: { x, y: y - 1, z }, type });
      }
    }
  }

  for (const change of changes) {
    world.delete(change.from);
    world.set(`${change.to.x},${change.to.y},${change.to.z}`, change.type);
  }
}
