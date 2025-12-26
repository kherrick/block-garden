import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D bamboo structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateBambooStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.BAMBOO_GROWING);
  const STALK = getBlockId(blockNames.BAMBOO_STALK);
  const JOINT = getBlockId(blockNames.BAMBOO_JOINT);
  const LEAVES = getBlockId(blockNames.BAMBOO_LEAVES);

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 8;
  const height = Math.floor(maxHeight * progress);

  for (let i = 0; i < height; i++) {
    const isJoint = i % 3 === 2;
    structure.push({ x, y: y + i, z, blockId: isJoint ? JOINT : STALK });

    // Leaves at joints
    if (isJoint && i < height - 1) {
      // Not at very top? Or yes?
      // Leaves stick out
      structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
      structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
    }
  }

  return structure;
}
