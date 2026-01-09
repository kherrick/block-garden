import { createCube, createProgram, createVBO } from "../util/graphics.mjs";
import { generateTextureAtlas } from "../util/atlasGenerator.mjs";

/**
 *
 * @param {HTMLCanvasElement} cnvs
 * @param {import('../state/config/blocks.mjs').BlockDefinition[]} [blockDefs]
 *
 * @returns {{
 *   gl: WebGL2RenderingContext,
 *   cbuf: WebGLBuffer,
 *   uvbuf: WebGLBuffer,
 *   aobuf: WebGLBuffer,
 *   cube: {
 *     p: Float32Array,
 *     n: Float32Array
 *   },
 *   uL: WebGLUniformLocation,
 *   uM: WebGLUniformLocation,
 *   uMVP: WebGLUniformLocation,
 *   uT: WebGLUniformLocation,
 *   uUT: WebGLUniformLocation,
 *   uUAO: WebGLUniformLocation,
 *   uULG: WebGLUniformLocation,
 *   uUAOD: WebGLUniformLocation,
 *   luvbuf: WebGLBuffer,
 *   caoful: WebGLBuffer
 * }}
 */
export function initGameDependencies(cnvs, blockDefs = []) {
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
    layout(location=3)in vec2 uv;
    layout(location=4)in float ao;
    layout(location=5)in vec2 localUV;
    layout(location=6)in vec4 cornerAO;

    uniform mat4 MVP, M;
    uniform vec3 L;
    uniform float uULG; // Use Per-Face Lighting (1.0 or 0.0)

    out vec4 C;
    out vec2 Vuv;
    out float Lg;
    out float Vao;
    out vec2 VlocalUV;
    out vec4 VcornerAO;

    void main(){
      vec3 nn=normalize((M*vec4(n,0)).xyz);
      float d=max(dot(nn,-L),0.);
      // Per-face lighting (directional) + ambient term
      // If uULG is 0, Lg will be 1.0 (flat)
      Lg = mix(1.0, .2 + d*0.8, uULG);
      C=c;
      Vuv=uv;
      Vao=ao;
      VlocalUV = localUV;
      VcornerAO = cornerAO;
      gl_Position=MVP*vec4(p,1);
    }`;

  const fragmentShaderSource = `#version 300 es
    precision highp float;

    uniform sampler2D T;
    uniform float uUT;  // Use Texture (1.0 or 0.0)
    uniform float uUAO; // Use AO (1.0 or 0.0)
    uniform float uUAOD; // Use AO Debug (1.0 or 0.0)

    in vec4 C;
    in vec2 Vuv;
    in float Lg;
    in float Vao;
    in vec2 VlocalUV;
    in vec4 VcornerAO;

    out vec4 o;

    void main(){
      vec4 texColor = texture(T, Vuv);
      // Mix texture with vertex color (tinting)
      // If uUT is 0, texColor is effectively white
      vec4 baseColor = mix(vec4(1.0), texColor, uUT) * C;

      // Radial AO Calculation using Bilinear Interpolation
      // VcornerAO contains AO for corners in order: (0,0), (1,0), (1,1), (0,1)
      // Which maps to XYZW as: [AO(0,0), AO(1,0), AO(1,1), AO(0,1)]
      // Bilinear: interpolate along y first (vertical edges), then x (horizontal)
      float aoLeft = mix(VcornerAO.x, VcornerAO.w, VlocalUV.y);   // Left edge: mix (0,0) and (0,1) by y
      float aoRight = mix(VcornerAO.y, VcornerAO.z, VlocalUV.y);  // Right edge: mix (1,0) and (1,1) by y
      float aoBilinear = mix(aoLeft, aoRight, VlocalUV.x);       // Final: mix left and right using x

      // Apply a slight radial curve to make it look "softer"
      // This emphasizes the corners/edges
      float radialAO = pow(aoBilinear, 1.2);

      // Apply lighting and Ambient Occlusion
      // If uUAO is 0, aoBilinear is effectively 1.0
      float aoVal = mix(1.0, radialAO, uUAO);

      // AO Debug mode: if uUAOD is 1.0, show only AO values as grayscale
      vec3 color = mix(baseColor.rgb * Lg * aoVal, vec3(aoVal), uUAOD);
      o = vec4(color, baseColor.a);
    }
  `;

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  const uMVP = gl.getUniformLocation(program, "MVP");
  const uM = gl.getUniformLocation(program, "M");
  const uL = gl.getUniformLocation(program, "L");
  const uT = gl.getUniformLocation(program, "T");
  const uUT = gl.getUniformLocation(program, "uUT");
  const uUAO = gl.getUniformLocation(program, "uUAO");
  const uULG = gl.getUniformLocation(program, "uULG");
  const uUAOD = gl.getUniformLocation(program, "uUAOD");

  const cube = createCube();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  createVBO(gl, cube.p, 0);
  createVBO(gl, cube.n, 1);

  // Default color buffer
  const cbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  // UV buffer
  const uvbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvbuf);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);

  // AO buffer (legacy)
  const aobuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aobuf);
  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);

  // Local UV buffer for Radial AO
  const luvbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, luvbuf);
  gl.enableVertexAttribArray(5);
  gl.vertexAttribPointer(5, 2, gl.FLOAT, false, 0, 0);

  // Corner AO buffer for Radial AO
  const caoful = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, caoful);
  gl.enableVertexAttribArray(6);
  gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 0, 0);

  // Initialize Texture Atlas
  if (blockDefs.length > 0) {
    const atlasCanvas = generateTextureAtlas(blockDefs);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlasCanvas,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.NEAREST_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  return {
    gl,
    cbuf,
    uvbuf,
    aobuf,
    cube,
    uL,
    uM,
    uMVP,
    uT,
    uUT,
    uUAO,
    uULG,
    uUAOD,
    luvbuf,
    caoful,
  };
}
