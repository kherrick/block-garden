/** @typedef {import('../state/config/tiles.mjs').TileDefinition} TileDefinition */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Gets the material that drops from a tile, or falls back to the tile's ID.
 *
 * Useful for determining what inventory item to add when harvesting.
 *
 * @param {TileDefinition|null} tile - The tile definition
 * @param {TileMap} tiles - Map of all tiles for ID lookup
 *
 * @returns {string|string[]|null} Material name(s) or tile ID, or null if unavailable
 */
export function getMaterialFromTile(tile, tiles) {
  return (
    tile?.drops ??
    Object.fromEntries(Object.entries(tiles).map(([k, v]) => [v.id, k]))[
      tile.id
    ]
  );
}
