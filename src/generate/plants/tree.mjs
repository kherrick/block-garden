import { getRandomSeed } from "../../misc/getRandomSeed.mjs";

/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateTreeStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage - just the growing seed
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.TREE_GROWING });

    return blocks;
  }

  const maxHeight = getRandomSeed(3, 5);
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Trunk grows first
  for (let i = 0; i < currentHeight; i++) {
    const tileY = y - i;

    blocks.push({ x, y: tileY, tile: tiles.TREE_TRUNK });
  }

  // Leaves start appearing when tree is 30% grown
  if (progress > 0.3) {
    const topY = y - currentHeight;
    const leafRadius = Math.min(3, Math.ceil((progress - 0.3) * 5));

    // Create leaf canopy
    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = -leafRadius; dy <= 1; dy++) {
        const leafX = x + dx;
        const leafY = topY + dy;

        // Create circular canopy shape
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= leafRadius && dy <= 0) {
          // Don't replace trunk blocks
          const isTrunk = blocks.find(
            (b) =>
              b.x === leafX && b.y === leafY && b.tile === tiles.TREE_TRUNK,
          );

          if (!isTrunk) {
            blocks.push({ x: leafX, y: leafY, tile: tiles.TREE_LEAVES });
          }
        }
      }
    }
  }

  return blocks;
}
