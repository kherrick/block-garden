/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateLotusStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.LOTUS_GROWING });

    return blocks;
  }

  // Underwater stem
  if (progress > 0.2) {
    const stemDepth = Math.ceil(progress * 2);

    for (let i = 1; i <= stemDepth; i++) {
      blocks.push({ x, y: y + i, tile: tiles.LOTUS_STEM });
    }
  }

  // Lily pads float on surface
  if (progress > 0.4) {
    blocks.push({ x, y, tile: tiles.LOTUS_PAD });

    if (progress > 0.6) {
      blocks.push({ x: x - 1, y, tile: tiles.LOTUS_PAD });
      blocks.push({ x: x + 1, y, tile: tiles.LOTUS_PAD });
    }
  }

  // Flower bud emerges
  if (progress > 0.7) {
    blocks.push({ x, y: y - 1, tile: tiles.LOTUS_BUD });
  }

  // Full lotus bloom
  if (progress > 0.85) {
    const flowerY = y - 1;

    blocks.push({ x, y: flowerY, tile: tiles.LOTUS_FLOWER });
    blocks.push({ x: x - 1, y: flowerY, tile: tiles.LOTUS_FLOWER });
    blocks.push({ x: x + 1, y: flowerY, tile: tiles.LOTUS_FLOWER });
    blocks.push({ x, y: flowerY - 1, tile: tiles.LOTUS_FLOWER });
  }

  return blocks;
}
