import { createCube, createProgram, createVBO } from "../util/graphics.mjs";

/**
 *
 * @param {HTMLCanvasElement} cnvs
 *
 * @returns {{
 *   gl: WebGL2RenderingContext,
 *   cbuf: WebGLBuffer,
 *   cube: {
 *     p: Float32Array,
 *     n: Float32Array
 *   },
 *   uL: WebGLUniformLocation,
 *   uM: WebGLUniformLocation,
 *   uMVP: WebGLUniformLocation
 * }}
 */
export function initGameDependencies(cnvs) {
  const gl = cnvs.getContext("webgl2", {
    alpha: false,
    preserveDrawingBuffer: true,
  });

  if (!gl) {
    console.error("WebGL 2 not supported.");

    return;
  }

  const vertexShaderSource = `#version 300 es
    layout(location=0)in vec3 p;
    layout(location=1)in vec3 n;
    layout(location=2)in vec4 c;
    uniform mat4 MVP, M;
    uniform vec3 L;
    out vec4 C;
    out float Lg;
    void main(){
      vec3 nn=normalize((M*vec4(n,0)).xyz);
      float d=max(dot(nn,-L),0.);
      Lg=.3+d*.7;C=c;
      gl_Position=MVP*vec4(p,1);
    }`;

  const fragmentShaderSource = `#version 300 es
    precision highp float;
    in vec4 C;
    in float Lg;
    out vec4 o;
    void main(){o=C*Lg;}
  `;

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  const uMVP = gl.getUniformLocation(program, "MVP");
  const uM = gl.getUniformLocation(program, "M");
  const uL = gl.getUniformLocation(program, "L");

  const cube = createCube();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  createVBO(gl, cube.p, 0);
  createVBO(gl, cube.n, 1);

  const cbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  return {
    gl,
    cbuf,
    cube,
    uL,
    uM,
    uMVP,
  };
}
