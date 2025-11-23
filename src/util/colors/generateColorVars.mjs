/**
 * Generate CSS custom property declarations as a string.
 *
 * @param {string} prefix - The required prefix to prepend to each color key.
 * @param {{ [key: string]: * }} colors - An object whose keys represent color names and values are hex color codes (without #).
 * @returns {string} A string containing CSS custom property declarations, one per color key.
 *
 * @example
 * generateColorVars('--sg-tile-color-', { air: "87ceeb", "bamboo-growing": "98fb98" });
 * // returns "--sg-tile-color-air: #87ceeb;\n--sg-tile-color-bamboo-growing: #98fb98;"
 */
export function generateColorVars(prefix, colors) {
  return Object.entries(colors)
    .map(([key, value]) => `${prefix}${key}: ${value};`)
    .join("\n");
}
