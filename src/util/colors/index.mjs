/**
 * General color names mapped to hex codes (may include alpha).
 * @typedef {{ [key: string]: string }} ColorMap
 */

/**
 * Tile-specific color names mapped to hex codes for in-game assets.
 * @typedef {{ [key: string]: string }} UIColorMap
 */

/**
 * Tile-specific color names mapped to hex codes for in-game assets.
 * @typedef {{ [key: string]: string }} TileColorMap
 */

/**
 * CSS Custom Properties Map
 * @typedef {{[key: string]: string} & ColorMap & TileColorMap} CombinedColorMap
 */

/**
 * General color names mapped to hex codes (may include alpha), without prefixes ('--bg-color').
 * @typedef {{ [key: string]: string }} ColorMapWithoutPrefixes
 */

/**
 * Tile-specific color names without prefixes ('--bg-tile-color').
 * @typedef {{ [key: string]: string }} TileColorMapWithoutPrefixes
 */

/**
 * Colors used for styling game elements and tiles.
 * @typedef {Object} Colors
 *
 * @property {ColorMapWithoutPrefixes} color - General UI colors as hex strings.
 * @property {UIColorMap} ui - UI colors applied.
 */
