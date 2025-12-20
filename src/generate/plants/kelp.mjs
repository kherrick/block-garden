import { blockNames } from "../../state/config/blocks.mjs";

export function generateKelpStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.KELP_GROWING);
  const BLADE = getBlockId(blockNames.KELP_BLADE);
  const BULB = getBlockId(blockNames.KELP_BULB);

  // Checks if underwater? Assuming placed underwater for now.

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  const maxHeight = 10;
  const height = Math.floor(maxHeight * progress);

  for (let i = 0; i < height; i++) {
    const isBulb = i === height - 1 || i % 4 === 3;
    const block = isBulb ? BULB : BLADE;
    structure.push({ x, y: y + i, z, blockId: block });
  }

  return structure;
}
