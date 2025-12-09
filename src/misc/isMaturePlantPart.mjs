/**
 * Checks if a tile position is part of a mature plant structure.
 *
 * Used to determine if breaking this tile should harvest the entire plant.
 *
 * @param {number} x - X coordinate in tiles
 * @param {number} y - Y coordinate in tiles
 * @param {Object} plantStructures - State Signal containing all plant structures
 *
 * @returns {boolean} True if tile is part of a mature plant
 */
export function isMaturePlantPart(x, y, plantStructures) {
  for (const [key, structure] of Object.entries(plantStructures.get())) {
    if (structure.mature && structure.blocks) {
      // Blocks can be an array or an object depending on save format
      const blocksArray = Array.isArray(structure.blocks)
        ? structure.blocks
        : Object.values(structure.blocks);

      if (blocksArray.find((b) => b.x === x && b.y === y)) {
        return true;
      }
    }
  }

  return false;
}
