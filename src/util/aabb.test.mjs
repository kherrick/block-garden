// aabb.test.mjs
import { intersects } from "./aabb.mjs";

/**
 * @typedef {import('./aabb.mjs').AABB} AABB
 */

/**
 * Helper to quickly create AABB boxes.
 *
 * @param {number} minX
 * @param {number} minY
 * @param {number} minZ
 * @param {number} maxX
 * @param {number} maxY
 * @param {number} maxZ
 *
 * @returns {AABB}
 */
function A(minX, minY, minZ, maxX, maxY, maxZ) {
  return { minX, minY, minZ, maxX, maxY, maxZ };
}

describe("intersects", () => {
  test("two identical boxes intersect (overlapping)", () => {
    const a = A(0, 0, 0, 2, 2, 2);
    const b = A(0, 0, 0, 2, 2, 2);

    expect(intersects(a, b)).toBe(true);
  });

  test("boxes overlap along all axes", () => {
    const a = A(0, 0, 0, 2, 2, 2);
    const b = A(1, 1, 1, 3, 3, 3);

    expect(intersects(a, b)).toBe(true);
  });

  test("no intersection when separated along X", () => {
    const a = A(0, 0, 0, 1, 2, 2);
    const b = A(2.1, 0, 0, 3, 2, 2);
    expect(intersects(a, b)).toBe(false);
  });

  test("no intersection when separated along Y", () => {
    const a = A(0, 0, 0, 2, 1, 2);
    const b = A(0, 1.5, 0, 2, 3, 2);

    expect(intersects(a, b)).toBe(false);
  });

  test("no intersection when separated along Z", () => {
    const a = A(0, 0, 0, 2, 2, 1);
    const b = A(0, 0, 1.5, 2, 2, 3);

    expect(intersects(a, b)).toBe(false);
  });

  test("boxes touching at faces intersect", () => {
    const a = A(0, 0, 0, 1, 1, 1);
    const b = A(1, 0, 0, 2, 1, 1); // touching at x = 1
    expect(intersects(a, b)).toBe(true);
  });

  test("one box entirely inside another", () => {
    const outer = A(-1, -1, -1, 5, 5, 5);
    const inner = A(0, 0, 0, 2, 2, 2);

    expect(intersects(outer, inner)).toBe(true);
    expect(intersects(inner, outer)).toBe(true);
  });

  test("degenerate box (zero volume) intersects when on surface", () => {
    const a = A(0, 0, 0, 0, 0, 0);
    const b = A(0, 0, 0, 1, 1, 1);

    expect(intersects(a, b)).toBe(true);
  });

  test("degenerate box does not intersect when disjoint", () => {
    const a = A(0, 0, 0, 0, 0, 0);
    const b = A(1, 1, 1, 2, 2, 2);

    expect(intersects(a, b)).toBe(false);
  });

  test("intersects is symmetric", () => {
    const a = A(-2, -2, -2, 2, 2, 2);
    const b = A(-1, -1, -1, 1, 1, 1);

    expect(intersects(a, b)).toBe(true);
    expect(intersects(b, a)).toBe(true);
  });

  test("very large boxes intersect", () => {
    const a = A(-1e9, -1e9, -1e9, 1e9, 1e9, 1e9);
    const b = A(-5e8, -5e8, -5e8, 5e8, 5e8, 5e8);

    expect(intersects(a, b)).toBe(true);
  });

  test("non-number inputs return false", () => {
    const a = A(0, 0, 0, 1, 1, 1);
    const bad = { minX: "a", minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 };

    expect(intersects(a, bad)).toBe(false);
  });
});
