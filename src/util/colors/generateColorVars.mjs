/**
 * Generate CSS custom property declarations as a string.
 *
 * @param {string} prefix - The required prefix to prepend to each color key.
 * @param {{ [key: string]: * }} colors - An object whose keys represent color names and values are hex color codes (without #).
 *
 * @returns {string} A string containing CSS custom property declarations, one per color key.
 *
 * @example
 * generateColorVars('--bg-tile-', { air: "87ceeb" });
 * // returns "--bg-tile-air-color: #87ceeb;"
 */
export function generateColorVars(prefix, colors) {
  return Object.entries(colors)
    .map(
      ([key, value]) =>
        `${prefix}${key}${prefix === "--bg-color-" ? "" : "-color"}: ${value};`,
    )
    .join("\n");
}
