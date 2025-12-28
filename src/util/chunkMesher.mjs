/**
 * @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 */

/**
 * @typedef {import('./chunk.mjs').Chunk} Chunk
 */

/**
 * @typedef {import('./chunk.mjs').ChunkMesh} ChunkMesh
 */

/**
 * @typedef {import('../state/chunkManager.mjs').ChunkManager} ChunkManager
 */

import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "./chunk.mjs";

/**
 * Face definitions for a unit cube.
 * Each face has: normal direction, 6 vertices (2 triangles)
 *
 * @type {Array<{dir: [number, number, number], corners: Array<[number, number, number]>}>}
 */
const FACES = [
  {
    // +X (right)
    dir: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    // -X (left)
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    // +Y (top)
    dir: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
      [1, 1, 0],
    ],
  },
  {
    // -Y (bottom)
    dir: [0, -1, 0],
    corners: [
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 0],
      [1, 0, 1],
    ],
  },
  {
    // +Z (front)
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 1],
    ],
  },
  {
    // -Z (back)
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
];

/**
 * Check if a block type is transparent (allows neighbor face to render).
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {number} blockType - Block type to check
 * @param {BlockDefinition[]} blockDefs - Block definitions
 *
 * @returns {boolean}
 */
function isTransparent(colorMap, blockType, blockDefs) {
  if (blockType === 0) {
    // Air is transparent
    return true;
  }

  const block = blockDefs[blockType];
  if (!block) {
    // Unknown = transparent
    return true;
  }

  return Number(colorMap[block.name][3]) < 1.0; // Alpha < 1 = transparent
}

/**
 * Get block type at coordinates, handling cross-chunk lookups.
 *
 * @param {Chunk} chunk - Current chunk
 * @param {ChunkManager} chunkManager - Chunk manager for neighbor lookups
 * @param {number} localX - Local X (may be out of bounds)
 * @param {number} y - Y coordinate
 * @param {number} localZ - Local Z (may be out of bounds)
 *
 * @returns {number} Block type
 */
function getNeighborBlock(chunk, chunkManager, localX, y, localZ) {
  // Handle Y bounds
  if (y <= 0) {
    // Bedrock
    return 1;
  }

  if (y >= CHUNK_SIZE_Y) {
    // Air
    return 0;
  }

  // Within this chunk
  if (
    localX >= 0 &&
    localX < CHUNK_SIZE_X &&
    localZ >= 0 &&
    localZ < CHUNK_SIZE_Z
  ) {
    return chunk.getBlock(localX, y, localZ);
  }

  // Cross-chunk lookup - convert to world coords
  const worldX = chunk.worldX + localX;
  const worldZ = chunk.worldZ + localZ;

  return chunkManager.getBlock(worldX, y, worldZ);
}

/**
 * Generate mesh for a chunk with face culling. Only visible faces (adjacent to air or transparent
 * blocks) are included in the mesh, dramatically reducing vertex count.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {BlockDefinition[]} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function meshChunk(colorMap, chunk, chunkManager, blockDefs) {
  const positions = [];
  const normals = [];
  const colors = [];

  const baseX = chunk.worldX;
  const baseZ = chunk.worldZ;

  // Iterate all blocks in chunk
  for (let y = 1; y < CHUNK_SIZE_Y; y++) {
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
      for (let x = 0; x < CHUNK_SIZE_X; x++) {
        const type = chunk.getBlock(x, y, z);
        if (type === 0) {
          // Skip air
          continue;
        }

        const block = blockDefs[type];
        if (!block) {
          // Skip unknown blocks
          continue;
        }

        const [r, g, b, a] = colorMap[block.name];
        const isThisTransparent = Number(a) < 1.0;

        // World position of block
        const worldX = baseX + x;
        const worldZ = baseZ + z;

        // Check each face for visibility
        for (const face of FACES) {
          const [dx, dy, dz] = face.dir;
          const neighborType = getNeighborBlock(
            chunk,
            chunkManager,
            x + dx,
            y + dy,
            z + dz,
          );

          // Face is visible if neighbor is air or transparent and different
          const neighborIsAir = neighborType === 0;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          // Render face if:
          // - Neighbor is air (always visible)
          // - Neighbor is transparent and this block is solid
          // - Both transparent but different types (e.g., water next to leaves)
          let shouldRender = false;
          if (neighborIsAir) {
            shouldRender = true;
          } else if (!isThisTransparent && neighborTransparent) {
            // Solid block next to transparent block
            shouldRender = true;
          } else if (isThisTransparent && neighborType !== type) {
            // Two different transparent blocks
            shouldRender = true;
          }

          if (shouldRender) {
            // Add 6 vertices for this face
            for (const corner of face.corners) {
              positions.push(
                worldX + corner[0],
                y + corner[1], // Aligned with logical grid [y, y+1]
                worldZ + corner[2],
              );

              normals.push(dx, dy, dz);
              colors.push(r, g, b, a);
            }
          }
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    vertexCount: positions.length / 3,
    positionBuffer: null,
    normalBuffer: null,
    colorBuffer: null,
  };
}

/**
 * Upload chunk mesh to GPU.
 *
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Chunk} chunk - Chunk with mesh data
 */
export function uploadChunkMesh(gl, chunk) {
  const mesh = chunk.mesh;
  if (!mesh || mesh.vertexCount === 0) {
    return;
  }

  // Position buffer
  if (!mesh.positionBuffer) {
    mesh.positionBuffer = gl.createBuffer();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

  // Normal buffer
  if (!mesh.normalBuffer) {
    mesh.normalBuffer = gl.createBuffer();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);

  // Color buffer
  if (!mesh.colorBuffer) {
    mesh.colorBuffer = gl.createBuffer();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
}

/**
 * Delete chunk mesh GPU resources.
 *
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Chunk} chunk - Chunk to clean up
 */
export function deleteChunkMesh(gl, chunk) {
  const mesh = chunk.mesh;
  if (!mesh) {
    return;
  }

  if (mesh.positionBuffer) {
    gl.deleteBuffer(mesh.positionBuffer);

    mesh.positionBuffer = null;
  }
  if (mesh.normalBuffer) {
    gl.deleteBuffer(mesh.normalBuffer);

    mesh.normalBuffer = null;
  }
  if (mesh.colorBuffer) {
    gl.deleteBuffer(mesh.colorBuffer);

    mesh.colorBuffer = null;
  }
}
