import {
  getCelestialPosition,
  getCelestialVisibility,
} from "../../world/time/timeSystem.mjs";

// Sun appearance
const SUN_COLOR = [1.0, 0.95, 0.8, 1.0]; // Warm white-yellow
const SUN_SIZE = 90.0; // World units at fixed distance 500
const SUN_GLOW_FALLOFF = 2.0; // Soft glow

// Moon appearance
const MOON_COLOR = [0.9, 0.92, 1.0, 0.9]; // Cool white-blue
const MOON_SIZE = 60.0; // Slightly smaller than sun
const MOON_GLOW_FALLOFF = 3.5; // Tighter glow

// Distance from camera
const CELESTIAL_DISTANCE = 500.0;

/**
 * Draw celestial bodies (sun and moon) as billboards in the sky.
 * Uses a separate shader program to avoid WebGL state conflicts.
 *
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Object} celestialContext - Shader context from initCelestialShader
 * @param {number} worldTime - Normalized world time (0-1)
 * @param {number[]} cameraPos - Camera position [x, y, z]
 * @param {Float32Array} VP - View-Projection matrix
 * @param {number} yaw - Camera yaw angle (radians)
 * @param {number} pitch - Camera pitch angle (radians)
 * @param {WebGLProgram} worldProgram - The world shader program to restore after
 */
export function drawCelestialBodies(
  gl,
  celestialContext,
  worldTime,
  cameraPos,
  VP,
  yaw,
  pitch,
  worldProgram,
  viewRadius,
) {
  const { program, uniforms, vao } = celestialContext;

  // Calculate horizon angle based on camera height and view distance
  // The visual horizon is where the far-plane sphere (radius = viewRadius) intersects the ground plane (y = 0)
  // sin(theta) = -H / R
  const hRatio = Math.max(-1.0, Math.min(1.0, -cameraPos[1] / viewRadius));
  const horizonAngle = Math.asin(hRatio);

  // Set celestial distance to a fixed value to stabilize angular size
  const celestialDistance = CELESTIAL_DISTANCE;

  // Get visibility for sun and moon
  const sunVisibility = getCelestialVisibility(worldTime, true);
  const moonVisibility = getCelestialVisibility(worldTime, false);

  // Skip if neither is visible
  if (sunVisibility <= 0 && moonVisibility <= 0) {
    return;
  }

  // Save current WebGL state
  // const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
  const prevDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
  const prevBlend = gl.isEnabled(gl.BLEND);
  const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);

  // Switch to celestial shader
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  // Disable depth writing and testing (celestial bodies are infinitely far)
  gl.depthMask(false);
  gl.disable(gl.DEPTH_TEST);

  // Enable additive blending for glow effect
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // Set VP matrix
  gl.uniformMatrix4fv(uniforms.uVP, false, VP);

  // Set camera position
  gl.uniform3f(uniforms.uCameraPos, cameraPos[0], cameraPos[1], cameraPos[2]);

  // Compute camera right and up vectors for billboarding
  // Camera looks in direction (sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch))
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  // Forward vector
  const fx = sinYaw * cosPitch;
  const fy = sinPitch;
  const fz = cosYaw * cosPitch;

  // Right vector (perpendicular to forward and world up)
  // right = normalize(forward × worldUp) where worldUp = (0,1,0)
  let rx = fz; // cosYaw * cosPitch
  let ry = 0;
  let rz = -fx; // -sinYaw * cosPitch

  const rLen = Math.sqrt(rx * rx + rz * rz);
  if (rLen > 0.001) {
    rx /= rLen;
    rz /= rLen;
  } else {
    // Looking straight up/down, use arbitrary right
    rx = 1;
    rz = 0;
  }

  // Up vector (perpendicular to right and forward)
  // up = right × forward
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  gl.uniform3f(uniforms.uCameraRight, rx, ry, rz);
  gl.uniform3f(uniforms.uCameraUp, ux, uy, uz);
  gl.uniform1f(uniforms.uHorizonAngle, horizonAngle);

  // Draw sun if visible
  if (sunVisibility > 0) {
    const sunPos = getCelestialPosition(worldTime, true);
    // Apply horizon offset to position (rotates around Z in XY plane)
    const sunAngle = Math.atan2(sunPos.y, sunPos.x);

    gl.uniform3f(
      uniforms.uCelestialPos,
      Math.cos(sunAngle) * celestialDistance,
      Math.sin(sunAngle) * celestialDistance,
      sunPos.z * celestialDistance,
    );

    // Horizon enlargement: objects look larger near the horizon (illusion but immersive)
    // Scale up to 20% when sunPos.y is near 0
    const horizonFactor = 1.0 + 0.2 * (1.0 - Math.abs(sunPos.y));
    gl.uniform1f(uniforms.uSize, SUN_SIZE * horizonFactor);

    gl.uniform4f(
      uniforms.uColor,
      SUN_COLOR[0],
      SUN_COLOR[1],
      SUN_COLOR[2],
      SUN_COLOR[3] * sunVisibility,
    );

    gl.uniform1f(uniforms.uGlowFalloff, SUN_GLOW_FALLOFF);
    gl.uniform1f(uniforms.uIsSun, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Draw moon if visible
  if (moonVisibility > 0) {
    const moonPos = getCelestialPosition(worldTime, false);
    // Apply horizon offset to position
    const moonAngle = Math.atan2(moonPos.y, moonPos.x);

    gl.uniform3f(
      uniforms.uCelestialPos,
      Math.cos(moonAngle) * celestialDistance,
      Math.sin(moonAngle) * celestialDistance,
      moonPos.z * celestialDistance,
    );

    // Horizon enlargement
    const horizonFactor = 1.0 + 0.2 * (1.0 - Math.abs(moonPos.y));
    gl.uniform1f(uniforms.uSize, MOON_SIZE * horizonFactor);

    gl.uniform4f(
      uniforms.uColor,
      MOON_COLOR[0],
      MOON_COLOR[1],
      MOON_COLOR[2],
      MOON_COLOR[3] * moonVisibility,
    );

    gl.uniform1f(uniforms.uGlowFalloff, MOON_GLOW_FALLOFF);
    gl.uniform1f(uniforms.uIsSun, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Restore WebGL state
  gl.bindVertexArray(null);
  gl.depthMask(prevDepthMask);

  if (!prevBlend) {
    gl.disable(gl.BLEND);
  } else {
    // Restore standard alpha blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  if (prevDepthTest) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  // Restore world shader program
  gl.useProgram(worldProgram);
}
