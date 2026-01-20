/**
 * Normalize an RGB(A) color array from 0-255 range to 0-1 range.
 *
 * @param {number[]} rgba
 *
 * @returns {number[]}
 */
export function normalizeRGBToRGBA(rgba) {
  const r = rgba[0] / 255;
  const g = rgba[1] / 255;
  const b = rgba[2] / 255;

  // use 1 if alpha not present
  const a = rgba.length > 3 ? rgba[3] : 1;

  return [r, g, b, a];
}
