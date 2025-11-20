/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateCornStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CORN_GROWING });

    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stalk
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CORN_STALK });
  }

  // Add leaves as it grows
  if (progress > 0.4) {
    for (let i = 1; i < currentHeight; i++) {
      if (i % 2 === 1) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.CORN_LEAVES });
      } else {
        blocks.push({ x: x + 1, y: y - i, tile: tiles.CORN_LEAVES });
      }
    }
  }

  // Corn ear appears when mature
  if (progress > 0.7) {
    const earY = y - Math.floor(currentHeight * 0.6);

    blocks.push({ x: x + 1, y: earY, tile: tiles.CORN_EAR });

    if (progress > 0.85) {
      blocks.push({ x: x + 1, y: earY - 1, tile: tiles.CORN_SILK });
    }
  }

  return blocks;
}
