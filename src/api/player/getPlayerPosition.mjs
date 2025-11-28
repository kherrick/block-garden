/** @typedef {import('../../state/state.mjs').Player} Player */
/** @typedef {import('../../state/state.mjs').PlayerPositionData} PlayerPositionData */

/**
 * Calculates player position in multiple coordinate systems.
 *
 * Converts pixel position to tile, normalized (0-1), and descriptive location.
 * Useful for map rendering, UI updates, and boundary detection.
 *
 * @param {Player} player - Player object with x, y, width, height
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {PlayerPositionData} Comprehensive position data in multiple formats
 */
export function getPlayerPosition(player, tileSize, worldHeight, worldWidth) {
  // Get pixel position
  const pixelX = player.x;
  const pixelY = player.y;

  // Calculate tile position (center of player sprite)
  const tileX = Math.floor((pixelX + player.width / 2) / tileSize);
  const tileY = Math.floor((pixelY + player.height / 2) / tileSize);

  // Calculate normalized position (0.0 to 1.0)
  const normalizedX = tileX / worldWidth;
  const normalizedY = tileY / worldHeight;

  // Determine general location
  const location = {
    horizontal:
      normalizedX < 0.33 ? "left" : normalizedX > 0.66 ? "right" : "center",
    vertical:
      normalizedY < 0.33 ? "top" : normalizedY > 0.66 ? "bottom" : "middle",
  };

  return {
    pixel: { x: pixelX, y: pixelY },
    tile: { x: tileX, y: tileY },
    normalized: { x: normalizedX, y: normalizedY },
    location: location,
    bounds: {
      isAtLeft: tileX < 5,
      isAtRight: tileX > worldWidth - 5,
      isAtTop: tileY < 5,
      isAtBottom: tileY > worldHeight - 5,
    },
  };
}
