import { blockNames } from "../../state/config/blocks.mjs";

export function generateBerryBushStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.BERRY_BUSH_GROWING);
  const BRANCH = getBlockId(blockNames.BERRY_BUSH_BRANCH);
  const LEAVES = getBlockId(blockNames.BERRY_BUSH_LEAVES);
  const BERRIES = getBlockId(blockNames.BERRY_BUSH_BERRIES);

  if (progress < 0.2) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  // Small bush structure
  // Center branch
  structure.push({ x, y, z, blockId: BRANCH });

  if (progress > 0.4) {
    // Leaves around
    structure.push({ x: x + 1, y, z, blockId: LEAVES });
    structure.push({ x: x - 1, y, z, blockId: LEAVES });
    structure.push({ x, y, z: z + 1, blockId: LEAVES });
    structure.push({ x, y, z: z - 1, blockId: LEAVES });

    // Top leaves
    structure.push({ x, y: y + 1, z, blockId: LEAVES });
  }

  if (progress > 0.8) {
    // Berries on outside
    structure.push({ x: x + 1, y: y + 1, z, blockId: BERRIES });
    structure.push({ x: x - 1, y: y + 1, z, blockId: BERRIES });
    structure.push({ x, y: y + 1, z: z + 1, blockId: BERRIES });
    structure.push({ x, y: y + 1, z: z - 1, blockId: BERRIES });
  }

  return structure;
}
