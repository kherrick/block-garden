/**
 * @jest-environment node
 */
import { I, persp, look, mul, trans } from "./math.mjs";

describe("math.mjs", () => {
  test("I() returns 4x4 identity matrix", () => {
    const m = I();
    expect(m).toBeInstanceOf(Float32Array);
    expect(m.length).toBe(16);
    // Diagonal should be 1, rest 0
    for (let i = 0; i < 16; i++) {
      if (i % 5 === 0) {
        expect(m[i]).toBe(1);
      } else {
        expect(m[i]).toBe(0);
      }
    }
  });

  test("persp() sets perspective projection matrix", () => {
    const m = new Float32Array(16);
    const out = persp(m, Math.PI / 2, 1, 0.1, 100);
    expect(out).toBe(m);
    // Check some known properties
    expect(m[15]).toBe(0);
    expect(m[11]).toBe(-1);
  });

  test("look() sets look-at matrix", () => {
    const m = new Float32Array(16);
    const eye = [0, 0, 1];
    const center = [0, 0, 0];
    const up = [0, 1, 0];
    const out = look(m, eye, center, up);
    expect(out).toBe(m);
    expect(m[14]).toBeCloseTo(-1);
    expect(m[12]).toBeCloseTo(0);
    expect(m[13]).toBeCloseTo(0);
  });

  test("mul() multiplies two 4x4 matrices", () => {
    const a = I();
    const b = I();
    const m = new Float32Array(16);
    mul(m, a, b);
    // Identity * Identity = Identity
    for (let i = 0; i < 16; i++) {
      expect(m[i]).toBe(a[i]);
    }
  });

  test("trans() translates a matrix by a vector", () => {
    const a = I();
    const v = [1, 2, 3];
    const m = new Float32Array(16);
    trans(m, a, v);
    expect(m[12]).toBe(1);
    expect(m[13]).toBe(2);
    expect(m[14]).toBe(3);
  });
});
