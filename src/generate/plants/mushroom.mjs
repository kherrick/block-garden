import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D mushroom structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateMushroomStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.MUSHROOM_GROWING);
  const STEM = getBlockId(blockNames.MUSHROOM_STEM);
  const CAP = getBlockId(blockNames.MUSHROOM_CAP);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const height = 1 + Math.floor(progress * 2); // 1 to 3 blocks tall

  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: STEM });
  }

  if (progress > 0.6) {
    // Cap on top
    // Center
    structure.push({ x, y: y + height, z, blockId: CAP });
    // Spread
    structure.push({ x: x + 1, y: y + height, z, blockId: CAP });
    structure.push({ x: x - 1, y: y + height, z, blockId: CAP });
    structure.push({ x, y: y + height, z: z + 1, blockId: CAP });
    structure.push({ x, y: y + height, z: z - 1, blockId: CAP });

    // Drooping edges?
    if (progress > 0.8) {
      structure.push({ x: x + 1, y: y + height - 1, z, blockId: CAP });
      structure.push({ x: x - 1, y: y + height - 1, z, blockId: CAP });
      structure.push({ x, y: y + height - 1, z: z + 1, blockId: CAP });
      structure.push({ x, y: y + height - 1, z: z - 1, blockId: CAP });
    }
  }

  return structure;
}
