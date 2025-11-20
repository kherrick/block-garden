/**
 * @param {number} min
 * @param {number} max
 *
 * @returns {number}
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
