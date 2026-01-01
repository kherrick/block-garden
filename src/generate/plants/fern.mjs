import { blockNames } from "../../state/config/blocks.mjs";

/**
 * @typedef {import('../../state/config/index.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/index.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Generate 3D fern structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 * @param {BlockDefinition[]} blocks - Block definitions array
 *
 * @returns {BlockPlacement[]}
 */
export function generateFernStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.FERN_GROWING);
  const STEM = getBlockId(blockNames.FERN_STEM);
  const FROND = getBlockId(blockNames.FERN_FROND);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  structure.push({ x, y, z, blockId: STEM });

  if (progress > 0.5) {
    // Fronds spreading
    // Low to ground
    structure.push({ x: x + 1, y, z, blockId: FROND });
    structure.push({ x: x - 1, y, z, blockId: FROND });
    structure.push({ x, y, z: z + 1, blockId: FROND });
    structure.push({ x, y, z: z - 1, blockId: FROND });
  }

  if (progress > 0.8) {
    // Top frond
    structure.push({ x, y: y + 1, z, blockId: FROND });
  }

  return structure;
}
