/**
 * @typedef {import('../state/chunkManager.mjs').ChunkManager} ChunkManager
 */

/**
 * @typedef {{x: number, y: number, z: number}} Coords
 */

/**
 * @typedef {Object} PointWithFace
 *
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {Coords} face
 */

/**
 * @typedef {{yaw: number, pitch: number }} Rotation
 */

/**
 * @param {ChunkManager} world
 * @param {Coords} coords
 * @param {Rotation} rotation
 *
 * @returns {PointWithFace}
 */
export function ray(world, { x, y, z }, { yaw, pitch }) {
  // Calculate direction vector
  const m = Math;
  const dirX = m.sin(yaw) * m.cos(pitch);
  const dirY = m.sin(pitch);
  const dirZ = m.cos(yaw) * m.cos(pitch);

  // Initialize current voxel position (integer coordinates)
  let currentX = m.floor(x);
  let currentY = m.floor(y);
  let currentZ = m.floor(z);

  // Determine step direction and initial ray length to next voxel boundary
  const stepX = dirX > 0 ? 1 : -1;
  const stepY = dirY > 0 ? 1 : -1;
  const stepZ = dirZ > 0 ? 1 : -1;

  // tMax: Distance from origin to the first boundary of the next voxel
  // tDelta: Distance along the ray to travel one unit in each component
  let tMaxX, tMaxY, tMaxZ;
  let tDeltaX, tDeltaY, tDeltaZ;

  // Handle X component
  if (dirX !== 0) {
    tDeltaX = stepX / dirX;
    // If moving positive, distance to next integer is (currentX + 1) - x
    // If moving negative, distance to next integer is x - currentX
    const distToNextX = stepX > 0 ? currentX + 1 - x : x - currentX;
    tMaxX = distToNextX / m.abs(dirX);
  } else {
    tDeltaX = Infinity;
    tMaxX = Infinity;
  }

  // Handle Y component
  if (dirY !== 0) {
    tDeltaY = stepY / dirY;
    const distToNextY = stepY > 0 ? currentY + 1 - y : y - currentY;
    tMaxY = distToNextY / m.abs(dirY);
  } else {
    tDeltaY = Infinity;
    tMaxY = Infinity;
  }

  // Handle Z component
  if (dirZ !== 0) {
    tDeltaZ = stepZ / dirZ;
    const distToNextZ = stepZ > 0 ? currentZ + 1 - z : z - currentZ;
    tMaxZ = distToNextZ / m.abs(dirZ);
  } else {
    tDeltaZ = Infinity;
    tMaxZ = Infinity;
  }

  // Trace the ray
  const MAX_DISTANCE = 16; // Reach distance
  let distance = 0;

  // Track the entered face normal
  let faceX = 0;
  let faceY = 0;
  let faceZ = 0;

  while (distance < MAX_DISTANCE) {
    // Check if current voxel is solid
    // Note: We check BEFORE incrementing, meaning we check start voxel too.
    // However, usually we want to ignore the voxel the camera is INSIDE of if it hinders view,
    // but physically we should interact with it if it's there.
    // For standard MC-like behavior, checking the current voxel is correct.
    const key = `${currentX},${currentY},${currentZ}`;
    if (world.has(key)) {
      return {
        x: currentX,
        y: currentY,
        z: currentZ,
        face: { x: faceX, y: faceY, z: faceZ },
      };
    }

    // Step to the next voxel
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        currentX += stepX;
        distance = tMaxX;
        tMaxX += tDeltaX;
        faceX = -stepX; // We entered from the side opposite to step
        faceY = 0;
        faceZ = 0;
      } else {
        currentZ += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        faceX = 0;
        faceY = 0;
        faceZ = -stepZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        currentY += stepY;
        distance = tMaxY;
        tMaxY += tDeltaY;
        faceX = 0;
        faceY = -stepY;
        faceZ = 0;
      } else {
        currentZ += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        faceX = 0;
        faceY = 0;
        faceZ = -stepZ;
      }
    }
  }

  return null;
}
