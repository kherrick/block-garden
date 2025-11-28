/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateCarrotStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CARROT_GROWING });

    return blocks;
  }

  // Underground root grows first
  if (progress > 0.2) {
    const rootDepth = Math.ceil(2 * progress);

    for (let i = 1; i <= rootDepth; i++) {
      blocks.push({ x, y: y + i, tile: tiles.CARROT_ROOT });
    }
  }

  // Leaves on top
  const leafHeight = Math.max(1, Math.ceil(2 * progress));

  for (let i = 0; i < leafHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CARROT_LEAVES });

    // Spread leaves when more mature
    if (progress > 0.5 && i === leafHeight - 1) {
      blocks.push({ x: x - 1, y: y - i, tile: tiles.CARROT_LEAVES });
      blocks.push({ x: x + 1, y: y - i, tile: tiles.CARROT_LEAVES });
    }
  }

  return blocks;
}
