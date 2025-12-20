import { blockNames } from "../../state/config/blocks.mjs";

export function generateCarrotStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.CARROT_GROWING);
  const LEAVES = getBlockId(blockNames.CARROT_LEAVES);
  const ROOT = getBlockId(blockNames.CARROT_ROOT);

  // Carrots grow DOWN into ground if possible? But we placed on top.
  // Block Garden: Root is tile, Leaves are tile.
  // Let's make root at y (where placed/planted) and leaves above.

  if (progress < 0.3) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Root (visible part or bury it?)
  // If we plant "seeds" they are usually on top of dirt.
  // So the root block sits on dirt.
  structure.push({ x, y, z, blockId: ROOT });

  // Leaves
  if (progress > 0.6) {
    structure.push({ x, y: y + 1, z, blockId: LEAVES });
  }

  return structure;
}
