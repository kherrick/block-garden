import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.CACTUS_GROWING);
const BODY = getBlockIdByName(blockNames.CACTUS_BODY);
const FLOWER = getBlockIdByName(blockNames.CACTUS_FLOWER);

/**
 * Generate 3D cactus structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateCactusStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 4;
  const height = Math.max(1, Math.floor(maxHeight * progress));

  // Trunk
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: BODY });
  }

  // Arms
  if (progress > 0.4 && height > 2) {
    structure.push({ x: x + 1, y: y + 1, z, blockId: BODY });
    structure.push({ x: x + 1, y: y + 2, z, blockId: BODY });
  }
  if (progress > 0.6 && height > 2) {
    structure.push({ x: x - 1, y: y + 2, z, blockId: BODY });
    structure.push({ x: x - 1, y: y + 3, z, blockId: BODY });
  }

  // Flower
  if (progress > 0.9) {
    structure.push({ x, y: y + height, z, blockId: FLOWER });
    if (progress > 0.95) {
      // Flowers on arms?
      structure.push({ x: x + 1, y: y + 3, z, blockId: FLOWER });
      structure.push({ x: x - 1, y: y + 4, z, blockId: FLOWER });
    }
  }

  return structure;
}
