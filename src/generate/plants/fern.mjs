import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.FERN_GROWING);
const STEM = getBlockIdByName(blockNames.FERN_STEM);
const FROND = getBlockIdByName(blockNames.FERN_FROND);

/**
 * Generate 3D fern structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateFernStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  structure.push({ x, y, z, blockId: STEM });

  if (progress > 0.5) {
    // Fronds spreading
    // Low to ground
    structure.push({ x: x + 1, y, z, blockId: FROND });
    structure.push({ x: x - 1, y, z, blockId: FROND });
    structure.push({ x, y, z: z + 1, blockId: FROND });
    structure.push({ x, y, z: z - 1, blockId: FROND });
  }

  if (progress > 0.8) {
    // Top frond
    structure.push({ x, y: y + 1, z, blockId: FROND });
  }

  return structure;
}
