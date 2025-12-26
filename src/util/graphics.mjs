/**
 * Compile a WebGL shader.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context.
 * @param {number} type - The shader type (VERTEX_SHADER or FRAGMENT_SHADER).
 * @param {string} source - The GLSL source code.
 *
 * @returns {WebGLShader} The compiled shader.
 */
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Optional debug check
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

/**
 * Create and link a WebGL program from vertex and fragment shaders.
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context.
 * @param {string} vsSource - Vertex shader source code.
 * @param {string} fsSource - Fragment shader source code.
 *
 * @returns {WebGLProgram} The linked shader program.
 */
export function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  return program;
}

/**
 * Generate cube geometry data (positions and normals).
 *
 * @returns {{p: Float32Array, n: Float32Array, cnt: number}} Cube vertex data.
 */
export function createCube() {
  const positions = [];
  const normals = [];

  const faces = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  const vertices = [
    [-0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5],
    [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5],
    [-0.5, 0.5, 0.5],
  ];

  const indices = [
    [1, 5, 6, 1, 6, 2],
    [4, 0, 3, 4, 3, 7],
    [3, 2, 6, 3, 6, 7],
    [4, 5, 1, 4, 1, 0],
    [5, 4, 7, 5, 7, 6],
    [0, 1, 2, 0, 2, 3],
  ];

  faces.forEach((F, fi) =>
    indices[fi].forEach((V) => {
      positions.push(...vertices[V]);
      normals.push(...F);
    }),
  );

  return {
    p: new Float32Array(positions),
    n: new Float32Array(normals),
    cnt: positions.length / 3,
  };
}

/**
 * Create and bind a vertex buffer object (VBO).
 *
 * @param {WebGL2RenderingContext} gl - The WebGL context.
 * @param {Float32Array} data - The vertex or normal data.
 * @param {number} loc - The vertex attribute location.
 *
 * @param {number} [size=3] - Number of components per vertex attribute.
 */
export function createVBO(gl, data, loc, size = 3) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}
