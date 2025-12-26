import { blockNames } from "../../state/config/blocks.mjs";

export function generateWheatStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.WHEAT_GROWING);
  const STALK = getBlockId(blockNames.WHEAT_STALK);
  const GRAIN = getBlockId(blockNames.WHEAT_GRAIN);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  structure.push({ x, y, z, blockId: STALK });

  if (progress > 0.5) {
    structure.push({ x, y: y + 1, z, blockId: STALK });
  }

  if (progress > 0.8) {
    // Grain head
    structure.push({ x, y: y + 2, z, blockId: GRAIN });
  }

  return structure;
}
