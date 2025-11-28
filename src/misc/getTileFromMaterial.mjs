/** @typedef {import('../state/config/tiles.mjs').TileDefinition} TileDefinition */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Looks up a tile definition by material/tile name.
 *
 * Returns null if the material is not a valid tile type.
 *
 * @param {string} materialType - The name of the tile/material to look up (e.g., 'DIRT')
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {TileDefinition|null} The tile definition, or null if not found
 */
export function getTileFromMaterial(materialType, tiles) {
  return tiles[materialType] || null;
}
