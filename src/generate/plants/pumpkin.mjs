import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D pumpkin structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generatePumpkinStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.PUMPKIN_GROWING);
  const VINE = getBlockId(blockNames.PUMPKIN_VINE);
  const STEM = getBlockId(blockNames.PUMPKIN_STEM);
  const LEAVES = getBlockId(blockNames.PUMPKIN_LEAVES);
  const FRUIT = getBlockId(blockNames.PUMPKIN_FRUIT);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Vine grows
  structure.push({ x, y, z, blockId: STEM });

  // Spreads
  if (progress > 0.4) {
    structure.push({ x: x + 1, y, z, blockId: VINE });
  }

  if (progress > 0.6) {
    structure.push({ x: x + 1, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    // Pumpkin on the vine
    // x+2?
    structure.push({ x: x + 2, y, z, blockId: FRUIT });
  }

  return structure;
}
