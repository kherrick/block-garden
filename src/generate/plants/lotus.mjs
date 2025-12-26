import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D lotus structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateLotusStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.LOTUS_GROWING);
  const PAD = getBlockId(blockNames.LOTUS_PAD);
  const STEM = getBlockId(blockNames.LOTUS_STEM);
  const BUD = getBlockId(blockNames.LOTUS_BUD);
  const FLOWER = getBlockId(blockNames.LOTUS_FLOWER);

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
