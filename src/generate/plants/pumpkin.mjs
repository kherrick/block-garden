import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.PUMPKIN_GROWING);
const VINE = getBlockIdByName(blockNames.PUMPKIN_VINE);
const STEM = getBlockIdByName(blockNames.PUMPKIN_STEM);
const LEAVES = getBlockIdByName(blockNames.PUMPKIN_LEAVES);
const FRUIT = getBlockIdByName(blockNames.PUMPKIN_FRUIT);

/**
 * Generate 3D pumpkin structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generatePumpkinStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Vine grows
  structure.push({ x, y, z, blockId: STEM });

  // Spreads
  if (progress > 0.4) {
    structure.push({ x: x + 1, y, z, blockId: VINE });
  }

  if (progress > 0.6) {
    structure.push({ x: x + 1, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    // Pumpkin on the vine
    // x+2?
    structure.push({ x: x + 2, y, z, blockId: FRUIT });
  }

  return structure;
}
