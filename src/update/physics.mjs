/**
 * @typedef {import('../state/state.mjs').GameState} GameState
 * @typedef {import('../util/aabb.mjs').AABB} AABB
 */

import { getBlock } from "../util/world.mjs";
import { intersects } from "../util/aabb.mjs";
import { isKeyPressed } from "../util/isKeyPressed.mjs";

/**
 * Creates an AABB for the player at a given position.
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
        if (getBlock(world, x, y, z)) {
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
 *
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
  const newX = x + dx * dt;
  const newY = y + dy * dt;
  const newZ = z + dz * dt;

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
    )
      x = newX;
    else state.dx = 0;

    if (
      !isColliding(state, getPlayerAABB(x, newY, z, playerWidth, playerHeight))
    ) {
      y = newY;
    } else {
      if (dy < 0) newOnGround = true;
      dy = 0;
    }

    if (
      !isColliding(state, getPlayerAABB(x, y, newZ, playerWidth, playerHeight))
    )
      z = newZ;
    else state.dz = 0;
  }

  // Update state
  state.dx = dx;
  state.dy = dy;
  state.dz = dz;
  state.onGround = newOnGround;

  return { x, y, z };
}
