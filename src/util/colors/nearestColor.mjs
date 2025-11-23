/**
 * Finds the nearest color in the given palette to the specified RGB color
 * by Euclidean distance in RGB space.
 *
 * @param {number[][]} paletteRGB - Array of RGB colors, each color is an array [r, g, b].
 * @param {number} r - Red component of the target color (0-255).
 * @param {number} g - Green component of the target color (0-255).
 * @param {number} b - Blue component of the target color (0-255).
 *
 * @returns {number[]} The nearest RGB color from the palette as [r, g, b].
 */
export function nearestColor(paletteRGB, r, g, b) {
  let minDist = Infinity;
  let best = paletteRGB[0];

  for (const col of paletteRGB) {
    const dist = (r - col[0]) ** 2 + (g - col[1]) ** 2 + (b - col[2]) ** 2;

    if (dist < minDist) {
      minDist = dist;
      best = col;
    }
  }

  return best;
}
