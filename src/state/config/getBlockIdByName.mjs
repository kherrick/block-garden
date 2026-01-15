import { getBlockByName } from "./blocks.mjs";

/**
 * Get the numeric ID of a block by its name.
 *
 * @param {string} name - The display name of the block
 *
 * @returns {number} The ID of the block, or -1 if not found
 */
export function getBlockIdByName(name) {
  const block = getBlockByName(name);
  return block ? block.id : -1;
}
