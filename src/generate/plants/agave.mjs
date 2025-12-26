import { blockNames } from "../../state/config/blocks.mjs";

export function generateAgaveStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.AGAVE_GROWING);
  const BASE = getBlockId(blockNames.AGAVE_BASE);
  const SPIKE = getBlockId(blockNames.AGAVE_SPIKE);
  const STALK = getBlockId(blockNames.AGAVE_FLOWER_STALK);
  const FLOWER = getBlockId(blockNames.AGAVE_FLOWER);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Base
  structure.push({ x, y, z, blockId: BASE });

  if (progress > 0.4) {
    // Spikes around base
    if (progress > 0.5) structure.push({ x: x - 1, y, z, blockId: SPIKE });
    if (progress > 0.55) structure.push({ x: x + 1, y, z, blockId: SPIKE });
    if (progress > 0.6) structure.push({ x, y, z: z - 1, blockId: SPIKE });
    if (progress > 0.65) structure.push({ x, y, z: z + 1, blockId: SPIKE });
  }

  // Flower Stalk
  if (progress > 0.8) {
    const height = 3;
    const currentHeight = Math.ceil(height * ((progress - 0.8) / 0.2));

    for (let i = 1; i <= height; i++) {
      // Grow from 1 above base
      if (i === height && progress > 0.95) {
        structure.push({ x, y: y + i, z, blockId: FLOWER });
      } else {
        structure.push({ x, y: y + i, z, blockId: STALK });
      }
    }
  }

  return structure;
}
