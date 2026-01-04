import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.WHEAT_GROWING);
const STALK = getBlockIdByName(blockNames.WHEAT_STALK);
const GRAIN = getBlockIdByName(blockNames.WHEAT_GRAIN);

/**
 * Generate 3D wheat structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateWheatStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  structure.push({ x, y, z, blockId: STALK });

  if (progress > 0.5) {
    structure.push({ x, y: y + 1, z, blockId: STALK });
  }

  if (progress > 0.8) {
    // Grain head
    structure.push({ x, y: y + 2, z, blockId: GRAIN });
  }

  return structure;
}
