import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.LOTUS_GROWING);
const PAD = getBlockIdByName(blockNames.LOTUS_PAD);
const STEM = getBlockIdByName(blockNames.LOTUS_STEM);
const BUD = getBlockIdByName(blockNames.LOTUS_BUD);
const FLOWER = getBlockIdByName(blockNames.LOTUS_FLOWER);

/**
 * Generate 3D lotus structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateLotusStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    // Usually on water surface.
    return structure;
  }

  // Pad spreads on water surface (y)
  structure.push({ x, y, z, blockId: PAD });

  if (progress > 0.4) {
    structure.push({ x: x + 1, y, z, blockId: PAD });
    structure.push({ x: x - 1, y, z, blockId: PAD });
    structure.push({ x, y, z: z + 1, blockId: PAD });
    structure.push({ x, y, z: z - 1, blockId: PAD });
  }

  if (progress > 0.7) {
    // Stem rising from center
    structure.push({ x, y: y + 1, z, blockId: STEM });

    // Bud/Flower
    const top = progress > 0.9 ? FLOWER : BUD;
    structure.push({ x, y: y + 2, z, blockId: top });
  }

  return structure;
}
