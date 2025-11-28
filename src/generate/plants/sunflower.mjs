/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateSunflowerStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.SUNFLOWER_GROWING });

    return blocks;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.SUNFLOWER_STEM });
  }

  // Add leaves along stem
  if (progress > 0.3) {
    const leafSpacing = 2;

    for (let i = leafSpacing; i < currentHeight; i += leafSpacing) {
      if (i % 2 === 0) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.SUNFLOWER_LEAVES });
      } else {
        blocks.push({ x: x + 1, y: y - i, tile: tiles.SUNFLOWER_LEAVES });
      }
    }
  }

  // Flower head at top when mature
  if (progress > 0.7) {
    const topY = y - currentHeight;

    blocks.push({ x, y: topY, tile: tiles.SUNFLOWER_CENTER });

    if (progress > 0.85) {
      // Add petals around center
      blocks.push({ x: x - 1, y: topY, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x: x + 1, y: topY, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x, y: topY - 1, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x, y: topY + 1, tile: tiles.SUNFLOWER_PETALS });
    }
  }

  return blocks;
}
