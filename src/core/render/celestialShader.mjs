/**
 * @typedef {Object} Uniforms
 *
 * @property {WebGLUniformLocation | null} uVP
 * @property {WebGLUniformLocation | null} uCameraPos
 * @property {WebGLUniformLocation | null} uCelestialPos
 * @property {WebGLUniformLocation | null} uSize
 * @property {WebGLUniformLocation | null} uCameraRight
 * @property {WebGLUniformLocation | null} uCameraUp
 * @property {WebGLUniformLocation | null} uColor
 * @property {WebGLUniformLocation | null} uGlowFalloff
 * @property {WebGLUniformLocation | null} uIsSun
 * @property {WebGLUniformLocation | null} uHorizonAngle
 */

/**
 * Vertex shader for celestial billboards.
 * Expands a point to a camera-facing quad.
 */
const CELESTIAL_VS = `#version 300 es
precision highp float;

// Billboard quad vertex (corners: -1,-1 to 1,1)
layout(location=0) in vec2 aQuadVertex;

// Uniforms
uniform mat4 uVP;            // View-Projection matrix
uniform vec3 uCameraPos;     // Camera position
uniform vec3 uCelestialPos;  // Celestial body world position (direction * distance)
uniform float uSize;         // Billboard size in world units
uniform vec3 uCameraRight;   // Camera right vector
uniform vec3 uCameraUp;      // Camera up vector
uniform float uHorizonAngle; // Horizon angle in radians

out vec2 vUV;
out float vHorizonFade;

void main() {
  // Compute offset from center using camera-aligned axes
  vec3 offset = (aQuadVertex.x * uCameraRight + aQuadVertex.y * uCameraUp) * uSize;

  // Position relative to camera (celestial bodies follow camera)
  vec3 worldPos = uCameraPos + uCelestialPos + offset;

  // UV for fragment shader (0,0 to 1,1)
  vUV = aQuadVertex * 0.5 + 0.5;

  // Horizon fade: fade out as Y approaches horizon
  // uCelestialPos.y is height relative to horizon (in world space)
  // We use the angle to determine if it's below the visual horizon
  vec3 dir = normalize(uCelestialPos);
  float angle = atan(dir.y, length(dir.xz));

  // Fade out starting from below the visual horizon
  vHorizonFade = smoothstep(uHorizonAngle - 0.2, uHorizonAngle + 0.1, angle);

  gl_Position = uVP * vec4(worldPos, 1.0);
}
`;

/**
 * Fragment shader for celestial billboards.
 * Renders procedural sun/moon with radial gradient and glow.
 */
const CELESTIAL_FS = `#version 300 es
precision highp float;

in vec2 vUV;
in float vHorizonFade;

uniform vec4 uColor;        // Base color (RGBA)
uniform float uGlowFalloff; // Glow intensity falloff
uniform float uIsSun;       // 1.0 for sun, 0.0 for moon

out vec4 fragColor;

void main() {
  // Distance from center (0,0 is center, 1,1 is corner)
  vec2 centered = vUV * 2.0 - 1.0;
  float dist = length(centered);

  // Core disc (solid inner portion)
  float coreRadius = 0.4;
  float core = 1.0 - smoothstep(coreRadius - 0.05, coreRadius + 0.05, dist);

  // Outer glow (soft falloff)
  float glow = exp(-dist * dist * uGlowFalloff);

  // Combine core and glow
  float intensity = max(core, glow * 0.6);

  // Apply horizon fade
  intensity *= vHorizonFade;

  // Sun has warm glow, moon has cooler hue
  vec3 color = uColor.rgb;
  if (uIsSun > 0.5) {
    // Sun: add warm corona
    color = mix(color, vec3(1.0, 0.9, 0.7), glow * 0.3);
  } else {
    // Moon: subtle cool tint
    color = mix(color, vec3(0.9, 0.95, 1.0), 0.2);
  }

  // Output with premultiplied alpha for additive blending
  float alpha = intensity * uColor.a;
  fragColor = vec4(color * alpha, alpha);
}
`;

/**
 * @typedef {Object} CelestialContext
 *
 * @property {WebGLProgram} program
 * @property {Uniforms} uniforms
 * @property {WebGLVertexArrayObject | null} vao
 * @property {WebGLBuffer | null} quadBuffer
 */

/**
 * Celestial body shader program for rendering sun and moon billboards.
 *
 * @param {WebGL2RenderingContext} gl - WebGL context
 *
 * @returns {CelestialContext} Celestial shader context with program, uniforms, and buffers
 */
export function initCelestialShader(gl) {
  // Compile shaders
  const vs = gl.createShader(gl.VERTEX_SHADER);
  if (!vs) {
    throw new Error("Failed to create vertex shader");
  }

  gl.shaderSource(vs, CELESTIAL_VS);
  gl.compileShader(vs);

  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error("Celestial VS compile error:", gl.getShaderInfoLog(vs));
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fs) {
    throw new Error("Failed to create fragment shader");
  }

  gl.shaderSource(fs, CELESTIAL_FS);
  gl.compileShader(fs);

  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error("Celestial FS compile error:", gl.getShaderInfoLog(fs));
  }

  // Link program
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "Celestial program link error:",
      gl.getProgramInfoLog(program),
    );
  }

  // Get uniform locations
  const uniforms = {
    uVP: gl.getUniformLocation(program, "uVP"),
    uCameraPos: gl.getUniformLocation(program, "uCameraPos"),
    uCelestialPos: gl.getUniformLocation(program, "uCelestialPos"),
    uSize: gl.getUniformLocation(program, "uSize"),
    uCameraRight: gl.getUniformLocation(program, "uCameraRight"),
    uCameraUp: gl.getUniformLocation(program, "uCameraUp"),
    uColor: gl.getUniformLocation(program, "uColor"),
    uGlowFalloff: gl.getUniformLocation(program, "uGlowFalloff"),
    uIsSun: gl.getUniformLocation(program, "uIsSun"),
    uHorizonAngle: gl.getUniformLocation(program, "uHorizonAngle"),
  };

  // Create quad buffer (2 triangles forming a square)
  // Vertices: -1,-1  1,-1  1,1  -1,-1  1,1  -1,1
  const quadVertices = new Float32Array([
    -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  return {
    program,
    uniforms,
    vao,
    quadBuffer,
  };
}
