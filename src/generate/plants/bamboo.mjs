/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateBambooStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.BAMBOO_GROWING });

    return blocks;
  }

  const maxHeight = 7;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Build bamboo stalk with joints
  for (let i = 0; i < currentHeight; i++) {
    // Every 2 blocks is a joint
    if (i % 2 === 0) {
      blocks.push({ x, y: y - i, tile: tiles.BAMBOO_JOINT });
    } else {
      blocks.push({ x, y: y - i, tile: tiles.BAMBOO_STALK });
    }
  }

  // Add leaves at top when more grown
  if (progress > 0.5) {
    const topY = y - currentHeight;

    blocks.push({ x: x - 1, y: topY, tile: tiles.BAMBOO_LEAVES });
    blocks.push({ x: x + 1, y: topY, tile: tiles.BAMBOO_LEAVES });

    if (progress > 0.7) {
      blocks.push({ x: x - 1, y: topY + 1, tile: tiles.BAMBOO_LEAVES });
      blocks.push({ x: x + 1, y: topY + 1, tile: tiles.BAMBOO_LEAVES });
    }
  }

  return blocks;
}
