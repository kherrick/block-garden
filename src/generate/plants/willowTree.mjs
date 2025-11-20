/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateWillowTreeStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.WILLOW_TREE_GROWING });

    return blocks;
  }

  const maxHeight = 6;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Trunk
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.WILLOW_TRUNK });
  }

  // Drooping branches when growing
  if (progress > 0.3) {
    const topY = y - currentHeight;
    const branchLength = Math.ceil(progress * 4);

    // Left drooping branches
    for (let i = 0; i < branchLength; i++) {
      blocks.push({
        x: x - 1 - Math.floor(i / 2),
        y: topY + i,
        tile: tiles.WILLOW_BRANCHES,
      });

      if (progress > 0.6 && i > 0) {
        blocks.push({
          x: x - 1 - Math.floor(i / 2),
          y: topY + i,
          tile: tiles.WILLOW_LEAVES,
        });
      }
    }

    // Right drooping branches
    for (let i = 0; i < branchLength; i++) {
      blocks.push({
        x: x + 1 + Math.floor(i / 2),
        y: topY + i,
        tile: tiles.WILLOW_BRANCHES,
      });

      if (progress > 0.6 && i > 0) {
        blocks.push({
          x: x + 1 + Math.floor(i / 2),
          y: topY + i,
          tile: tiles.WILLOW_LEAVES,
        });
      }
    }
  }

  // Additional leaves when mature
  if (progress > 0.8) {
    const topY = y - currentHeight;

    blocks.push({ x: x - 2, y: topY + 2, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x + 2, y: topY + 2, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x - 3, y: topY + 3, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x + 3, y: topY + 3, tile: tiles.WILLOW_LEAVES });
  }

  return blocks;
}
