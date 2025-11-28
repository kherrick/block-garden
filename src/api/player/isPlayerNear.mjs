/**
 * Player position data
 *
 * @typedef {import("../../state/state.mjs").PlayerPositionData} PlayerPositionData
 */

/**
 * Checks if a player is within a specified tile radius of a target location.
 *
 * Uses tile coordinates for distance calculation.
 *
 * @param {number} targetX - Target X position in tiles
 * @param {number} targetY - Target Y position in tiles
 * @param {number} [radius=5] - Search radius in tiles
 * @param {PlayerPositionData|null} [pos=null] - Player position data from getPlayerPosition
 *
 * @returns {boolean} True if player is within radius of target, false otherwise
 *
 * @example
 * const playerPos = getPlayerPosition(player, tileSize, worldH, worldW);
 * if (isPlayerNear(100, 50, 10, playerPos)) {
 *   // Player is within 10 tiles of position (100, 50)
 * }
 */
export function isPlayerNear(targetX, targetY, radius = 5, pos = null) {
  if (!pos) {
    return false;
  }

  const dx = Math.abs(pos.tile.x - targetX);
  const dy = Math.abs(pos.tile.y - targetY);

  return dx <= radius && dy <= radius;
}
