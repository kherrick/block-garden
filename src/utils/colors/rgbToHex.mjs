/**
 * Converts RGB color component values to a hexadecimal color string.
 *
 * Each component (red, green, blue) should be an integer between 0 and 255.
 * The output is a string in the format "#rrggbb".
 *
 * @param {number} r - Red component (0-255).
 * @param {number} g - Green component (0-255).
 * @param {number} b - Blue component (0-255).
 *
 * @returns {string} Hexadecimal color string in the format "#rrggbb".
 */
export function rgbToHex(r, g, b) {
  const componentToHex = (c) => {
    const hex = c.toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
