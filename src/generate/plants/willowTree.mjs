import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.WILLOW_TREE_GROWING);
const TRUNK = getBlockIdByName(blockNames.WILLOW_TRUNK);
const BRANCHES = getBlockIdByName(blockNames.WILLOW_BRANCHES);
const LEAVES = getBlockIdByName(blockNames.WILLOW_LEAVES);

/**
 * Generate 3D willow tree structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateWillowTreeStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Deterministic random helper
  const isOdd = (n) => n % 2 !== 0;

  // Randomize height slightly between 5 and 7 blocks
  const height = 5 + ((x + z) % 3);

  // If no height yet, show growing block
  if (height === 0) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Generate Trunk (Straight, supported)
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: TRUNK });
  }

  if (progress > 0.4) {
    const crownY = y + height;
    const trunkX = x;
    const trunkZ = z;

    // Define potential branch points around the crown
    const potentialBranches = [
      { dx: 0, dz: 0 }, // Center (always exists)
      { dx: 1, dz: 0 }, // East
      { dx: -1, dz: 0 }, // West
      { dx: 0, dz: 1 }, // South
      { dx: 0, dz: -1 }, // North
    ];

    // Generate the canopy curtains
    potentialBranches.forEach((pos, index) => {
      // Randomly decide if this branch grows.
      // The center branch always grows. Others depend on coordinates.
      const exists = index === 0 || isOdd(x + z + index);

      if (exists) {
        const bx = trunkX + pos.dx;
        const bz = trunkZ + pos.dz;

        // Place the Branch wood
        structure.push({ x: bx, y: crownY, z: bz, blockId: BRANCHES });

        // Generate Weeping Leaves
        if (progress > 0.6) {
          // Randomize how far this specific curtain hangs down.
          // Range: 2 to 5 blocks long
          const dropLength = 2 + ((x * index + z) % 4);

          // Don't let leaves touch the ground (y + 1), stop at y + 2
          const maxDrop = Math.min(dropLength, crownY - (y + 1));

          for (let d = 1; d <= maxDrop; d++) {
            // Make the curtain slightly wider at the top (d=1) for fullness
            if (d === 1) {
              // Add a neighbor leaf at the very top of the drape for volume
              if (isOdd(index)) {
                structure.push({
                  x: bx + 1,
                  y: crownY - d,
                  z: bz,
                  blockId: LEAVES,
                });
              } else {
                structure.push({
                  x: bx - 1,
                  y: crownY - d,
                  z: bz,
                  blockId: LEAVES,
                });
              }
            }

            // Main vertical strand
            structure.push({ x: bx, y: crownY - d, z: bz, blockId: LEAVES });
          }
        }
      }
    });
  }

  return structure;
}
