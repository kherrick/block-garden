/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateCactusStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CACTUS_GROWING });

    return blocks;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Main body (vertical column)
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CACTUS_BODY });
  }

  // Add left arm when sufficiently grown
  if (progress > 0.4 && currentHeight > 2) {
    const leftArmY = y - Math.floor(currentHeight * 0.6);
    blocks.push({ x: x - 1, y: leftArmY, tile: tiles.CACTUS_BODY });

    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: leftArmY - 1, tile: tiles.CACTUS_BODY });
    }
  }

  // Add right arm
  if (progress > 0.5 && currentHeight > 3) {
    const rightArmY = y - Math.floor(currentHeight * 0.7);
    blocks.push({ x: x + 1, y: rightArmY, tile: tiles.CACTUS_BODY });

    if (progress > 0.7) {
      blocks.push({ x: x + 1, y: rightArmY - 1, tile: tiles.CACTUS_BODY });
    }
  }

  // Flowers on top if fully mature
  if (progress > 0.95) {
    const topY = y - currentHeight;
    blocks.push({ x, y: topY, tile: tiles.CACTUS_FLOWER });
  }

  return blocks;
}
