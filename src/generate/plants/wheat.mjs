/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateWheatStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage - just the growing seed
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.WHEAT_GROWING });

    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  for (let i = 0; i < currentHeight; i++) {
    const tileY = y - i;

    if (i < currentHeight - 1 || progress < 0.8) {
      // Stalk
      blocks.push({ x, y: tileY, tile: tiles.WHEAT_STALK });
    } else {
      // Top grains when mature
      blocks.push({ x, y: tileY, tile: tiles.WHEAT_GRAIN });
    }

    // Add side stalks for fuller appearance
    if (progress > 0.5 && i > 0 && i < currentHeight - 1) {
      if (Math.random() < 0.4) {
        blocks.push({ x: x - 1, y: tileY, tile: tiles.WHEAT_STALK });
      }

      if (Math.random() < 0.4) {
        blocks.push({ x: x + 1, y: tileY, tile: tiles.WHEAT_STALK });
      }
    }
  }

  // Add grain clusters when fully mature
  if (progress > 0.9) {
    const topY = y - currentHeight + 1;

    blocks.push({ x: x - 1, y: topY, tile: tiles.WHEAT_GRAIN });
    blocks.push({ x: x + 1, y: topY, tile: tiles.WHEAT_GRAIN });
  }

  return blocks;
}
