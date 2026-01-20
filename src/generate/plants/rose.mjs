import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.ROSE_GROWING);
const STEM = getBlockIdByName(blockNames.ROSE_STEM);
const THORNS = getBlockIdByName(blockNames.ROSE_THORNS);
const LEAVES = getBlockIdByName(blockNames.ROSE_LEAVES);
const BUD = getBlockIdByName(blockNames.ROSE_BUD);
const BLOOM = getBlockIdByName(blockNames.ROSE_BLOOM);

/**
 * Generate 3D rose structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateRoseStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const height = 1 + Math.floor(progress * 2); // 1 to 3 blocks

  // Use coordinates to generate deterministic "random" values
  const isOdd = (n) => n % 2 !== 0;

  // Randomize the axis the leaves grow on (X or Z)
  // This gives the rose "alignment" variety without leaning the stem.
  const leafAxisIsX = isOdd(x + z);

  // For taller roses, we can alternate the side of a single leaf
  const leafDirection = isOdd(x) ? 1 : -1;

  // Generate Vertical Stem (Straight up to prevent kitty-corner issues)
  for (let i = 0; i < height; i++) {
    // Stem is always strictly centered at x, z to ensure support
    structure.push({
      x: x,
      y: y + i,
      z: z,
      blockId: i === 0 ? THORNS : STEM,
    });

    // Place Leaves
    // Only add leaves between the base and the top
    if (i > 0 && i < height) {
      // At the first segment above thorns, add two leaves opposite each other
      if (i === 1) {
        if (leafAxisIsX) {
          structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
          structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
        } else {
          structure.push({ x, y: y + i, z: z + 1, blockId: LEAVES });
          structure.push({ x, y: y + i, z: z - 1, blockId: LEAVES });
        }
      }
      // At higher segments (if tall), add a single leaf on a random side
      else if (i === 2) {
        let leafX = x;
        let leafZ = z;

        if (leafAxisIsX) {
          leafX += leafDirection;
        } else {
          leafZ += leafDirection;
        }

        structure.push({ x: leafX, y: y + i, z: leafZ, blockId: LEAVES });
      }
    }
  }

  // Place Flower Head
  // Strictly centered on top of the stem
  if (progress > 0.8) {
    const top = progress > 0.95 ? BLOOM : BUD;

    structure.push({
      x: x,
      y: y + height,
      z: z,
      blockId: top,
    });
  }

  return structure;
}
