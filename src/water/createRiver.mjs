/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {WorldMap} world - Signal State with world tile data
 * @param {number} x - Starting x coordinate
 * @param {number} surfaceY - Surface level y coordinate
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} worldHeight - Total world height in tiles
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {void}
 */
export function createRiver(
  world,
  x,
  surfaceY,
  worldWidth,
  worldHeight,
  tiles,
) {
  // Create a shallow river
  const riverY = surfaceY + 1;

  if (x >= 0 && x < worldWidth && riverY >= 0 && riverY < worldHeight) {
    if (world.getTile(x, riverY).id !== tiles.SAND.id) {
      world.setTile(x, riverY, tiles.WATER);
    }

    // Add a bit of depth
    const riverY2 = surfaceY + 2;

    if (riverY2 < worldHeight && Math.random() < 0.7) {
      if (world.getTile(x, riverY2).id !== tiles.SAND.id) {
        world.setTile(x, riverY2, tiles.WATER);
      }
    }
  }
}
