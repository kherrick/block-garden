/**
 * Produce an array of CSS custom property names from a color object.
 *
 * @param {string} prefix - The prefix to prepend to each color key.
 * @param {{ [key: string]: * }} colors - An object whose keys represent color names.
 *
 * @returns {string[]} Array of property strings in the form `prefix-key`.
 *
 * @prefix prefix required for color key explanations.
 *
 * @example
 * getColorPropList('--bg-block-color-', { air: "87ceeb" });
 * // returns ["--bg-block-air-color"]
 */
export const getColorPropList = (prefix, colors) =>
  Object.keys(colors).map((key) => `${prefix}${key}`);
