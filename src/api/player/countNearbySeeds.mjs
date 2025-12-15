/** @typedef {import('../../map/world.mjs').WorldMap} WorldMap */

/**
 * Get the count of seeds nearby the player
 *
 * @param {WorldMap} world
 *
 * @param {number} playerX
 * @param {number} playerY
 * @param {number} radius
 *
 * @returns {number} - count of seeds nearby the player
 */
export const countNearbySeeds = (world, playerX, playerY, radius = 3) => {
  let count = 0;

  for (let y = playerY - radius; y <= playerY + radius; y++) {
    for (let x = playerX - radius; x <= playerX + radius; x++) {
      const tile = world.getTile(x, y);

      if (tile && tile.isSeed) {
        count++;
      }
    }
  }

  return count;
};
