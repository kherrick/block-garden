import {
  addMaterial,
  addSeed,
  toInventoryKey,
} from "../core/systems/game/state.mjs";

import { blocks } from "../core/world/config/blocks.mjs";

import { showToast } from "../api/ui/toast.mjs";

import { getShadowRoot } from "../ui/utils/getShadowRoot.mjs";

/**
 * Collects drops from a broken block.
 *
 * @param {number} blockId - The ID of the broken block
 * @param {object} [options] - Collection options
 * @param {boolean} [options.isImmature] - If breaking an immature plant (guaranteed seed return)
 * @param {boolean} [options.silent] - If true, do not show a toast notification
 * @param {boolean} [options.isRoot] - If true, this is the root block of a plant structure (guaranteed seed)
 * @param {boolean} [options.includeBlock] - If true, the block itself will be added to materials
 *
 * @returns {{ materials: string[], seeds: string[] }} Collected items for UI feedback
 */
/**
 * Collects drops from a broken block.
 * @param {number} blockId - The ID of the broken block
 * @param {Object} [options={}] - Collection options
 * @param {boolean} [options.isImmature] - If breaking an immature plant (guaranteed seed return)
 * @param {boolean} [options.silent] - If true, do not show a toast notification
 * @param {boolean} [options.isRoot] - If true, this is the root block of a plant structure (guaranteed seed)
 * @param {boolean} [options.includeBlock] - If true, the block itself will be added to materials
 * @returns {{ materials: string[], seeds: string[] }} Collected items for UI feedback
 */
export function collectDrop(blockId, options = {}) {
  const block = blocks.getById(blockId);
  if (!block) {
    return { materials: [], seeds: [] };
  }

  // Aggregated counts for toast
  /** @type {{materials: Record<string, number>, seeds: Record<string, number>}} */
  const counts = { materials: {}, seeds: {} };
  // Arrays for return compatibility
  /** @type {{materials: string[], seeds: string[]}} */
  const collected = { materials: [], seeds: [] };

  // Handle explicit drops defined in block config
  if (block.drops) {
    const drops = Array.isArray(block.drops) ? block.drops : [block.drops];

    for (const drop of drops) {
      const dropBlock = blocks.getByName(drop);
      if (!dropBlock) {
        continue;
      }

      const dropKey = toInventoryKey(drop);

      // Seeds go to seed inventory
      if (dropBlock.isSeed) {
        // Determine drop probability and count
        let dropProbability = 0.05; // Baseline 5% for "extra" seeds from parts
        let dropCount = 1;

        if (options.isImmature) {
          // Immature plants always return exactly 1 seed ONLY for the root block
          if (!options.isRoot) {
            continue;
          }

          dropProbability = 1.0;
          dropCount = 1;
        } else if (options.isRoot) {
          // Root blocks of mature plants always return 2 seeds
          dropProbability = 1.0;
          dropCount = 2;
        } else if (block.name === drop) {
          // If the block drops itself (mostly mature crops), always return 1
          dropProbability = 1.0;
          dropCount = 1;
        }

        if (dropProbability >= 1.0 || Math.random() < dropProbability) {
          addSeed(dropKey, dropCount);

          counts.seeds[drop] = (counts.seeds[drop] || 0) + dropCount;
          for (let i = 0; i < dropCount; i++) {
            collected.seeds.push(drop);
          }
        }
      } else if (!options.isImmature || drop.includes("Growing")) {
        // Regular materials (always 100%) - skip if immature (unless it's a "Growing" block)
        addMaterial(dropKey, 1);

        counts.materials[drop] = (counts.materials[drop] || 0) + 1;

        collected.materials.push(drop);
      }
    }
  }

  // Handle includeBlock option (collect the part itself)
  // Allow bud blocks to be collected even when immature (only if the block IS a bud)
  const isBudBlock = block.name.includes("Bud");
  if (
    options.includeBlock &&
    block.name !== "Air" &&
    (!options.isImmature || isBudBlock)
  ) {
    const blockKey = toInventoryKey(block.name);
    addMaterial(blockKey, 1);

    counts.materials[block.name] = (counts.materials[block.name] || 0) + 1;

    collected.materials.push(block.name);
  }

  const hasMaterials = Object.keys(counts.materials).length > 0;
  const hasSeeds = Object.keys(counts.seeds).length > 0;

  /** @typedef {import('../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

  if (!options.silent && (hasMaterials || hasSeeds)) {
    const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
    const shadow = getShadowRoot(gThis.document, "block-garden");
    if (shadow) {
      const items = [];
      for (const [name, count] of Object.entries(counts.materials)) {
        items.push(count > 1 ? `${name} x${count}` : name);
      }

      for (const [name, count] of Object.entries(counts.seeds)) {
        items.push(count > 1 ? `${name} x${count}` : name);
      }

      const msg = `Collected: ${items.join(", ")}`;
      showToast(shadow, msg);
    }
  }

  return collected;
}
