/**
 * @param {any} materialType
 * @param {any} tiles
 *
 * @returns {any}
 */
export function getTileFromMaterial(materialType, tiles) {
  return tiles[materialType] || null;
}
