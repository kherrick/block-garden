/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateLavenderStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.LAVENDER_GROWING });

    return blocks;
  }

  const maxHeight = 2;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Build bushy base
  if (progress > 0.2) {
    blocks.push({ x, y, tile: tiles.LAVENDER_BUSH });

    if (progress > 0.4) {
      blocks.push({ x: x - 1, y, tile: tiles.LAVENDER_BUSH });
      blocks.push({ x: x + 1, y, tile: tiles.LAVENDER_BUSH });
    }
  }

  // Stems rise from bush
  if (progress > 0.5) {
    for (let i = 1; i <= currentHeight; i++) {
      blocks.push({ x, y: y - i, tile: tiles.LAVENDER_STEM });

      if (progress > 0.7 && i === currentHeight) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.LAVENDER_STEM });
        blocks.push({ x: x + 1, y: y - i, tile: tiles.LAVENDER_STEM });
      }
    }
  }

  // Purple flowers crown the stems
  if (progress > 0.75) {
    const topY = y - currentHeight;

    blocks.push({ x, y: topY, tile: tiles.LAVENDER_FLOWERS });

    if (progress > 0.85) {
      blocks.push({ x: x - 1, y: topY, tile: tiles.LAVENDER_FLOWERS });
      blocks.push({ x: x + 1, y: topY, tile: tiles.LAVENDER_FLOWERS });
    }
  }

  return blocks;
}
