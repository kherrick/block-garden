import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.ROSE_GROWING);
const STEM = getBlockIdByName(blockNames.ROSE_STEM);
const THORNS = getBlockIdByName(blockNames.ROSE_THORNS);
const LEAVES = getBlockIdByName(blockNames.ROSE_LEAVES);
const BUD = getBlockIdByName(blockNames.ROSE_BUD);
const BLOOM = getBlockIdByName(blockNames.ROSE_BLOOM);

/**
 * Generate 3D rose structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateRoseStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const height = 1 + Math.floor(progress * 2); // 1 to 3 blocks

  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: i === 0 ? THORNS : STEM });

    if (i > 0 && i < height) {
      // Leaves
      if (i % 2 === 1)
        structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
      else structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
    }
  }

  if (progress > 0.8) {
    const top = progress > 0.95 ? BLOOM : BUD;

    structure.push({ x, y: y + height, z, blockId: top });
  }

  return structure;
}
