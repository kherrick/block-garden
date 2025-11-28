/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */

/**
 * @param {WorldMap} world - Signal State with world tile data
 * @param {number} centerX - Lake center x coordinate
 * @param {number} surfaceY - Surface level y coordinate
 * @param {number} size - Approximate lake size in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} worldHeight - Total world height in tiles
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {void}
 */
export function createLake(
  world,
  centerX,
  surfaceY,
  size,
  worldWidth,
  worldHeight,
  tiles,
) {
  const radius = Math.floor(size / 2);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = 0; dy <= Math.floor(size * 0.3); dy++) {
      const x = centerX + dx;
      const y = surfaceY + dy + 1;

      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        // Flatten vertically
        const distance = Math.sqrt(dx * dx + dy * dy * 2);

        if (distance <= radius) {
          // Clear out space for lake
          if (world.getTile(x, y).id !== tiles.SAND.id) {
            world.setTile(x, y, tiles.WATER);
          }
        }
      }
    }
  }
}
