/**
 * Check if a position is solid
 *
 * @param {any} tileSize
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} x
 * @param {any} y
 *
 * @returns {any}
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
