import { blockNames } from "../../state/config/blocks.mjs";
import { getBlockIdByName } from "../../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('../../state/config/blocks.mjs').BlockPlacement} BlockPlacement
 */

const GROWING = getBlockIdByName(blockNames.KELP_GROWING);
const BLADE = getBlockIdByName(blockNames.KELP_BLADE);
const BULB = getBlockIdByName(blockNames.KELP_BULB);

/**
 * Generate 3D kelp structure.
 *
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} z - World Z coordinate
 * @param {number} progress - Growth progress (0.0 to 1.0)
 *
 * @returns {BlockPlacement[]}
 */
export function generateKelpStructure(x, y, z, progress) {
  const structure = [];

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  const maxHeight = 7;
  const height = Math.floor(maxHeight * progress);

  // Keep growing if no height yet
  if (height === 0) {
    structure.push({ x, y, z, blockId: GROWING });

    return structure;
  }

  // Generate the swaying stem
  for (let i = 0; i < height; i++) {
    // Calculate sway. Increased frequency (i * 0.8) to ensure it curves
    // nicely even with the shorter height.
    const sway = Math.round(Math.sin(i * 0.8 + x * 0.1 + z * 0.1));

    // The top section of kelp consists of bulbs.
    const isTopSection = i >= height - 3;
    const blockId = isTopSection ? BULB : BLADE;

    structure.push({
      x: x + sway,
      y: y + i,
      z: z,
      blockId: blockId,
    });
  }

  // Add a small canopy at the top when fully grown
  if (progress > 0.8) {
    const topBlock = structure[structure.length - 1];
    const topY = topBlock.y;
    const topX = topBlock.x;

    // Create a small cluster (plus shape) at the very top
    const canopyOffsets = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
    ];

    canopyOffsets.forEach((offset) => {
      structure.push({
        x: topX + offset.dx,
        y: topY,
        z: topBlock.z + offset.dz,
        blockId: BULB,
      });
    });
  }

  return structure;
}
