/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

describe("graphics.mjs", () => {
  describe("createCube", () => {
    let createCube;
    beforeAll(async () => {
      ({ createCube } = await import("./graphics.mjs"));
    });

    test("returns correct cube vertex data structure", () => {
      const cube = createCube();
      expect(cube).toHaveProperty("p");
      expect(cube).toHaveProperty("n");
      expect(cube).toHaveProperty("cnt");
      expect(cube.p).toBeInstanceOf(Float32Array);
      expect(cube.n).toBeInstanceOf(Float32Array);
      expect(typeof cube.cnt).toBe("number");
    });

    test("cube has 36 vertices (12 triangles)", () => {
      const cube = createCube();
      expect(cube.cnt).toBe(36);
      expect(cube.p.length).toBe(36 * 3);
      expect(cube.n.length).toBe(36 * 3);
    });

    test("all normals are axis-aligned", () => {
      const cube = createCube();
      for (let i = 0; i < cube.n.length; i += 3) {
        const nx = cube.n[i],
          ny = cube.n[i + 1],
          nz = cube.n[i + 2];
        // Only one component should be nonzero and must be -1 or 1
        const nonzero = [nx, ny, nz].filter((v) => v !== 0);
        expect(nonzero.length).toBe(1);
        expect(Math.abs(nonzero[0])).toBe(1);
      }
    });
  });

  describe("createProgram and createVBO", () => {
    let gl;
    let createProgram, createVBO;
    beforeAll(async () => {
      ({ createProgram, createVBO } = await import("./graphics.mjs"));
    });
    beforeEach(() => {
      // Minimal WebGL2 context mock
      gl = {
        VERTEX_SHADER: 0x8b31,
        FRAGMENT_SHADER: 0x8b30,
        createShader: jest.fn(() => ({})),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        getShaderParameter: jest.fn(() => true),
        getShaderInfoLog: jest.fn(() => ""),
        createProgram: jest.fn(() => ({})),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        createBuffer: jest.fn(() => ({})),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        ARRAY_BUFFER: 0x8892,
        STATIC_DRAW: 0x88e4,
      };
    });

    test("createProgram compiles and links shaders", () => {
      const vsSource = "void main() {}";
      const fsSource = "void main() {}";
      const program = createProgram(gl, vsSource, fsSource);
      expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
      expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
      expect(gl.attachShader).toHaveBeenCalled();
      expect(gl.linkProgram).toHaveBeenCalled();
      expect(gl.useProgram).toHaveBeenCalled();
      expect(program).toBeDefined();
    });

    test("createVBO creates and binds buffer, sets attrib pointer", () => {
      const data = new Float32Array([0, 1, 2, 3, 4, 5]);
      createVBO(gl, data, 2, 3);
      expect(gl.createBuffer).toHaveBeenCalled();
      expect(gl.bindBuffer).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        expect.any(Object),
      );
      expect(gl.bufferData).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        data,
        gl.STATIC_DRAW,
      );
      expect(gl.enableVertexAttribArray).toHaveBeenCalledWith(2);
      expect(gl.vertexAttribPointer).toHaveBeenCalledWith(
        2,
        3,
        gl.FLOAT,
        false,
        0,
        0,
      );
    });
  });
});
