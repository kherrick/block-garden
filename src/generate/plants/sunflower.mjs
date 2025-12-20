import { blockNames } from "../../state/config/blocks.mjs";

/**
 * Generate 3D sunflower structure.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} progress (0.0 to 1.0)
 * @param {Array} blocks
 *
 * @returns {{ x: number, y: number, z: number, blockId: number }[]}
 */
export function generateSunflowerStructure(x, y, z, progress, blocks) {
  const structure = [];
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GROWING = getBlockId(blockNames.SUNFLOWER_GROWING);
  const STEM = getBlockId(blockNames.SUNFLOWER_STEM);
  const LEAVES = getBlockId(blockNames.SUNFLOWER_LEAVES);
  const CENTER = getBlockId(blockNames.SUNFLOWER_CENTER);
  const PETALS = getBlockId(blockNames.SUNFLOWER_PETALS);

  // Early stage
  if (progress < 0.1) {
    structure.push({ x, y, z, blockId: GROWING });
    return structure;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Determine direction to face (sun? random?) - Default North
  // Not needed for simple blocks, but leaves might care? No, blocks are isotropic usually.

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    // Grow UP (+y)
    structure.push({ x, y: y + i, z, blockId: STEM });
  }

  // Leaves
  if (progress > 0.3) {
    const leafSpacing = 2;
    for (let i = leafSpacing; i < currentHeight; i += leafSpacing) {
      // 3D Spiral or alternating?
      // Block Garden was: even->x-1, odd->x+1
      // Let's do:
      // i % 4 == 0 -> x-1
      // i % 4 == 1 -> z-1
      // i % 4 == 2 -> x+1
      // i % 4 == 3 -> z+1

      const mod = (i / leafSpacing) % 4;
      if (mod === 0) structure.push({ x: x - 1, y: y + i, z, blockId: LEAVES });
      if (mod === 1) structure.push({ x, y: y + i, z: z - 1, blockId: LEAVES });
      if (mod === 2) structure.push({ x: x + 1, y: y + i, z, blockId: LEAVES });
      if (mod === 3) structure.push({ x, y: y + i, z: z + 1, blockId: LEAVES });
    }
  }

  // Head
  if (progress > 0.7) {
    const topY = y + currentHeight - 1; // Top of stem

    // Replace top stem with center? Or add on top?
    // Block Garden: `y - currentHeight` (top) -> Center.
    // Here we placed STEM at `y + currentHeight - 1` in loop (i goes 0 to currentHeight-1).
    // Actually loop is `< currentHeight`. Last index is `currentHeight - 1`.
    // So top stem block is at `y + currentHeight - 1`.

    // We should probably allow stem to go all the way, and put center on top?
    // Or center replaces top stem?
    // Block Garden replaces.

    // Find index of top stem and replace, or just overwrite in array (last one wins usually if map/set, but this is array).
    // Let's just put Center at topY, effectively overwriting stem if we pushed it.
    // Actually, let's just push it. `updatePlantGrowth` handles world update logic.
    structure.push({ x, y: topY, z, blockId: CENTER });

    // Petals
    if (progress > 0.85) {
      // Cross pattern in X/Z plane? Or a ring?
      // Block Garden: x-1, x+1, y-1, y+1 (in 2D).
      // 3D: Surrounding the center.
      structure.push({ x: x - 1, y: topY, z, blockId: PETALS });
      structure.push({ x: x + 1, y: topY, z, blockId: PETALS });
      structure.push({ x, y: topY, z: z - 1, blockId: PETALS });
      structure.push({ x, y: topY, z: z + 1, blockId: PETALS });

      // Maybe corners too for a fuller look?
      // structure.push({ x: x - 1, y: topY, z: z - 1, blockId: PETALS });
      // structure.push({ x: x + 1, y: topY, z: z - 1, blockId: PETALS });
      // structure.push({ x: x - 1, y: topY, z: z + 1, blockId: PETALS });
      // structure.push({ x: x + 1, y: topY, z: z + 1, blockId: PETALS });
    }
  }

  return structure;
}
