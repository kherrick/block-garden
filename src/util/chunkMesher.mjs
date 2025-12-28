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
 * Feature flag to enable greedy meshing.
 * Set to true for optimized meshing, false for naive fallback.
 * NOTE: Currently disabled due to face winding bugs - will be fixed in future update
 */
export let USE_GREEDY_MESHING = false;

/**
 * Toggle greedy meshing on/off.
 *
 * @param {boolean} enabled
 */
export function setGreedyMeshing(enabled) {
  USE_GREEDY_MESHING = enabled;
}

/**
 * Face axis definitions for greedy meshing.
 * Each axis has two directions (positive and negative).
 */
const AXES = [
  { axis: 0, dir: 1, u: 2, v: 1 }, // +X: sweep X, quad on ZY
  { axis: 0, dir: -1, u: 2, v: 1 }, // -X
  { axis: 1, dir: 1, u: 0, v: 2 }, // +Y: sweep Y, quad on XZ
  { axis: 1, dir: -1, u: 0, v: 2 }, // -Y
  { axis: 2, dir: 1, u: 0, v: 1 }, // +Z: sweep Z, quad on XY
  { axis: 2, dir: -1, u: 0, v: 1 }, // -Z
];

/**
 * Get axis sizes for iteration.
 */
const AXIS_SIZES = [CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z];

/**
 * Generate mesh using greedy meshing algorithm.
 * Merges coplanar faces of the same block type into larger quads.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {BlockDefinition[]} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function greedyMeshChunk(colorMap, chunk, chunkManager, blockDefs) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];

  let vertexIndex = 0;

  const baseX = chunk.worldX;
  const baseZ = chunk.worldZ;

  // For each face direction
  for (const { axis, dir, u, v } of AXES) {
    const axisSize = AXIS_SIZES[axis];
    const uSize = AXIS_SIZES[u];
    const vSize = AXIS_SIZES[v];

    // Create mask for this slice
    // mask[u + v * uSize] = blockType if face should render, 0 otherwise
    const mask = new Int32Array(uSize * vSize);
    const maskColor = new Array(uSize * vSize);

    // Sweep through slices along this axis
    for (let d = 0; d < axisSize; d++) {
      // Build the mask for this slice
      for (let vPos = 0; vPos < vSize; vPos++) {
        for (let uPos = 0; uPos < uSize; uPos++) {
          // Convert u, v, d to x, y, z
          const coords = [0, 0, 0];
          coords[axis] = d;
          coords[u] = uPos;
          coords[v] = vPos;

          const [x, y, z] = coords;

          // Skip y=0 (bedrock)
          if (y === 0) {
            mask[uPos + vPos * uSize] = 0;
            continue;
          }

          const type = chunk.getBlock(x, y, z);
          if (type === 0) {
            mask[uPos + vPos * uSize] = 0;
            continue;
          }

          // Check neighbor in the face direction
          const neighborCoords = [x, y, z];
          neighborCoords[axis] += dir;

          const neighborType = getNeighborBlock(
            chunk,
            chunkManager,
            neighborCoords[0],
            neighborCoords[1],
            neighborCoords[2],
          );

          const block = blockDefs[type];
          if (!block) {
            mask[uPos + vPos * uSize] = 0;
            continue;
          }

          const [r, g, b, a] = colorMap[block.name] || [1, 1, 1, 1];
          const isThisTransparent = Number(a) < 1.0;
          const neighborIsAir = neighborType === 0;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          // Determine if face should render
          let shouldRender = false;
          if (neighborIsAir) {
            shouldRender = true;
          } else if (!isThisTransparent && neighborTransparent) {
            shouldRender = true;
          } else if (isThisTransparent && neighborType !== type) {
            shouldRender = true;
          }

          if (shouldRender) {
            mask[uPos + vPos * uSize] = type;
            maskColor[uPos + vPos * uSize] = [r, g, b, a];
          } else {
            mask[uPos + vPos * uSize] = 0;
          }
        }
      }

      // Greedy merge: scan mask and create quads
      for (let vPos = 0; vPos < vSize; vPos++) {
        for (let uPos = 0; uPos < uSize; ) {
          const maskIdx = uPos + vPos * uSize;
          const type = mask[maskIdx];

          if (type === 0) {
            uPos++;
            continue;
          }

          const color = maskColor[maskIdx];

          // Find width (extend in u direction)
          let width = 1;
          while (
            uPos + width < uSize &&
            mask[uPos + width + vPos * uSize] === type &&
            colorsEqual(maskColor[uPos + width + vPos * uSize], color)
          ) {
            width++;
          }

          // Find height (extend in v direction)
          let height = 1;
          let canExtend = true;
          while (vPos + height < vSize && canExtend) {
            for (let w = 0; w < width; w++) {
              const checkIdx = uPos + w + (vPos + height) * uSize;
              if (
                mask[checkIdx] !== type ||
                !colorsEqual(maskColor[checkIdx], color)
              ) {
                canExtend = false;
                break;
              }
            }
            if (canExtend) {
              height++;
            }
          }

          // Generate quad for this merged face
          const quadCoords = [0, 0, 0];
          quadCoords[axis] = d + (dir > 0 ? 1 : 0); // Offset for positive direction
          quadCoords[u] = uPos;
          quadCoords[v] = vPos;

          // Calculate world position
          const worldX =
            baseX + (axis === 0 ? quadCoords[0] : quadCoords[u === 0 ? u : 0]);
          const worldY =
            axis === 1
              ? quadCoords[1]
              : v === 1
                ? quadCoords[v]
                : u === 1
                  ? quadCoords[u]
                  : quadCoords[1];
          const worldZ =
            baseZ +
            (axis === 2
              ? quadCoords[2]
              : quadCoords[u === 2 ? u : v === 2 ? v : 2]);

          // Generate 4 vertices for this quad
          const quadVerts = generateQuadVertices(
            axis,
            dir,
            u,
            v,
            baseX,
            baseZ,
            d,
            uPos,
            vPos,
            width,
            height,
          );

          // Add vertices
          for (const vert of quadVerts) {
            positions.push(vert.x, vert.y, vert.z);

            const normal = [0, 0, 0];
            normal[axis] = dir;
            normals.push(normal[0], normal[1], normal[2]);

            colors.push(color[0], color[1], color[2], color[3]);
          }

          // Add indices for two triangles (CCW winding)
          if (dir > 0) {
            indices.push(
              vertexIndex,
              vertexIndex + 1,
              vertexIndex + 2,
              vertexIndex,
              vertexIndex + 2,
              vertexIndex + 3,
            );
          } else {
            // Reverse winding for negative direction faces
            indices.push(
              vertexIndex,
              vertexIndex + 2,
              vertexIndex + 1,
              vertexIndex,
              vertexIndex + 3,
              vertexIndex + 2,
            );
          }
          vertexIndex += 4;

          // Clear the mask for the merged region
          for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
              mask[uPos + w + (vPos + h) * uSize] = 0;
            }
          }

          uPos += width;
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    indexCount: indices.length,
    positionBuffer: null,
    normalBuffer: null,
    colorBuffer: null,
    indexBuffer: null,
  };
}

/**
 * Compare two color arrays for equality.
 *
 * @param {number[]} a
 * @param {number[]} b
 *
 * @returns {boolean}
 */
function colorsEqual(a, b) {
  if (!a || !b) return false;

  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Generate the 4 vertices for a quad.
 *
 * @param {number} axis - Main axis (0=X, 1=Y, 2=Z)
 * @param {number} dir - Direction (-1 or 1)
 * @param {number} u - U axis index
 * @param {number} v - V axis index
 * @param {number} baseX - Chunk world X
 * @param {number} baseZ - Chunk world Z
 * @param {number} d - Position along main axis
 * @param {number} uPos - Start position in U
 * @param {number} vPos - Start position in V
 * @param {number} width - Width in U direction
 * @param {number} height - Height in V direction
 *
 * @returns {Array<{x: number, y: number, z: number}>}
 */
function generateQuadVertices(
  axis,
  dir,
  u,
  v,
  baseX,
  baseZ,
  d,
  uPos,
  vPos,
  width,
  height,
) {
  const verts = [];

  // Calculate the 4 corners of the quad
  // Corner order: 0=origin, 1=+u, 2=+u+v, 3=+v
  for (let corner = 0; corner < 4; corner++) {
    const du = corner === 1 || corner === 2 ? width : 0;
    const dv = corner === 2 || corner === 3 ? height : 0;

    // Build coordinates in axis space
    const coords = [0, 0, 0];
    coords[axis] = d + (dir > 0 ? 1 : 0);
    coords[u] = uPos + du;
    coords[v] = vPos + dv;

    // coords[0] = x local, coords[1] = y, coords[2] = z local
    verts.push({
      x: baseX + coords[0],
      y: coords[1],
      z: baseZ + coords[2],
    });
  }

  return verts;
}

/**
 * Smart mesh function that uses greedy or naive meshing based on feature flag.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {BlockDefinition[]} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function smartMeshChunk(colorMap, chunk, chunkManager, blockDefs) {
  if (USE_GREEDY_MESHING) {
    return greedyMeshChunk(colorMap, chunk, chunkManager, blockDefs);
  }

  return meshChunk(colorMap, chunk, chunkManager, blockDefs);
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

  // Index buffer (for indexed geometry)
  if (mesh.indices && mesh.indices.length > 0) {
    if (!mesh.indexBuffer) {
      mesh.indexBuffer = gl.createBuffer();
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  }
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
  if (mesh.indexBuffer) {
    gl.deleteBuffer(mesh.indexBuffer);

    mesh.indexBuffer = null;
  }
}
