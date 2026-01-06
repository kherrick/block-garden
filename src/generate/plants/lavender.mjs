import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.LAVENDER_GROWING);
const BUSH = getBlockIdByName(blockNames.LAVENDER_BUSH);
const STEM = getBlockIdByName(blockNames.LAVENDER_STEM);
const FLOWERS = getBlockIdByName(blockNames.LAVENDER_FLOWERS);

/**
 * Generate 3D lavender structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateLavenderStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Bush base
  structure.push({ x, y, z, blockId: BUSH });

  if (progress > 0.4) {
    // Small spread
    structure.push({ x: x + 1, y, z, blockId: BUSH });
    structure.push({ x: x - 1, y, z, blockId: BUSH });
    structure.push({ x, y, z: z + 1, blockId: BUSH });
    structure.push({ x, y, z: z - 1, blockId: BUSH });
  }

  if (progress > 0.6) {
    // Stems rising
    structure.push({ x, y: y + 1, z, blockId: STEM });
    structure.push({ x: x + 1, y: y + 1, z, blockId: STEM });
    structure.push({ x: x - 1, y: y + 1, z, blockId: STEM });
    structure.push({ x, y: y + 1, z: z + 1, blockId: STEM });
    structure.push({ x, y: y + 1, z: z - 1, blockId: STEM });
  }

  if (progress > 0.8) {
    // Flowers on top
    structure.push({ x, y: y + 2, z, blockId: FLOWERS });
    structure.push({ x: x + 1, y: y + 2, z, blockId: FLOWERS });
    structure.push({ x: x - 1, y: y + 2, z, blockId: FLOWERS });
    structure.push({ x, y: y + 2, z: z + 1, blockId: FLOWERS });
    structure.push({ x, y: y + 2, z: z - 1, blockId: FLOWERS });
  }

  return structure;
}
