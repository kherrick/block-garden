import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.BIRCH_GROWING);
const TRUNK = getBlockIdByName(blockNames.BIRCH_TRUNK);
const LEAVES = getBlockIdByName(blockNames.BIRCH_LEAVES);
const BRANCHES = getBlockIdByName(blockNames.BIRCH_BRANCHES);

/**
 * Generate 3D birch tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateBirchStructure(x, y, z, progress) {
  const structure = [];

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
