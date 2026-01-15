/**
 * @typedef {import('../state/config/blocks.mjs').BlockArray} BlockArray
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
import { getBlockById } from "../state/config/blocks.mjs";

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
 * @param {BlockArray} blockDefs - Block definitions
 *
 * @returns {boolean}
 */
function isTransparent(colorMap, blockType, blockDefs) {
  if (blockType === 0) {
    // Air is transparent
    return true;
  }

  const block = blockDefs.getById(blockType);

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
/**
 * Get block type at coordinates, handling cross-chunk lookups with cached neighbors.
 *
 * @param {Chunk} chunk - Current chunk
 * @param {ChunkManager} chunkManager - Chunk manager for neighbor lookups
 * @param {number} localX - Local X (may be out of bounds)
 * @param {number} y - Y coordinate
 * @param {number} localZ - Local Z (may be out of bounds)
 * @param {Object} neighbors - Cached neighbors
 *
 * @returns {number} Block type
 */
function getNeighborBlock(
  chunk,
  chunkManager,
  localX,
  y,
  localZ,
  neighbors = {},
) {
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

  // Handle neighbors using cache if available
  if (localX < 0) {
    if (neighbors.nx)
      return neighbors.nx.getBlock(localX + CHUNK_SIZE_X, y, localZ);
  } else if (localX >= CHUNK_SIZE_X) {
    if (neighbors.px)
      return neighbors.px.getBlock(localX - CHUNK_SIZE_X, y, localZ);
  }

  if (localZ < 0) {
    if (neighbors.nz)
      return neighbors.nz.getBlock(localX, y, localZ + CHUNK_SIZE_Z);
  } else if (localZ >= CHUNK_SIZE_Z) {
    if (neighbors.pz)
      return neighbors.pz.getBlock(localX, y, localZ - CHUNK_SIZE_Z);
  }

  // Fallback to slow lookup if neighbor not in cache (corners or beyond 1 chunk)
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
 * @param {BlockArray} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
/**
 * Vertex corner offsets for AO calculation for each face.
 */
const FACE_CORNERS = [
  {
    // +X
    uvs: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [0, 1],
    ],
    aoOffsets: [
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, -1, -1],
      ], // 1,0,0
      [
        [0, 1, 0],
        [0, 0, -1],
        [0, 1, -1],
      ], // 1,1,0
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, 1, 1],
      ], // 1,1,1
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, -1, -1],
      ], // 1,0,0
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, 1, 1],
      ], // 1,1,1
      [
        [0, -1, 0],
        [0, 0, 1],
        [0, -1, 1],
      ], // 1,0,1
    ],
  },
  {
    // -X
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 0],
    ],
    aoOffsets: [
      [
        [0, -1, 0],
        [0, 0, 1],
        [0, -1, 1],
      ], // 0,0,1
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, 1, 1],
      ], // 0,1,1
      [
        [0, 1, 0],
        [0, 0, -1],
        [0, 1, -1],
      ], // 0,1,0
      [
        [0, -1, 0],
        [0, 0, 1],
        [0, -1, 1],
      ], // 0,0,1
      [
        [0, 1, 0],
        [0, 0, -1],
        [0, 1, -1],
      ], // 0,1,0
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, -1, -1],
      ], // 0,0,0
    ],
  },
  {
    // +Y
    uvs: [
      [0, 0],
      [0, 1],
      [1, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ],
    aoOffsets: [
      [
        [-1, 0, 0],
        [0, 0, -1],
        [-1, 0, -1],
      ], // 0,1,0
      [
        [-1, 0, 0],
        [0, 0, 1],
        [-1, 0, 1],
      ], // 0,1,1
      [
        [1, 0, 0],
        [0, 0, 1],
        [1, 0, 1],
      ], // 1,1,1
      [
        [-1, 0, 0],
        [0, 0, -1],
        [-1, 0, -1],
      ], // 0,1,0
      [
        [1, 0, 0],
        [0, 0, 1],
        [1, 0, 1],
      ], // 1,1,1
      [
        [1, 0, 0],
        [0, 0, -1],
        [1, 0, -1],
      ], // 1,1,0
    ],
  },
  {
    // -Y
    uvs: [
      [0, 1],
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    aoOffsets: [
      [
        [-1, 0, 0],
        [0, 0, 1],
        [-1, 0, 1],
      ], // 0,0,1
      [
        [-1, 0, 0],
        [0, 0, -1],
        [-1, 0, -1],
      ], // 0,0,0
      [
        [1, 0, 0],
        [0, 0, -1],
        [1, 0, -1],
      ], // 1,0,0
      [
        [-1, 0, 0],
        [0, 0, 1],
        [-1, 0, 1],
      ], // 0,0,1
      [
        [1, 0, 0],
        [0, 0, -1],
        [1, 0, -1],
      ], // 1,0,0
      [
        [1, 0, 0],
        [0, 0, 1],
        [1, 0, 1],
      ], // 1,0,1
    ],
  },
  {
    // +Z
    uvs: [
      [0, 0],
      [0, 1],
      [1, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ],
    aoOffsets: [
      [
        [-1, 0, 0],
        [0, -1, 0],
        [-1, -1, 0],
      ], // 0,0,1
      [
        [-1, 0, 0],
        [0, 1, 0],
        [-1, 1, 0],
      ], // 0,1,1
      [
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ], // 1,1,1
      [
        [-1, 0, 0],
        [0, -1, 0],
        [-1, -1, 0],
      ], // 0,0,1
      [
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ], // 1,1,1
      [
        [1, 0, 0],
        [0, -1, 0],
        [1, -1, 0],
      ], // 1,0,1
    ],
  },
  {
    // -Z
    uvs: [
      [1, 0],
      [1, 1],
      [0, 1],
      [1, 0],
      [0, 1],
      [0, 0],
    ],
    aoOffsets: [
      [
        [1, 0, 0],
        [0, -1, 0],
        [1, -1, 0],
      ], // 1,0,0
      [
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ], // 1,1,0
      [
        [-1, 0, 0],
        [0, 1, 0],
        [-1, 1, 0],
      ], // 0,1,0
      [
        [1, 0, 0],
        [0, -1, 0],
        [1, -1, 0],
      ], // 1,0,0
      [
        [-1, 0, 0],
        [0, 1, 0],
        [-1, 1, 0],
      ], // 0,1,0
      [
        [-1, 0, 0],
        [0, -1, 0],
        [-1, -1, 0],
      ], // 0,0,0
    ],
  },
];

/**
 * Calculate Ambient Occlusion for a vertex.
 */
function getAO(chunk, chunkManager, x, y, z, offsets, blockDefs, neighbors) {
  let occlusion = 0;

  const side1 = getNeighborBlock(
    chunk,
    chunkManager,
    x + offsets[0][0],
    y + offsets[0][1],
    z + offsets[0][2],
    neighbors,
  );
  const side2 = getNeighborBlock(
    chunk,
    chunkManager,
    x + offsets[1][0],
    y + offsets[1][1],
    z + offsets[1][2],
    neighbors,
  );
  const corner = getNeighborBlock(
    chunk,
    chunkManager,
    x + offsets[2][0],
    y + offsets[2][1],
    z + offsets[2][2],
    neighbors,
  );

  const s1 = side1 !== 0 && blockDefs.getById(side1)?.solid ? 1 : 0;
  const s2 = side2 !== 0 && blockDefs.getById(side2)?.solid ? 1 : 0;
  const c = corner !== 0 && blockDefs.getById(corner)?.solid ? 1 : 0;

  if (s1 === 1 && s2 === 1) {
    occlusion = 3;
  } else {
    occlusion = s1 + s2 + c;
  }

  return [1.0, 0.7, 0.5, 0.3][occlusion];
}

/**
 * Generate mesh for a chunk with face culling. Only visible faces (adjacent to air or transparent
 * blocks) are included in the mesh, dramatically reducing vertex count.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {BlockArray} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function meshChunk(colorMap, chunk, chunkManager, blockDefs) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const ao = [];
  const localUVs = [];
  const cornerAO = [];

  const baseX = chunk.worldX;
  const baseZ = chunk.worldZ;

  // Cache neighbor chunks for faster lookup
  const neighbors = {
    nx: chunkManager.getChunk(chunk.chunkX - 1, chunk.chunkZ),
    px: chunkManager.getChunk(chunk.chunkX + 1, chunk.chunkZ),
    nz: chunkManager.getChunk(chunk.chunkX, chunk.chunkZ - 1),
    pz: chunkManager.getChunk(chunk.chunkX, chunk.chunkZ + 1),
  };

  const tileSize = 1 / 16;

  // Iterate all blocks in chunk
  for (let y = 1; y < CHUNK_SIZE_Y; y++) {
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
      for (let x = 0; x < CHUNK_SIZE_X; x++) {
        const type = chunk.getBlock(x, y, z);
        if (type === 0) {
          // Skip air
          continue;
        }

        const block = blockDefs.getById(type);

        if (!block) {
          // Skip unknown blocks
          continue;
        }

        const [r, g, b, a_val] = colorMap[block.name] || [1, 1, 1, 1];
        const isThisTransparent = Number(a_val) < 1.0;

        // World position of block
        const worldX = baseX + x;
        const worldZ = baseZ + z;

        // Atlas coordinates
        const uBase = (type % 16) * tileSize;
        const vBase = Math.floor(type / 16) * tileSize;

        // Check each face for visibility
        for (let i = 0; i < FACES.length; i++) {
          const face = FACES[i];
          const [dx, dy, dz] = face.dir;
          const neighborType = getNeighborBlock(
            chunk,
            chunkManager,
            x + dx,
            y + dy,
            z + dz,
            neighbors,
          );

          // Face is visible if neighbor is air or transparent and different
          const neighborIsAir = neighborType === 0;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          let shouldRender = false;
          if (neighborIsAir) {
            shouldRender = true;
          } else if (!isThisTransparent && neighborTransparent) {
            shouldRender = true;
          } else if (isThisTransparent && neighborType !== type) {
            shouldRender = true;
          }

          if (shouldRender) {
            const faceExtra = FACE_CORNERS[i];

            // Radial AO: Get AO for all 4 canonical corners
            // These correspond to (0,0), (1,0), (1,1), (0,1) in relative UV space
            const ao4 = [1.0, 1.0, 1.0, 1.0];
            if (block.solid) {
              const cornersToFetch = [0, 1, 2, 5];
              for (let c = 0; c < 4; c++) {
                ao4[c] = getAO(
                  chunk,
                  chunkManager,
                  x + dx,
                  y + dy,
                  z + dz,
                  faceExtra.aoOffsets[cornersToFetch[c]],
                  blockDefs,
                  neighbors,
                );
              }
            }

            // Add 6 vertices for this face
            for (let v = 0; v < 6; v++) {
              const corner = face.corners[v];
              positions.push(
                worldX + corner[0],
                y + corner[1],
                worldZ + corner[2],
              );

              normals.push(dx, dy, dz);
              colors.push(r, g, b, a_val);

              const uvCoord = faceExtra.uvs[v];
              uvs.push(
                uBase + uvCoord[0] * tileSize,
                vBase + uvCoord[1] * tileSize,
              );

              // Local coords and 4-corner AO for Radial AO
              localUVs.push(uvCoord[0], uvCoord[1]);
              cornerAO.push(...ao4);

              // AO calculation (only for solid blocks)
              if (block.solid) {
                ao.push(
                  getAO(
                    chunk,
                    chunkManager,
                    x + dx,
                    y + dy,
                    z + dz,
                    faceExtra.aoOffsets[v],
                    blockDefs,
                    neighbors,
                  ),
                );
              } else {
                ao.push(1.0);
              }
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
    uvs: new Float32Array(uvs),
    ao: new Float32Array(ao),
    localUVs: new Float32Array(localUVs),
    cornerAO: new Float32Array(cornerAO),
    vertexCount: positions.length / 3,
    positionBuffer: null,
    normalBuffer: null,
    colorBuffer: null,
    uvBuffer: null,
    aoBuffer: null,
    localUVBuffer: null,
    cornerAOBuffer: null,
  };
}

/**
 * Feature flag to enable greedy meshing.
 * Set to true for optimized meshing, false for naive fallback.
 */
export let USE_GREEDY_MESHING = true;

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
 * @param {BlockArray} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function greedyMeshChunk(colorMap, chunk, chunkManager, blockDefs) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const ao = [];
  const localUVs = [];
  const cornerAO = [];
  const indices = [];

  let vertexIndex = 0;

  const baseX = chunk.worldX;
  const baseZ = chunk.worldZ;

  const tileSize = 1 / 16;

  // Cache neighbor chunks
  const neighbors = {
    nx: chunkManager.getChunk(chunk.chunkX - 1, chunk.chunkZ),
    px: chunkManager.getChunk(chunk.chunkX + 1, chunk.chunkZ),
    nz: chunkManager.getChunk(chunk.chunkX, chunk.chunkZ - 1),
    pz: chunkManager.getChunk(chunk.chunkX, chunk.chunkZ + 1),
  };

  // For each face direction
  for (let i = 0; i < AXES.length; i++) {
    const { axis, dir, u, v } = AXES[i];
    const axisSize = AXIS_SIZES[axis];
    const uSize = AXIS_SIZES[u];
    const vSize = AXIS_SIZES[v];

    // Sweep through slices along this axis
    for (let d = 0; d < axisSize; d++) {
      // Create mask for this slice: mask[u + v * uSize] = blockType if face should render
      const mask = new Int32Array(uSize * vSize);

      for (let vPos = 0; vPos < vSize; vPos++) {
        for (let uPos = 0; uPos < uSize; uPos++) {
          const coords = [0, 0, 0];
          coords[axis] = d;
          coords[u] = uPos;
          coords[v] = vPos;

          const [x, y, z] = coords;
          if (y === 0) continue; // bedrock check

          const type = chunk.getBlock(x, y, z);
          if (type === 0) continue;

          // Check neighbor in the face direction
          const neighborCoords = [x, y, z];
          neighborCoords[axis] += dir;

          const neighborType = getNeighborBlock(
            chunk,
            chunkManager,
            neighborCoords[0],
            neighborCoords[1],
            neighborCoords[2],
            neighbors,
          );

          const block = blockDefs.getById(type);
          if (!block) continue;

          const [r, g, b, a] = colorMap[block.name] || [1, 1, 1, 1];
          const isThisTransparent = Number(a) < 1.0;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          let shouldRender = false;
          if (neighborType === 0) {
            shouldRender = true;
          } else if (!isThisTransparent && neighborTransparent) {
            shouldRender = true;
          } else if (isThisTransparent && neighborType !== type) {
            shouldRender = true;
          }

          if (shouldRender) {
            mask[uPos + vPos * uSize] = type;
          }
        }
      }

      // Greedy merge for this slice
      for (let vPos = 0; vPos < vSize; vPos++) {
        for (let uPos = 0; uPos < uSize; ) {
          const type = mask[uPos + vPos * uSize];
          if (type === 0) {
            uPos++;
            continue;
          }

          // Find width
          let width = 1;
          while (
            uPos + width < uSize &&
            mask[uPos + width + vPos * uSize] === type
          ) {
            width++;
          }

          // Find height
          let height = 1;
          let canExtend = true;
          while (vPos + height < vSize && canExtend) {
            for (let w = 0; w < width; w++) {
              if (mask[uPos + w + (vPos + height) * uSize] !== type) {
                canExtend = false;
                break;
              }
            }
            if (canExtend) height++;
          }

          const block = blockDefs.getById(type);
          const [r, g, b, a_val] = colorMap[block?.name] || [1, 1, 1, 1];
          const uBase = (type % 16) * tileSize;
          const vBase = Math.floor(type / 16) * tileSize;

          // Calculate AO values for the 4 canonical quad corners once
          const ao4 = [1.0, 1.0, 1.0, 1.0];
          if (block.solid) {
            const faceExtra = FACE_CORNERS[i];
            const cornersToFetch = [0, 1, 2, 5];
            const cornerQuadPositions = [
              [0, 0],
              [width, 0],
              [width, height],
              [0, height],
            ];
            for (let c = 0; c < 4; c++) {
              const qc = cornerQuadPositions[c];
              const aoPos = [0, 0, 0];
              aoPos[axis] = d + dir;
              aoPos[u] = uPos + qc[0];
              aoPos[v] = vPos + qc[1];

              ao4[c] = getAO(
                chunk,
                chunkManager,
                aoPos[0],
                aoPos[1],
                aoPos[2],
                faceExtra.aoOffsets[cornersToFetch[c]],
                blockDefs,
                neighbors,
              );
            }
          }

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

          // Push all attributes for each vertex, once
          for (let j = 0; j < 4; j++) {
            const vert = quadVerts[j];
            positions.push(vert.x, vert.y, vert.z);

            const norm = [0, 0, 0];
            norm[axis] = dir;
            normals.push(...norm);
            colors.push(r, g, b, a_val);

            // UVs: map quad corners to atlas tile corners
            // Corner order: 0=(0,0), 1=(w,0), 2=(w,h), 3=(0,h) in UV space
            const uvCoords = [
              [0, 0],
              [width, 0],
              [width, height],
              [0, height],
            ][j];
            uvs.push(
              uBase + (uvCoords[0] / width) * tileSize,
              vBase + (uvCoords[1] / height) * tileSize,
            );

            // Local coordinates for Radial AO interpolation (0,0 to 1,1)
            const lu = j === 1 || j === 2 ? 1 : 0;
            const lv = j === 2 || j === 3 ? 1 : 0;
            localUVs.push(lu, lv);

            // Pack 4 AO values (corner AO for bilinear interpolation)
            cornerAO.push(...ao4);

            // Legacy AO (single value per vertex)
            ao.push(ao4[j]);
          }

          // CCW winding: 0-1-2, 0-2-3
          // Adjust winding based on face direction
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

          // Clear mask for merged region
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
    uvs: new Float32Array(uvs),
    ao: new Float32Array(ao),
    localUVs: new Float32Array(localUVs),
    cornerAO: new Float32Array(cornerAO),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    indexCount: indices.length,
    positionBuffer: null,
    normalBuffer: null,
    colorBuffer: null,
    uvBuffer: null,
    aoBuffer: null,
    localUVBuffer: null,
    cornerAOBuffer: null,
    indexBuffer: null,
  };
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
  // This matches the UV mapping [0,0], [width,0], [width,height], [0,height]
  for (let corner = 0; corner < 4; corner++) {
    const du = corner === 1 || corner === 2 ? width : 0;
    const dv = corner === 2 || corner === 3 ? height : 0;

    const coords = [0, 0, 0];
    coords[axis] = d + (dir > 0 ? 1 : 0);
    coords[u] = uPos + du;
    coords[v] = vPos + dv;

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
 * @param {BlockArray} blockDefs - Block definitions
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

  // UV buffer
  if (mesh.uvs) {
    if (!mesh.uvBuffer) {
      mesh.uvBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
  }

  // AO buffer
  if (mesh.ao) {
    if (!mesh.aoBuffer) {
      mesh.aoBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.aoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.ao, gl.STATIC_DRAW);
  }

  // Local UV buffer (Radial AO)
  if (mesh.localUVs) {
    if (!mesh.localUVBuffer) {
      mesh.localUVBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.localUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.localUVs, gl.STATIC_DRAW);
  }

  // Corner AO buffer (Radial AO)
  if (mesh.cornerAO) {
    if (!mesh.cornerAOBuffer) {
      mesh.cornerAOBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cornerAOBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.cornerAO, gl.STATIC_DRAW);
  }

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
  if (mesh.uvBuffer) {
    gl.deleteBuffer(mesh.uvBuffer);
    mesh.uvBuffer = null;
  }
  if (mesh.aoBuffer) {
    gl.deleteBuffer(mesh.aoBuffer);
    mesh.aoBuffer = null;
  }
  if (mesh.localUVBuffer) {
    gl.deleteBuffer(mesh.localUVBuffer);
    mesh.localUVBuffer = null;
  }
  if (mesh.cornerAOBuffer) {
    gl.deleteBuffer(mesh.cornerAOBuffer);
    mesh.cornerAOBuffer = null;
  }
  if (mesh.indexBuffer) {
    gl.deleteBuffer(mesh.indexBuffer);

    mesh.indexBuffer = null;
  }
}
