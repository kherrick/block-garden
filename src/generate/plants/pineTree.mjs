import { blockNames } from "../../state/config/blocks.mjs";

export function generatePineTreeStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.PINE_TREE_GROWING);
  const TRUNK = getBlockId(blockNames.PINE_TRUNK);
  const NEEDLES = getBlockId(blockNames.PINE_NEEDLES);
  // Pine cone? Block Garden uses it as drop.

  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  const maxHeight = 7;
  const height = Math.floor(maxHeight * progress);

  // Trunk
  for (let i = 0; i < height; i++) {
    structure.push({ x, y: y + i, z, blockId: TRUNK });
  }

  // Needles
  if (progress > 0.4) {
    // Conical shape
    // Bottom layer
    for (let i = 3; i < height; i++) {
      const width = Math.max(1, Math.floor((height - i) / 2));
      // If width > 0, make ring/square
      if (width >= 1) {
        // Simple + shape for now or square?
        structure.push({ x: x + 1, y: y + i, z, blockId: NEEDLES });
        structure.push({ x: x - 1, y: y + i, z, blockId: NEEDLES });
        structure.push({ x, y: y + i, z: z + 1, blockId: NEEDLES });
        structure.push({ x, y: y + i, z: z - 1, blockId: NEEDLES });

        if (width > 1) {
          // Corners
          structure.push({ x: x + 1, y: y + i, z: z + 1, blockId: NEEDLES });
          structure.push({ x: x - 1, y: y + i, z: z + 1, blockId: NEEDLES });
          structure.push({ x: x + 1, y: y + i, z: z - 1, blockId: NEEDLES });
          structure.push({ x: x - 1, y: y + i, z: z - 1, blockId: NEEDLES });
        }
      }
    }
    // Top
    structure.push({ x, y: y + height, z, blockId: NEEDLES });
  }

  return structure;
}
