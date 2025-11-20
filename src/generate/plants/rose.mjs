/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateRoseStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.ROSE_GROWING });

    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Thorny stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.ROSE_STEM });

    // Add thorns along stem
    if (progress > 0.3 && i > 0 && i < currentHeight - 1) {
      if (i % 2 === 0) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.ROSE_THORNS });
      } else {
        blocks.push({ x: x + 1, y: y - i, tile: tiles.ROSE_THORNS });
      }
    }
  }

  // Add leaves
  if (progress > 0.4) {
    for (let i = 1; i < currentHeight; i += 2) {
      blocks.push({ x: x - 1, y: y - i, tile: tiles.ROSE_LEAVES });
      blocks.push({ x: x + 1, y: y - i, tile: tiles.ROSE_LEAVES });
    }
  }

  // Rose bud forms
  if (progress > 0.6) {
    const topY = y - currentHeight;

    blocks.push({ x, y: topY, tile: tiles.ROSE_BUD });
  }

  // Full bloom
  if (progress > 0.85) {
    const topY = y - currentHeight;

    blocks.push({ x, y: topY, tile: tiles.ROSE_BLOOM });
    blocks.push({ x: x - 1, y: topY, tile: tiles.ROSE_BLOOM });
    blocks.push({ x: x + 1, y: topY, tile: tiles.ROSE_BLOOM });
    blocks.push({ x, y: topY - 1, tile: tiles.ROSE_BLOOM });
  }

  return blocks;
}
