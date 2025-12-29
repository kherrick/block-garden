import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D corn structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateCornStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.CORN_GROWING);
  const STALK = getBlockId(blockNames.CORN_STALK);
  const LEAVES = getBlockId(blockNames.CORN_LEAVES);
  const EAR = getBlockId(blockNames.CORN_EAR);
  const SILK = getBlockId(blockNames.CORN_SILK);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const height = 2; // Corn is 2 blocks tall usually

  // Bottom Stalk
  structure.push({ x, y, z, blockId: STALK });

  if (progress > 0.4) {
    // Top Stalk
    structure.push({ x, y: y + 1, z, blockId: STALK });
  }

  if (progress > 0.6) {
    // Leaves and Ear
    structure.push({ x: x + 1, y, z, blockId: LEAVES });
    structure.push({ x: x - 1, y, z, blockId: LEAVES });

    // Ear on top stalk?
    structure.push({ x: x + 1, y: y + 1, z, blockId: EAR });
  }

  if (progress > 0.8) {
    // Silk on top of ear
    structure.push({ x: x + 1, y: y + 2, z, blockId: SILK });
  }

  return structure;
}
