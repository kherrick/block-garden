/**
 * Generates a random integer within the specified range (inclusive).
 *
 * Uses Math.random() for pseudo-random number generation.
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 *
 * @returns {number} Random integer between min and max
 *
 * @example
 * getRandomInt(1, 6) // Returns a number from 1 to 6 (like a die roll)
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
