import { drawBreakingOverlay } from "../../../render/draw/breakingOverlay.mjs";
import { drawChunkMesh } from "../../../render/draw/chunkMesh.mjs";
import { drawCrosshairs } from "../../../render/draw/crossHairs.mjs";
import { drawSelectionHighlight } from "../../../render/draw/selectionHighlight.mjs";

import {
  deleteChunkMesh,
  smartMeshChunk,
  uploadChunkMesh,
} from "../../../world/meshing/chunkMesher.mjs";
import { getBlockByName } from "../../../world/config/blocks.mjs";
import { blocks as blockTypes } from "../../../world/config/blocks.mjs";
import {
  getSkyColor,
  getSunDirection,
  normalizeTime,
} from "../../../world/time/timeSystem.mjs";

import { I, look, mul, persp } from "../../../utils/math.mjs";
import { ray } from "../../../utils/ray.mjs";
import { updateBreaking, updatePlacing } from "../../../utils/interaction.mjs";

import { updatePlayer } from "../../systems/player.mjs";
import { updatePhysics } from "../../systems/physics.mjs";
import {
  updatePlantGrowth,
  updateStructure,
} from "../../systems/plantGrowth.mjs";
import { updateWorld } from "../../systems/world.mjs";

/** @typedef {import("../../../utils/ray.mjs").PointWithFace} PointWithFace */

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
  bobbingDistance: 0,
  bobbingIntensity: 0,
};

let isFirstFrame = true;

/**
 * Linear interpolation
 *
 * @param {number} start
 * @param {number} end
 * @param {number} t
 */
const lerp = (start, end, t) => start + (end - start) * t;

const UI_UPDATE_MS = 200;
let lastUIUpdateTime = 0;
let lastRenderX = 0;
let lastRenderY = 0;
let lastRenderZ = 0;

/**
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {{[k: string]: number[]}} colorMap
 * @param {Object} gameState
 * @param {Object} gameConfig
 * @param {Object} ui
 * @param {WebGL2RenderingContext} gl
 * @param {Object} cbuf
 * @param {Object} uvbuf
 * @param {Object} aobuf
 * @param {Object} cube
 * @param {Object} uL
 * @param {Object} uM
 * @param {Object} uMVP
 * @param {Object} uT
 * @param {Object} uUT
 * @param {Object} uUAO
 * @param {Object} uULG
 * @param {Object} uUAOD
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
  caobuf,
  pbuf,
  nbuf,
  breakCbuf,
  breakUvbuf,
) {
  if (gameState.shouldReset.get()) {
    gameState.shouldReset.set(false);

    return;
  }

  // Initialize gameTime if missing
  if (typeof gameState.gameTime === "undefined") {
    gameState.gameTime = 0;
  }

  // Initialize worldTime if missing (normalized 0–1)
  if (typeof gameState.worldTime === "undefined") {
    gameState.worldTime = 0.5; // Start at noon
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

    previousState.bobbingDistance = gameState.bobbingDistance;
    previousState.bobbingIntensity = gameState.bobbingIntensity;

    updateWorld(gameState);
    updatePlayer(shadow, gameState, dtSeconds);
    updateBreaking(gameState, dtSeconds);
    updatePlacing(gameState, dtSeconds);
    updatePlantGrowth(gameState);

    // Physics results
    const newPos = updatePhysics(shadow, ui, gameState, dtSeconds);

    gameState.x = newPos.x;
    gameState.y = newPos.y;
    gameState.z = newPos.z;

    // Advance game time
    gameState.gameTime += dtSeconds;

    // Progress world time if time cycle is enabled
    if (gameConfig.useTimeCycle.get()) {
      const dayLengthSeconds = Number(gameConfig.dayLength.get());
      const timeScaleMultiplier = gameConfig.timeScale.get();
      const timeAdvance = (dtSeconds * timeScaleMultiplier) / dayLengthSeconds;

      gameState.worldTime = normalizeTime(gameState.worldTime + timeAdvance);
    }

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
  const renderBobbingDistance = lerp(
    previousState.bobbingDistance,
    gameState.bobbingDistance,
    alpha,
  );

  const renderBobbingIntensity = lerp(
    previousState.bobbingIntensity,
    gameState.bobbingIntensity,
    alpha,
  );

  const now = performance.now();
  if (now - lastUIUpdateTime >= UI_UPDATE_MS) {
    const roundedRenderX = Math.round(renderX);
    const roundedRenderY = Math.round(renderY);
    const roundedRenderZ = Math.round(renderZ);

    if (lastRenderX !== roundedRenderX) {
      lastRenderX = roundedRenderX;
      ui.playerX.textContent = roundedRenderX;
    }

    if (lastRenderY !== roundedRenderY) {
      lastRenderY = roundedRenderY;
      ui.playerY.textContent = roundedRenderY;
    }

    if (lastRenderZ !== roundedRenderZ) {
      lastRenderZ = roundedRenderZ;
      ui.playerZ.textContent = roundedRenderZ;
    }

    lastUIUpdateTime = now;
  }

  // Calculate eye position for rendering (approx 1.62m above feet)
  const horizontalSpeed = Math.sqrt(
    gameState.dx * gameState.dx + gameState.dz * gameState.dz,
  );

  let bobbingAmountY = 0;
  let bobbingAmountSide = 0;

  // Always calculate, but scale by intensity
  if (renderBobbingIntensity > 0.001) {
    // Frequency ~1.5 provides a natural walking rhythm at speed 8
    const freq = 1.5;
    const speedFactor = horizontalSpeed * 0.012;

    // Vertical bobbing (up and down)
    bobbingAmountY =
      Math.sin(renderBobbingDistance * freq * 2.0) * speedFactor * 0.6;

    // Horizontal sway (side to side) - cycles half as fast as vertical
    bobbingAmountSide = Math.sin(renderBobbingDistance * freq) * speedFactor;

    // Apply smoothing intensity
    bobbingAmountY *= renderBobbingIntensity;
    bobbingAmountSide *= renderBobbingIntensity;
  }

  // Apply horizontal bobbing relative to movement direction
  const swayX = Math.cos(yaw) * bobbingAmountSide;
  const swayZ = -Math.sin(yaw) * bobbingAmountSide;

  const eyeX = renderX + swayX;
  const eyeY = renderY - gameState.playerHeight / 2 + 1.62 + bobbingAmountY;
  const eyeZ = renderZ + swayZ;

  // Raycasting depends on actual game logic state OR interpolated state?
  // Visual raycast should match visual cursor. Physics raycast (action) should match logic.
  // Usually, for "looking at", we use interpolated position so it matches what user sees.
  gameState.hit = ray(world, { x: eyeX, y: eyeY, z: eyeZ }, { yaw, pitch });

  gl.viewport(0, 0, cnvs.width, cnvs.height);
  gl.enable(gl.DEPTH_TEST);

  // Compute sky color based on world time, or manual time if cycle is disabled
  let skyColor;
  if (gameConfig.useTimeCycle.get()) {
    skyColor = getSkyColor(gameState.worldTime);
  } else {
    skyColor = getSkyColor(gameConfig.manualTimeOfDay.get());
  }

  const [r, g, b, a] = skyColor;
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fx = Math.sin(yaw),
    fz = Math.cos(yaw);
  const cosPitch = Math.cos(pitch);

  const VIEW_DISTANCE = gameConfig.viewRadius.get();
  // Use client dimensions for aspect ratio to handle CSS scaling vs internal resolution
  const aspect = cnvs.clientWidth / cnvs.clientHeight;
  const P = persp(I(), Math.PI / 3, aspect, 0.1, VIEW_DISTANCE);

  const V = look(
    I(),
    [eyeX, eyeY, eyeZ],
    [eyeX + fx * cosPitch, eyeY + Math.sin(pitch), eyeZ + fz * cosPitch],
    [0, 1, 0],
  );

  const VP = mul(I(), P, V);

  // Set visual enhancement toggles via uniforms
  gl.uniform1f(uUT, gameConfig.useTextureAtlas.get() ? 1.0 : 0.0);
  gl.uniform1f(uUAO, gameConfig.useAmbientOcclusion.get() ? 1.0 : 0.0);
  gl.uniform1f(uULG, gameConfig.usePerFaceLighting.get() ? 1.0 : 0.0);
  gl.uniform1f(uUAOD, gameConfig.useAODebug.get() ? 1.0 : 0.0);

  // Dynamic lighting: use active cycle time if enabled, otherwise use manual override
  if (gameConfig.useDynamicLighting.get()) {
    // Determine time source: active cycle or manual override
    const timeForLighting = gameConfig.useTimeCycle.get()
      ? gameState.worldTime
      : gameConfig.manualTimeOfDay.get();

    const sunDir = getSunDirection(timeForLighting);
    gl.uniform3f(uL, sunDir.x, sunDir.y, sunDir.z);
  } else {
    // Default "high noon" fixed light
    gl.uniform3f(uL, -0.5, -1.0, -0.3);
  }

  // Render chunks with face-culled meshes
  // Progressive loading: generate chunks as player moves, unload distant ones
  const visibleChunks = world.updateVisibleChunks(
    renderX,
    renderZ,
    gameState.seed || 0,
    gl,
    deleteChunkMesh,
    gameState.growthTimers,
    gameState.plantStructures,
    (restoredKeys) => {
      // Force visual refresh for restored plants
      for (const key of restoredKeys) {
        // Skip if structure no longer exists (was fully harvested)
        const structure = gameState.plantStructures[key];
        if (!structure) {
          continue;
        }

        const timer = gameState.growthTimers
          ? gameState.growthTimers[key]
          : undefined;

        // Calculate progress
        let progress = 1.0;
        if (timer !== undefined) {
          // Re-calculate progress if timer is active
          const plantDef = getBlockByName(structure.type);
          const totalTime = gameState.fastGrowth
            ? 30 // hardcoded FAST_GROWTH_TIME import issue, can define or import
            : plantDef?.growthTime || 10.0;
          progress = Math.max(0, 1.0 - timer / totalTime);
        }

        updateStructure(gameState, key, progress, structure.type);
      }
    },
  );

  // Budgeted meshing: limit meshes built per frame to avoid stutter
  // Increased budget for faster initial loading
  const MESHES_PER_FRAME = 10;
  let meshedThisFrame = 0;

  for (const chunk of visibleChunks) {
    // Rebuild mesh if dirty (budget limited)
    if (chunk.dirty && meshedThisFrame < MESHES_PER_FRAME) {
      chunk.mesh = smartMeshChunk(colorMap, chunk, world, blockTypes);
      chunk.dirty = false;

      uploadChunkMesh(gl, chunk);
      meshedThisFrame++;
    }

    // Draw the chunk mesh (even if not yet meshed this frame)
    if (chunk.mesh && chunk.mesh.vertexCount > 0) {
      drawChunkMesh(gl, chunk, VP, uMVP, uM);
    }
  }

  // Draw crosshairs overlay only if split controls are enabled
  if (gameConfig.useSplitControls.get()) {
    drawCrosshairs(gl, cnvs);
  }

  // Draw selection highlight (if block targeted and not breaking)
  if (gameConfig.useBlockHighlight.get()) {
    drawSelectionHighlight(
      gl,
      gameState,
      gameConfig,
      VP,
      uMVP,
      uM,
      uUT,
      pbuf,
      nbuf,
      breakCbuf,
      breakUvbuf,
      cube,
    );
  }

  // Draw breaking overlay (if breaking)
  if (gameConfig.useDamageAnimation.get()) {
    drawBreakingOverlay(
      gl,
      gameState,
      gameConfig,
      VP,
      uMVP,
      uM,
      pbuf,
      nbuf,
      breakCbuf,
      breakUvbuf,
      cube,
    );
  }

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
      caobuf,
      pbuf,
      nbuf,
      breakCbuf,
      breakUvbuf,
    ),
  );
}

export function cancelGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}
