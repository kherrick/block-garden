/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateBerryBushStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.BERRY_BUSH_GROWING });

    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Central branches
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.BERRY_BUSH_BRANCH });
  }

  // Add leaves when growing
  if (progress > 0.3) {
    const topY = y - currentHeight;
    const leafRadius = Math.min(2, Math.ceil((progress - 0.3) * 3));

    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = 0; dy <= leafRadius; dy++) {
        const leafX = x + dx;

        const leafY = topY + dy;

        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance <= leafRadius && distance > 0) {
          blocks.push({ x: leafX, y: leafY, tile: tiles.BERRY_BUSH_LEAVES });
        }
      }
    }
  }

  // Add berries when mature
  if (progress > 0.8) {
    const topY = y - currentHeight;

    if (Math.random() < 0.6)
      blocks.push({ x: x - 1, y: topY + 1, tile: tiles.BERRY_BUSH_BERRIES });

    if (Math.random() < 0.6)
      blocks.push({ x: x + 1, y: topY + 1, tile: tiles.BERRY_BUSH_BERRIES });

    if (Math.random() < 0.6)
      blocks.push({ x: x - 1, y: topY, tile: tiles.BERRY_BUSH_BERRIES });

    if (Math.random() < 0.6)
      blocks.push({ x: x + 1, y: topY, tile: tiles.BERRY_BUSH_BERRIES });
  }

  return blocks;
}
