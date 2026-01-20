import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.CACTUS_GROWING);
const BODY = getBlockIdByName(blockNames.CACTUS_BODY);
const FLOWER = getBlockIdByName(blockNames.CACTUS_FLOWER);

/**
 * Generate 3d cactus structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateCactusStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Randomized height: 3-7 blocks
  const heightSeed = ((x * 37 + z * 73) % 100) / 100;
  const height = Math.max(
    3,
    Math.min(7, Math.floor(3 + heightSeed * 4 * progress)),
  );

  // Main trunk (1x1 column only - no base widening)
  let trunkTopY = y + height - 1;
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: BODY });
  }

  // Track flowers and termination heights
  let hasFlower = false;
  let flowerTerminationY = trunkTopY;

  // Single-width arms: 0-2 arms from middle trunk
  const armChance = Math.max(0, (progress - 0.3) * 2.5);
  const numArms = Math.min(2, Math.floor(armChance + heightSeed * 0.7));

  for (let armIndex = 0; armIndex < numArms; armIndex++) {
    const emergenceRatio = 0.25 + 0.15 * armIndex;
    const emergenceY = Math.floor(y + emergenceRatio * (height - 2));

    if (emergenceY >= y + height - 1) {
      continue;
    }

    // Single-block arm direction (X or Z axis only)
    const dir = (x + z + armIndex * 17) % 4 < 2 ? 1 : -1;
    const useXDir = armIndex % 2 === 0;

    // Arm extends in ONE direction only from trunk (true 1-block width)
    const armX = useXDir ? x + dir : x;
    const armZ = useXDir ? z : z + dir;

    // Single-block arm base (attached to trunk)
    structure.push({ x: armX, y: emergenceY, z: armZ, blockId: BODY });

    // Thin upward arm (1-2 blocks max, single column)
    const armLength = Math.floor(1 + heightSeed * progress);
    let armTipY = emergenceY;

    for (let seg = 1; seg <= armLength; seg++) {
      const armSegY = emergenceY + seg;
      if (armSegY > flowerTerminationY + 1) {
        break;
      }

      structure.push({ x: armX, y: armSegY, z: armZ, blockId: BODY });

      armTipY = armSegY;
    }

    // Terminal flower on arm tip only
    if (!hasFlower && progress > 0.85 && (x + z + emergenceY) % 5 === 1) {
      structure.push({ x: armX, y: armTipY, z: armZ, blockId: FLOWER });

      hasFlower = true;

      flowerTerminationY = Math.max(flowerTerminationY, armTipY);
    }
  }

  // Trunk tip flower only if no arms have flowers
  if (!hasFlower && progress > 0.9 && height >= 4) {
    structure.push({ x, y: trunkTopY, z, blockId: FLOWER });
  }

  return structure;
}
