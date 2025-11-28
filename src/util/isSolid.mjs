/** @typedef {import('../state/config/tiles.mjs').TileDefinition} TileDefinition */

/**
 * Tests whether a pixel position in world space is occupied by a solid tile.
 *
 * Returns true if position is out of bounds or on a solid tile (defensive behavior).
 *
 * @param {number} tileSize - Size of each tile in pixels
 * @param {Object} world - World object with getTile method
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} x - X-coordinate in pixels
 * @param {number} y - Y-coordinate in pixels
 *
 * @returns {boolean} True if position is solid or out of bounds, false if empty
 */
export function isSolid(tileSize, world, worldHeight, worldWidth, x, y) {
  // Defensive logging for debugging
  if (!world || typeof world.getTile !== "function") {
    console.error("isSolid: Invalid world object", {
      hasWorld: !!world,
      worldType: typeof world,
      hasGetTile: world ? typeof world.getTile : "N/A",
      args: { tileSize, worldHeight, worldWidth, x, y },
      stack: new Error().stack,
    });

    // Treat as solid to prevent crashes
    return true;
  }

  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);

  if (tileX < 0 || tileX >= worldWidth || tileY < 0 || tileY >= worldHeight) {
    return true;
  }

  const tile = world.getTile(tileX, tileY);

  return tile && tile.solid;
}
