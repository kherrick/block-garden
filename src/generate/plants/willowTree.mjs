import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D willow tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateWillowTreeStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.WILLOW_TREE_GROWING);
  const TRUNK = getBlockId(blockNames.WILLOW_TRUNK);
  const BRANCHES = getBlockId(blockNames.WILLOW_BRANCHES);
  const LEAVES = getBlockId(blockNames.WILLOW_LEAVES);

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 5;
  const height = Math.floor(maxHeight * progress);

  // If no height yet, show growing block
  if (height === 0) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Trunk
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: TRUNK });
  }

  if (progress > 0.6) {
    const crownY = y + height;
    // Branches spread out
    structure.push({ x: x + 1, y: crownY, z, blockId: BRANCHES });
    structure.push({ x: x - 1, y: crownY, z, blockId: BRANCHES });
    structure.push({ x, y: crownY, z: z + 1, blockId: BRANCHES });
    structure.push({ x, y: crownY, z: z - 1, blockId: BRANCHES });

    // Leaves hanging down from branches
    if (progress > 0.8) {
      structure.push({ x: x + 1, y: crownY - 1, z, blockId: LEAVES });
      structure.push({ x: x - 1, y: crownY - 1, z, blockId: LEAVES });
      structure.push({ x, y: crownY - 1, z: z + 1, blockId: LEAVES });
      structure.push({ x, y: crownY - 1, z: z - 1, blockId: LEAVES });

      if (progress > 0.9 && height > 3) {
        structure.push({ x: x + 2, y: crownY - 1, z, blockId: LEAVES });
        structure.push({ x: x - 2, y: crownY - 1, z, blockId: LEAVES });
        structure.push({ x: x + 2, y: crownY - 2, z, blockId: LEAVES });
        structure.push({ x: x - 2, y: crownY - 2, z, blockId: LEAVES });
      }
    }
  }

  return structure;
}
