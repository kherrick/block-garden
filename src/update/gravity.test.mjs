/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import { GravityQueue } from "./gravity.mjs";

describe("GravityQueue", () => {
  /** @type {GravityQueue} */
  let queue;

  beforeEach(() => {
    queue = new GravityQueue();
  });

  describe("constructor", () => {
    test("initializes with empty candidates set", () => {
      expect(queue.size).toBe(0);
    });
  });

  describe("enqueue", () => {
    test("adds position to queue", () => {
      queue.enqueue(5, 10, 5);
      expect(queue.size).toBe(1);
    });

    test("deduplicates same position", () => {
      queue.enqueue(5, 10, 5);
      queue.enqueue(5, 10, 5);
      queue.enqueue(5, 10, 5);
      expect(queue.size).toBe(1);
    });

    test("skips y <= 1 (at ground level)", () => {
      queue.enqueue(5, 1, 5);
      queue.enqueue(5, 0, 5);
      queue.enqueue(5, -1, 5);
      expect(queue.size).toBe(0);
    });

    test("accepts y > 1", () => {
      queue.enqueue(5, 2, 5);
      expect(queue.size).toBe(1);
    });
  });

  describe("dequeue", () => {
    test("returns empty array when queue is empty", () => {
      const results = queue.dequeue(10);
      expect(results).toEqual([]);
    });

    test("returns up to limit candidates", () => {
      queue.enqueue(1, 10, 1);
      queue.enqueue(2, 10, 2);
      queue.enqueue(3, 10, 3);

      const results = queue.dequeue(2);
      expect(results.length).toBe(2);
      expect(queue.size).toBe(1);
    });

    test("removes dequeued items from queue", () => {
      queue.enqueue(5, 10, 5);
      queue.dequeue(1);
      expect(queue.size).toBe(0);
    });

    test("returns parsed coordinates", () => {
      queue.enqueue(5, 10, 7);
      const [result] = queue.dequeue(1);
      expect(result).toEqual({ x: 5, y: 10, z: 7 });
    });

    test("handles negative coordinates", () => {
      queue.enqueue(-5, 10, -7);
      const [result] = queue.dequeue(1);
      expect(result).toEqual({ x: -5, y: 10, z: -7 });
    });
  });

  describe("has", () => {
    test("returns false for empty queue", () => {
      expect(queue.has(5, 10, 5)).toBe(false);
    });

    test("returns true for enqueued position", () => {
      queue.enqueue(5, 10, 5);
      expect(queue.has(5, 10, 5)).toBe(true);
    });

    test("returns false after dequeue", () => {
      queue.enqueue(5, 10, 5);
      queue.dequeue(1);
      expect(queue.has(5, 10, 5)).toBe(false);
    });
  });

  describe("clear", () => {
    test("removes all candidates", () => {
      queue.enqueue(1, 10, 1);
      queue.enqueue(2, 10, 2);
      queue.clear();
      expect(queue.size).toBe(0);
    });
  });
});
