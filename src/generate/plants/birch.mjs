import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D birch tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateBirchStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.BIRCH_GROWING);
  const TRUNK = getBlockId(blockNames.BIRCH_TRUNK);
  const LEAVES = getBlockId(blockNames.BIRCH_LEAVES);
  const BRANCHES = getBlockId(blockNames.BIRCH_BRANCHES);

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 6;
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

  // Canopy
  if (progress > 0.5) {
    const leafStart = Math.max(2, height - 3);
    for (let i = leafStart; i < height; i++) {
      // Branches/Leaves
      if (i % 2 === 0) {
        structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
        structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
        structure.push({ x, y: y + i, z: z + 1, blockId: LEAVES });
        structure.push({ x, y: y + i, z: z - 1, blockId: LEAVES });
      }
    }
    // Top
    structure.push({ x, y: y + height, z, blockId: LEAVES });
  }

  return structure;
}
