/**
 * Gravity Queue - Tracks blocks that need gravity processing.
 *
 * Uses a Set for O(1) deduplication to prevent processing the same
 * block multiple times per frame.
 *
 * @class GravityQueue
 */
export class GravityQueue {
  constructor() {
    /** @type {Set<string>} */
    this.candidates = new Set();
  }

  /**
   * Get the number of pending candidates.
   * @returns {number}
   */
  get size() {
    return this.candidates.size;
  }

  /**
   * Add a block position to the gravity queue.
   * Duplicate positions are automatically deduplicated.
   *
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} z - World Z coordinate
   */
  enqueue(x, y, z) {
    // Skip y <= 1 since blocks at y=1 can't fall (ground is at y=0)
    if (y <= 1) {
      return;
    }

    this.candidates.add(`${x},${y},${z}`);
  }

  /**
   * Remove and return up to `limit` candidates from the queue.
   *
   * @param {number} limit - Maximum number of candidates to return
   * @returns {{x: number, y: number, z: number}[]}
   */
  dequeue(limit) {
    const results = [];
    const iterator = this.candidates.values();

    for (let i = 0; i < limit; i++) {
      const next = iterator.next();
      if (next.done) {
        break;
      }

      const key = next.value;
      this.candidates.delete(key);

      const [x, y, z] = key.split(",").map(Number);
      results.push({ x, y, z });
    }

    return results;
  }

  /**
   * Clear all pending candidates.
   */
  clear() {
    this.candidates.clear();
  }

  /**
   * Check if a position is already in the queue.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  has(x, y, z) {
    return this.candidates.has(`${x},${y},${z}`);
  }
}
