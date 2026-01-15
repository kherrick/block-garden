import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.AGAVE_GROWING);
const BASE = getBlockIdByName(blockNames.AGAVE_BASE);
const SPIKE = getBlockIdByName(blockNames.AGAVE_SPIKE);
const STALK = getBlockIdByName(blockNames.AGAVE_FLOWER_STALK);
const FLOWER = getBlockIdByName(blockNames.AGAVE_FLOWER);

/**
 * Generate 3D agave structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateAgaveStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Base
  structure.push({ x, y, z, blockId: BASE });

  if (progress > 0.4) {
    // Spikes around base
    if (progress > 0.5) structure.push({ x: x - 1, y, z, blockId: SPIKE });
    if (progress > 0.55) structure.push({ x: x + 1, y, z, blockId: SPIKE });
    if (progress > 0.6) structure.push({ x, y, z: z - 1, blockId: SPIKE });
    if (progress > 0.65) structure.push({ x, y, z: z + 1, blockId: SPIKE });
  }

  // Flower Stalk
  if (progress > 0.8) {
    const height = 3;
    const currentHeight = Math.ceil(height * ((progress - 0.8) / 0.2));

    for (let i = 1; i <= height; i++) {
      // Grow from 1 above base
      if (i === height && progress > 0.95) {
        structure.push({ x, y: y + i, z, blockId: FLOWER });
      } else {
        structure.push({ x, y: y + i, z, blockId: STALK });
      }
    }
  }

  return structure;
}
