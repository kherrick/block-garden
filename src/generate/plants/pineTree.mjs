import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.PINE_TREE_GROWING);
const TRUNK = getBlockIdByName(blockNames.PINE_TRUNK);
const NEEDLES = getBlockIdByName(blockNames.PINE_NEEDLES);

/**
 * Generate 3D pine tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generatePineTreeStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 7;
  const height = Math.floor(maxHeight * progress);

  // If no height yet, show growing block
  if (height === 0) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Trunk
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: TRUNK });
  }

  // Needles
  if (progress > 0.4) {
    // Conical shape
    // Bottom layer
    for (let i = 3; i < height; i++) {
      const width = Math.max(1, Math.floor((height - i) / 2));
      // If width > 0, make ring/square
      if (width >= 1) {
        // Simple + shape for now or square?
        structure.push({ x: x + 1, y: y + i, z, blockId: NEEDLES });
        structure.push({ x: x - 1, y: y + i, z, blockId: NEEDLES });
        structure.push({ x, y: y + i, z: z + 1, blockId: NEEDLES });
        structure.push({ x, y: y + i, z: z - 1, blockId: NEEDLES });

        if (width > 1) {
          // Corners
          structure.push({ x: x + 1, y: y + i, z: z + 1, blockId: NEEDLES });
          structure.push({ x: x - 1, y: y + i, z: z + 1, blockId: NEEDLES });
          structure.push({ x: x + 1, y: y + i, z: z - 1, blockId: NEEDLES });
          structure.push({ x: x - 1, y: y + i, z: z - 1, blockId: NEEDLES });
        }
      }
    }

    // Top
    structure.push({ x, y: y + height, z, blockId: NEEDLES });
  }

  return structure;
}
