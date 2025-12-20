import { blockNames } from "../../state/config/blocks.mjs";

export function generateCactusStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.CACTUS_GROWING);
  const BODY = getBlockId(blockNames.CACTUS_BODY);
  const FLOWER = getBlockId(blockNames.CACTUS_FLOWER);

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  const maxHeight = 4;
  const height = Math.max(1, Math.floor(maxHeight * progress));

  // Trunk
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: BODY });
  }

  // Arms
  if (progress > 0.4 && height > 2) {
    structure.push({ x: x + 1, y: y + 1, z, blockId: BODY });
    structure.push({ x: x + 1, y: y + 2, z, blockId: BODY });
  }
  if (progress > 0.6 && height > 2) {
    structure.push({ x: x - 1, y: y + 2, z, blockId: BODY });
    structure.push({ x: x - 1, y: y + 3, z, blockId: BODY });
  }

  // Flower
  if (progress > 0.9) {
    structure.push({ x, y: y + height, z, blockId: FLOWER });
    if (progress > 0.95) {
      // Flowers on arms?
      structure.push({ x: x + 1, y: y + 3, z, blockId: FLOWER });
      structure.push({ x: x - 1, y: y + 4, z, blockId: FLOWER });
    }
  }

  return structure;
}
