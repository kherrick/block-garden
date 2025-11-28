/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {WorldMap} world - Signal State with world tile data
 * @param {number} x - Spring x coordinate
 * @param {number} surfaceY - Surface level y coordinate
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} worldHeight - Total world height in tiles
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {void}
 */
export function createSpring(
  world,
  x,
  surfaceY,
  worldWidth,
  worldHeight,
  tiles,
) {
  // Create a small water source
  const y = surfaceY;

  if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
    const tile = world.getTile(x, y);

    if (tile === tiles.AIR && tile.id !== tiles.SAND.id) {
      world.setTile(x, y, tiles.WATER);
    }
  }
}
