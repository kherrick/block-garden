/**
 * General color names mapped to hex codes (may include alpha).
 * @typedef {{ [key: string]: string }} ColorMap
 */

/**
 * Block-specific color names mapped to hex codes for in-game assets.
 * @typedef {{ [key: string]: string }} UIColorMap
 */

/**
 * Block-specific color names mapped to hex codes for in-game assets.
 * @typedef {{ [key: string]: string }} BlockColorMap
 */

/**
 * CSS Custom Properties Map
 * @typedef {{[key: string]: string} & ColorMap & BlockColorMap} CombinedColorMap
 */

/**
 * General color names mapped to hex codes (may include alpha), without prefixes ('--bg-color').
 * @typedef {{ [key: string]: string }} ColorMapWithoutPrefixes
 */

/**
 * Block-specific color names without prefixes ('--bg-block-color').
 * @typedef {{ [key: string]: string }} BlockColorMapWithoutPrefixes
 */

/**
 * Colors used for styling game elements and blocks.
 * @typedef {Object} Colors
 *
 * @property {ColorMapWithoutPrefixes} color - General UI colors as hex strings.
 * @property {BlockColorMapWithoutPrefixes} block - Block colors as hex strings.
 * @property {UIColorMap} ui - UI colors applied.
 */
