import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.TULIP_GROWING);
const BULB = getBlockIdByName(blockNames.TULIP_BULB);
const STEM = getBlockIdByName(blockNames.TULIP_STEM);
const LEAVES = getBlockIdByName(blockNames.TULIP_LEAVES);
const PETALS = getBlockIdByName(blockNames.TULIP_PETALS);

/**
 * Generate 3D tulip structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateTulipStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    // Bulb sits underground? Or flat usage?
    // Let's assume surface planting.
    return structure;
  }

  structure.push({ x, y, z, blockId: BULB });

  if (progress > 0.4) {
    structure.push({ x, y: y + 1, z, blockId: STEM });
  }

  if (progress > 0.6) {
    // Leaves at base of stem
    structure.push({ x: x + 1, y: y + 1, z, blockId: LEAVES });
    structure.push({ x: x - 1, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    structure.push({ x, y: y + 2, z, blockId: PETALS });
  }

  return structure;
}
