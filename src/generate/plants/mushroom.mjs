/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateMushroomStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.MUSHROOM_GROWING });

    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.MUSHROOM_STEM });
  }

  // Cap grows as progress advances
  if (progress > 0.4) {
    const capY = y - currentHeight;
    blocks.push({ x, y: capY, tile: tiles.MUSHROOM_CAP });

    // Expand cap
    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: capY, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY, tile: tiles.MUSHROOM_CAP });
    }

    if (progress > 0.8) {
      blocks.push({ x: x - 1, y: capY - 1, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x, y: capY - 1, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY - 1, tile: tiles.MUSHROOM_CAP });
    }
  }

  return blocks;
}
