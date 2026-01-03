import { blocks } from "./blocks.mjs";

/**
 * Get the numeric ID (index) of a block by its name.
 *
 * @param {string} name - The display name of the block
 *
 * @returns {number} The index of the block in the blocks array, or -1 if not found
 */
export function getBlockIdByName(name) {
  return blocks.findIndex((block) => block.name === name);
}
