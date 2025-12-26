import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D tulip structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateTulipStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.TULIP_GROWING);
  const BULB = getBlockId(blockNames.TULIP_BULB);
  const STEM = getBlockId(blockNames.TULIP_STEM);
  const LEAVES = getBlockId(blockNames.TULIP_LEAVES);
  const PETALS = getBlockId(blockNames.TULIP_PETALS);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    // Bulb sits underground? Or flat usage?
    // Let's assume surface planting.
    return structure;
  }

  structure.push({ x, y, z, blockId: BULB });

  if (progress > 0.4) {
    structure.push({ x, y: y + 1, z, blockId: STEM });
  }

  if (progress > 0.6) {
    // Leaves at base of stem
    structure.push({ x: x + 1, y: y + 1, z, blockId: LEAVES });
    structure.push({ x: x - 1, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    structure.push({ x, y: y + 2, z, blockId: PETALS });
  }

  return structure;
}
