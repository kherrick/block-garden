/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateFernStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.FERN_GROWING });

    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Central stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.FERN_STEM });
  }

  // Unfurling fronds
  if (progress > 0.3) {
    const frondSpread = Math.ceil(progress * 2);

    for (let i = 0; i < currentHeight; i++) {
      const spreadAtHeight = Math.min(frondSpread, i + 1);

      for (let dx = -spreadAtHeight; dx <= spreadAtHeight; dx++) {
        if (dx !== 0) {
          blocks.push({ x: x + dx, y: y - i, tile: tiles.FERN_FROND });
        }
      }
    }
  }

  return blocks;
}
