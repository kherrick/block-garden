import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D rose structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateRoseStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.ROSE_GROWING);
  const STEM = getBlockId(blockNames.ROSE_STEM);
  // Thorns? Could be transparent overlay or just part of stem logic?
  // We have ROSE_THORNS block. Let's use it as base.
  const THORNS = getBlockId(blockNames.ROSE_THORNS);
  const LEAVES = getBlockId(blockNames.ROSE_LEAVES);
  const BUD = getBlockId(blockNames.ROSE_BUD);
  const BLOOM = getBlockId(blockNames.ROSE_BLOOM);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const height = 1 + Math.floor(progress * 2); // 1 to 3 blocks

  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: i === 0 ? THORNS : STEM });

    if (i > 0 && i < height) {
      // Leaves
      if (i % 2 === 1)
        structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
      else structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
    }
  }

  if (progress > 0.8) {
    const top = progress > 0.95 ? BLOOM : BUD;

    structure.push({ x, y: y + height, z, blockId: top });
  }

  return structure;
}
