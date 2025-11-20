/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateBirchStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.BIRCH_GROWING });

    return blocks;
  }

  const maxHeight = 7;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Distinctive white trunk with dark bark marks
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.BIRCH_TRUNK });

    // Add characteristic bark markings
    if (progress > 0.3 && i % 2 === 1) {
      blocks.push({ x, y: y - i, tile: tiles.BIRCH_BARK });
    }
  }

  // Branches spread out
  if (progress > 0.5) {
    const topY = y - currentHeight;
    const branchY = y - Math.floor(currentHeight * 0.7);

    blocks.push({ x: x - 1, y: branchY, tile: tiles.BIRCH_BRANCHES });
    blocks.push({ x: x + 1, y: branchY, tile: tiles.BIRCH_BRANCHES });

    if (progress > 0.7) {
      blocks.push({ x: x - 2, y: branchY, tile: tiles.BIRCH_BRANCHES });
      blocks.push({ x: x + 2, y: branchY, tile: tiles.BIRCH_BRANCHES });
    }
  }

  // Light green leaves in crown
  if (progress > 0.6) {
    const topY = y - currentHeight;
    const leafRadius = 2;

    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = -leafRadius; dy <= 1; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance <= leafRadius + 1 && dy <= 0) {
          const isTrunk = dx === 0 && dy > -currentHeight;

          if (!isTrunk) {
            blocks.push({ x: x + dx, y: topY + dy, tile: tiles.BIRCH_LEAVES });
          }
        }
      }
    }
  }

  // Hanging catkins when mature
  if (progress > 0.9) {
    const topY = y - currentHeight;

    blocks.push({ x: x - 1, y: topY + 1, tile: tiles.BIRCH_CATKINS });
    blocks.push({ x: x + 1, y: topY + 1, tile: tiles.BIRCH_CATKINS });
  }

  return blocks;
}
