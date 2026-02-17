import { blockNames, getBlockIdByName } from "../../world/config/blocks.mjs";

/**
 * @typedef {import('../../world/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../world/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.BIRCH_GROWING);
const TRUNK = getBlockIdByName(blockNames.BIRCH_TRUNK);
const BARK = getBlockIdByName(blockNames.BIRCH_BARK);
const LEAVES = getBlockIdByName(blockNames.BIRCH_LEAVES);
const BRANCHES = getBlockIdByName(blockNames.BIRCH_BRANCHES);
const CATKINS = getBlockIdByName(blockNames.BIRCH_CATKINS);

/**
 * Generate 3D birch tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateBirchStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 6;
  const height = Math.floor(maxHeight * progress);

  // If no height yet, show growing block
  if (height === 0) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Trunk - Use TRUNK while growing, BARK when mature
  const trunkId = progress >= 1.0 ? BARK : TRUNK;
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: trunkId });
  }

  // Canopy
  if (progress > 0.5) {
    const leafStart = Math.max(2, height - 3);
    for (let i = leafStart; i < height; i++) {
      // Branches/Leaves/Catkins
      if (i % 2 === 0) {
        structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
        structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
        structure.push({ x, y: y + i, z: z + 1, blockId: BRANCHES });
        structure.push({ x, y: y + i, z: z - 1, blockId: BRANCHES });

        // Add some Catkins hanging from branches
        if (progress > 0.7 && y + i - 1 > y) {
          structure.push({ x: x + 1, y: y + i - 1, z, blockId: CATKINS });
          structure.push({ x: x - 1, y: y + i - 1, z, blockId: CATKINS });
        }
      }
    }
    // Top
    structure.push({ x, y: y + height, z, blockId: LEAVES });
  }

  return structure;
}
