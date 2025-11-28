/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateTulipStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.TULIP_GROWING });

    return blocks;
  }

  // Underground bulb
  if (progress > 0.15) {
    blocks.push({ x, y: y + 1, tile: tiles.TULIP_BULB });
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.TULIP_STEM });
  }

  // Add leaves along stem
  if (progress > 0.3) {
    const leafY = y - Math.floor(currentHeight * 0.5);

    blocks.push({ x: x - 1, y: leafY, tile: tiles.TULIP_LEAVES });
    blocks.push({ x: x + 1, y: leafY, tile: tiles.TULIP_LEAVES });
  }

  // Flower petals when mature
  if (progress > 0.7) {
    const topY = y - currentHeight;

    blocks.push({ x, y: topY, tile: tiles.TULIP_PETALS });

    if (progress > 0.85) {
      // Full tulip bloom
      blocks.push({ x: x - 1, y: topY, tile: tiles.TULIP_PETALS });
      blocks.push({ x: x + 1, y: topY, tile: tiles.TULIP_PETALS });
      blocks.push({ x, y: topY - 1, tile: tiles.TULIP_PETALS });
    }
  }

  return blocks;
}
