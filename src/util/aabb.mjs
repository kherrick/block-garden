/**
 * @typedef {object} AABB
 * @property {number} minX
 * @property {number} minY
 * @property {number} minZ
 * @property {number} maxX
 * @property {number} maxY
 * @property {number} maxZ
 */

/**
 * Checks if two AABBs intersect.
 * @param {AABB} a
 * @param {AABB} b
 * @returns {boolean}
 */
export function intersects(a, b) {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}
