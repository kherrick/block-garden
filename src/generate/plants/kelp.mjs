import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.KELP_GROWING);
const BLADE = getBlockIdByName(blockNames.KELP_BLADE);
const BULB = getBlockIdByName(blockNames.KELP_BULB);

/**
 * Generate 3D kelp structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateKelpStructure(x, y, z, progress) {
  const structure = [];

  // Checks if underwater? Assuming placed underwater for now.

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 10;
  const height = Math.floor(maxHeight * progress);

  for (let i = 0; i < height; i++) {
    const isBulb = i === height - 1 || i % 4 === 3;
    const block = isBulb ? BULB : BLADE;
    structure.push({ x, y: y + i, z, blockId: block });
  }

  return structure;
}
