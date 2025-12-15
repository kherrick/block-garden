/**
 * Get the count of planted structures nearby the player
 *
 * @param {Object} plantStructures - State Signal containing all plant structures
 * @param {number} playerX - playerX coordinate in tiles
 * @param {number} playerY - playerY coordinate in tiles
 * @param {number} radius
 *
 * @returns {number} count of plants nearby the player
 */
export const countNearbyPlanted = (
  plantStructures,
  playerX,
  playerY,
  radius = 3,
) => {
  let count = 0;

  for (const key of Object.keys(plantStructures)) {
    const [x, y] = key.split(",").map(Number);
    const dx = Math.abs(playerX - x);
    const dy = Math.abs(playerY - y);

    if (dx <= radius && dy <= radius) {
      count++;
    }
  }

  return count;
};
