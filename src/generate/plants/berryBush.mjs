import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.BERRY_BUSH_GROWING);
const BRANCH = getBlockIdByName(blockNames.BERRY_BUSH_BRANCH);
const LEAVES = getBlockIdByName(blockNames.BERRY_BUSH_LEAVES);
const BERRIES = getBlockIdByName(blockNames.BERRY_BUSH_BERRIES);

/**
 * Generate 3D berry bush structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateBerryBushStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Small bush structure
  // Center branch
  structure.push({ x, y, z, blockId: BRANCH });

  if (progress > 0.4) {
    // Leaves around
    structure.push({ x: x + 1, y, z, blockId: LEAVES });
    structure.push({ x: x - 1, y, z, blockId: LEAVES });
    structure.push({ x, y, z: z + 1, blockId: LEAVES });
    structure.push({ x, y, z: z - 1, blockId: LEAVES });

    // Top leaves
    structure.push({ x, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    // Berries on outside
    structure.push({ x: x + 1, y: y + 1, z, blockId: BERRIES });
    structure.push({ x: x - 1, y: y + 1, z, blockId: BERRIES });
    structure.push({ x, y: y + 1, z: z + 1, blockId: BERRIES });
    structure.push({ x, y: y + 1, z: z - 1, blockId: BERRIES });
  }

  return structure;
}
