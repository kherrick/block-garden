/**
 * @typedef {import('../../core/systems/game/state.mjs').GameState} GameState
 */

/**
 * @typedef {object} AABB
 *
 * @property {number} minX
 * @property {number} minY
 * @property {number} minZ
 * @property {number} maxX
 * @property {number} maxY
 * @property {number} maxZ
 */

import { isSolid } from "../../utils/isSolid.mjs";
import { isKeyPressed } from "../../utils/isKeyPressed.mjs";
import { gameConfig } from "../../world/config/index.mjs";

/**
 * Checks if two AABBs intersect.
 *
 * @param {AABB} a
 * @param {AABB} b
 *
 * @returns {boolean}
 */
export function intersects(a, b) {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}

/**
 * Creates an AABB for the player at a given position.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} playerWidth
 * @param {number} playerHeight
 *
 * @returns {AABB}
 */
function getPlayerAABB(x, y, z, playerWidth, playerHeight) {
  const halfW = playerWidth / 2;
  const halfH = playerHeight / 2;

  return {
    minX: x - halfW,
    maxX: x + halfW,
    minY: y - halfH,
    maxY: y + halfH,
    minZ: z - halfW,
    maxZ: z + halfW,
  };
}

/**
 * Checks for collision at a given position.
 *
 * @param {GameState} state
 * @param {AABB} playerAABB
 *
 * @returns {boolean}
 */
function isColliding(state, playerAABB) {
  const { world } = state;

  const minX = Math.floor(playerAABB.minX);
  const maxX = Math.ceil(playerAABB.maxX);
  const minY = Math.floor(playerAABB.minY);
  const maxY = Math.ceil(playerAABB.maxY);
  const minZ = Math.floor(playerAABB.minZ);
  const maxZ = Math.ceil(playerAABB.maxZ);

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      for (let z = minZ; z < maxZ; z++) {
        if (isSolid(world, x, y, z)) {
          const blockAABB = {
            minX: x,
            minY: y,
            minZ: z,
            maxX: x + 1,
            maxY: y + 1,
            maxZ: z + 1,
          };

          if (intersects(playerAABB, blockAABB)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * @param {ShadowRoot} shadow
 * @param {Object} ui
 * @param {GameState} state
 * @param {number} dt
 *
 * @returns {{x: number, y: number, z: number}}
 */
export function updatePhysics(shadow, ui, state, dt) {
  let {
    x,
    y,
    z,
    dx,
    dy,
    dz,
    playerWidth,
    playerHeight,
    onGround,
    flying,
    flySpeed,
  } = state;

  // INPUT HANDLING
  const space = isKeyPressed(shadow, " ");
  const now = performance.now();
  const isFlying = flying.get();
  // RISING EDGE: SPACE
  if (space && !state.spacePressed) {
    if (now - state.lastSpacePressTime < 300) {
      // Double tap detected
      flying.set(!isFlying);
      state.lastSpacePressTime = 0; // Reset
    } else {
      state.lastSpacePressTime = now;
    }
  }

  // Jump if space is pressed and on ground
  if (space && !isFlying && onGround) {
    dy = 12;
  }

  state.spacePressed = space;

  // FLIGHT MOVEMENT
  if (isFlying) {
    if (isKeyPressed(shadow, "shift")) {
      dy = -flySpeed; // Descend
    } else if (space) {
      dy = flySpeed; // Ascend
    } else {
      dy = 0; // Hover
    }
  } else {
    // Normal gravity
    dy -= 45 * dt;
  }

  // Integrate movement
  let newX = x + dx * dt;
  let newY = y + dy * dt;
  let newZ = z + dz * dt;

  // WORLD BOUNDARIES
  // Apply clamping if worldRadius is finite (less than 2048 as per user preference for infinite)
  const worldRadius = gameConfig.worldRadius.get();
  if (worldRadius < 2048) {
    // Clamp to ±worldRadius
    if (newX > worldRadius) {
      newX = worldRadius;
      dx = 0;
    } else if (newX < -worldRadius) {
      newX = -worldRadius;
      dx = 0;
    }

    if (newZ > worldRadius) {
      newZ = worldRadius;
      dz = 0;
    } else if (newZ < -worldRadius) {
      newZ = -worldRadius;
      dz = 0;
    }
  }

  let newOnGround = false;

  // Full 3D collision test first
  if (
    !isColliding(
      state,
      getPlayerAABB(newX, newY, newZ, playerWidth, playerHeight),
    )
  ) {
    x = newX;
    y = newY;
    z = newZ;
  } else {
    // Collision detected
    // Axis-by-axis fallback
    if (
      !isColliding(state, getPlayerAABB(newX, y, z, playerWidth, playerHeight))
    ) {
      x = newX;
    } else {
      // Horizontal collision occurred in X
      let canStepUp = false;
      if (onGround && gameConfig.useAutoJump.get() && !isFlying) {
        // Check if we could clear this by stepping up 1.1 units
        // Use a thinner AABB (0.4) to avoid getting stuck on adjacent walls
        if (
          !isColliding(
            state,
            getPlayerAABB(newX, y + 1.05, z, 0.4, playerHeight),
          )
        ) {
          canStepUp = true;
          if (onGround) {
            dy = 12; // Trigger jump
          }
        }
      }

      if (!canStepUp) {
        state.dx = 0;
      }
    }

    if (
      !isColliding(state, getPlayerAABB(x, newY, z, playerWidth, playerHeight))
    ) {
      y = newY;
    } else {
      if (dy < 0) {
        newOnGround = true;

        dy = 0;
      } else if (dy > 0 && newY > y) {
        // Only stop upward momentum if we hit a ceiling (moved up)
        dy = 0;
      }
    }

    if (
      !isColliding(state, getPlayerAABB(x, y, newZ, playerWidth, playerHeight))
    ) {
      z = newZ;
    } else {
      // Horizontal collision occurred in Z
      let canStepUp = false;
      if (onGround && gameConfig.useAutoJump.get() && !isFlying) {
        // Check if we could clear this by stepping up 1.1 units
        // Use a thinner AABB (0.4) to avoid getting stuck on adjacent walls
        if (
          !isColliding(
            state,
            getPlayerAABB(x, y + 1.05, newZ, 0.4, playerHeight),
          )
        ) {
          canStepUp = true;

          if (onGround) {
            // Trigger jump
            dy = 12;
          }
        }
      }

      if (!canStepUp) {
        state.dz = 0;
      }
    }
  }

  // Update state
  state.dx = dx;
  state.dy = dy;
  state.dz = dz;
  state.onGround = newOnGround;

  // Update bobbing distance and intensity
  const horizontalSpeed = Math.sqrt(dx * dx + dz * dz);

  if (state.onGround && !isFlying) {
    state.bobbingDistance += horizontalSpeed * dt;
  }

  // Smooth out bobbing effect (fade out when airborne, fade in when walking)
  const targetIntensity =
    state.onGround && !isFlying && horizontalSpeed > 0.1 ? 1.0 : 0.0;

  // Lerp towards target intensity (approx 10.0 speed for quick but smooth transition)
  const lerpSpeed = 10.0 * dt;
  if (state.bobbingIntensity < targetIntensity) {
    state.bobbingIntensity = Math.min(
      targetIntensity,
      state.bobbingIntensity + lerpSpeed,
    );
  } else {
    state.bobbingIntensity = Math.max(
      targetIntensity,
      state.bobbingIntensity - lerpSpeed,
    );
  }

  return { x, y, z };
}
