/**
 * General color names mapped to hex codes (may include alpha).
 * @typedef {{ [key: string]: string }} ColorMap
 */

/**
 * Tile-specific color names mapped to hex codes for in-game assets.
 * @typedef {{ [key: string]: string }} TileColorMap
 */

/**
 * CSS Custom Properties Map
 * @typedef {{[key: string]: string} & ColorMap & TileColorMap} CombinedMap
 */

/**
 * General color names mapped to hex codes (may include alpha), without prefixes ('--sg-color').
 * @typedef {{ [key: string]: string }} ColorMapWithoutPrefixes
 */

/**
 * Tile-specific color names without prefixes ('--sg-tile-color').
 * @typedef {{ [key: string]: string }} TileColorMapWithoutPrefixes
 */

/**
 * Colors used for styling game elements and tiles.
 * @typedef {Object} GameColors
 *
 * @property {ColorMapWithoutPrefixes} color - General UI colors as hex strings.
 * @property {TileColorMapWithoutPrefixes} tile-color - Tile colors as hex strings.
 */
