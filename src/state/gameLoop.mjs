import { I, look, mul, persp } from "../util/math.mjs";
import { ray } from "../util/ray.mjs";
import { meshChunk, uploadChunkMesh } from "../util/chunkMesher.mjs";

import { blocks as blockTypes } from "../state/config/blocks.mjs";

import { updatePlayer } from "../update/player.mjs";
import { updatePhysics } from "../update/physics.mjs";
import { updateWorld } from "../update/world.mjs";
import { updatePlantGrowth } from "../update/plantGrowth.mjs";

/** @typedef {import("../util/chunk.mjs").Chunk} Chunk */
/** @typedef {import("../util/ray.mjs").PointWithFace} PointWithFace */

// Fixed timestep configuration
const TARGET_FPS = 50;
const FIXED_TIMESTEP = 1000 / TARGET_FPS; // 20ms per update
const MAX_UPDATES_PER_FRAME = 20; // Prevent spiral of death

let lastFrameTime = performance.now();
let accumulatedTime = 0;
let animationFrameId;

// State needed for interpolation
const previousState = {
  x: 0,
  y: 0,
  z: 0,
};

let isFirstFrame = true;

/**
 * Linear interpolation
 * @param {number} start
 * @param {number} end
 * @param {number} t
 */
const lerp = (start, end, t) => start + (end - start) * t;

/**
 * Draw a chunk mesh.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Chunk} chunk
 * @param {Float32Array} VP - View-projection matrix
 * @param {WebGLUniformLocation} uMVP
 * @param {WebGLUniformLocation} uM
 */
function drawChunkMesh(gl, chunk, VP, uMVP, uM) {
  const mesh = chunk.mesh;
  if (!mesh || mesh.vertexCount === 0) {
    return;
  }

  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // Bind color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuffer);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  // Set uniforms - identity model matrix since positions are in world space
  const M = I();
  gl.uniformMatrix4fv(uMVP, false, VP);
  gl.uniformMatrix4fv(uM, false, M);

  // Draw solid geometry
  gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}

/**
 * Draw crosshairs in screen center.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {HTMLCanvasElement} cnvs
 */
function drawCrosshairs(gl, cnvs) {
  // Switch to 2D overlay mode
  gl.disable(gl.DEPTH_TEST);

  // Use simple 2D rendering with WebGL
  const cx = cnvs.width / 2;
  const cy = cnvs.height / 2;
  const size = 10;
  const thickness = 2;

  // Create a simple 2D crosshair using scissor test and clear
  gl.enable(gl.SCISSOR_TEST);

  // Set crosshair color (white with some transparency)
  gl.clearColor(1.0, 1.0, 1.0, 0.8);

  // Horizontal line
  gl.scissor(cx - size, cy - thickness / 2, size * 2, thickness);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertical line
  gl.scissor(cx - thickness / 2, cy - size, thickness, size * 2);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.disable(gl.SCISSOR_TEST);

  // Reset for next frame
  gl.enable(gl.DEPTH_TEST);
}

/**
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {{[k: string]: number[]}} colorMap
 * @param {Object} gameState
 * @param {Object} gameConfig
 * @param {Object} ui
 * @param {WebGL2RenderingContext} gl
 * @param {Object} cbuf
 * @param {Object} cube
 * @param {Object} uL
 * @param {Object} uM
 * @param {Object} uMVP
 */
export function gameLoop(
  shadow,
  cnvs,
  colorMap,
  gameState,
  gameConfig,
  ui,
  gl,
  cbuf,
  cube,
  uL,
  uM,
  uMVP,
) {
  if (gameState.shouldReset.get()) {
    gameState.shouldReset.set(false);

    return;
  }

  // Initialize gameTime if missing
  if (typeof gameState.gameTime === "undefined") {
    gameState.gameTime = 0;
  }

  // Initialize previous state on first run
  if (isFirstFrame) {
    previousState.x = gameState.x;
    previousState.y = gameState.y;
    previousState.z = gameState.z;
    isFirstFrame = false;
  }

  const { pitch, yaw, world } = gameState;

  /* ================= Time Management ================= */
  const currentTime = performance.now();
  // Cap frame time to prevent spirals (e.g. if tab was backgrounded)
  const frameTime = Math.min(currentTime - lastFrameTime, 250);
  lastFrameTime = currentTime;

  accumulatedTime += frameTime;

  /* ================= Fixed Timestep Updates ================= */
  let updates = 0;
  const dtSeconds = FIXED_TIMESTEP / 1000;

  while (accumulatedTime >= FIXED_TIMESTEP && updates < MAX_UPDATES_PER_FRAME) {
    // Store state before update for interpolation
    previousState.x = gameState.x;
    previousState.y = gameState.y;
    previousState.z = gameState.z;

    updateWorld(gameState);
    updatePlayer(shadow, gameState, dtSeconds);
    const newPos = updatePhysics(shadow, ui, gameState, dtSeconds);
    updatePlantGrowth(gameState);

    // Apply physics results
    gameState.x = newPos.x;
    gameState.y = newPos.y;
    gameState.z = newPos.z;

    // Advance game time
    gameState.gameTime += dtSeconds;

    accumulatedTime -= FIXED_TIMESTEP;
    updates++;
  }

  /* ================= Rendering with Interpolation ================= */

  // Calculate interpolation factor (0.0 to 1.0)
  const alpha = accumulatedTime / FIXED_TIMESTEP;

  // Interpolate camera position
  const renderX = lerp(previousState.x, gameState.x, alpha);
  const renderY = lerp(previousState.y, gameState.y, alpha);
  const renderZ = lerp(previousState.z, gameState.z, alpha);

  // Calculate eye position for rendering (approx 1.62m above feet)
  // gameState.playerHeight usually around 1.8? Assuming feet position logic
  // If gameState.y is center of AABB, logic might differ.
  // Original code: const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
  const eyeY = renderY - gameState.playerHeight / 2 + 1.62;

  // Raycasting depends on actual game logic state OR interpolated state?
  // Visual raycast should match visual cursor. Physics raycast (action) should match logic.
  // Usually, for "looking at", we use interpolated position so it matches what user sees.
  gameState.hit = ray(
    world,
    { x: renderX, y: eyeY, z: renderZ },
    { yaw, pitch },
  );

  gl.viewport(0, 0, cnvs.width, cnvs.height);
  gl.enable(gl.DEPTH_TEST);

  // Use sky color from config
  const [r, g, b, a] = colorMap["Air"];
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fx = Math.sin(yaw),
    fz = Math.cos(yaw);
  const cosPitch = Math.cos(pitch);

  // Use client dimensions for aspect ratio to handle CSS scaling vs internal resolution
  const aspect = cnvs.clientWidth / cnvs.clientHeight;
  const P = persp(I(), Math.PI / 3, aspect, 0.1, 100);

  const V = look(
    I(),
    [renderX, eyeY, renderZ],
    [renderX + fx * cosPitch, eyeY + Math.sin(pitch), renderZ + fz * cosPitch],
    [0, 1, 0],
  );

  const VP = mul(I(), P, V);

  gl.uniform3f(uL, -0.5, -1, -0.3);

  // Render chunks with face-culled meshes
  // Note: getVisibleChunks might need consistent position.
  // Using interpolated position for visibility culling is fine (prevents popping).
  const visibleChunks = world.getVisibleChunks(renderX, renderZ);

  for (const chunk of visibleChunks) {
    // Rebuild mesh if dirty
    if (chunk.dirty) {
      chunk.mesh = meshChunk(colorMap, chunk, world, blockTypes);
      chunk.dirty = false;

      uploadChunkMesh(gl, chunk);
    }

    // Draw the chunk mesh
    if (chunk.mesh && chunk.mesh.vertexCount > 0) {
      drawChunkMesh(gl, chunk, VP, uMVP, uM);
    }
  }

  // Draw crosshairs overlay
  drawCrosshairs(gl, cnvs);

  animationFrameId = requestAnimationFrame(() =>
    gameLoop(
      shadow,
      cnvs,
      colorMap,
      gameState,
      gameConfig,
      ui,
      gl,
      cbuf,
      cube,
      uL,
      uM,
      uMVP,
    ),
  );
}

export function cancelGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}
