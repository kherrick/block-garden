/**
 * @typedef {import('../config/blocks.mjs').Blocks} Blocks
 */

/**
 * @typedef {import('./chunk.mjs').Chunk} Chunk
 */

/**
 * @typedef {import('./chunk.mjs').ChunkMesh} ChunkMesh
 */

/**
 * @typedef {import('../chunkManager.mjs').ChunkManager} ChunkManager
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
 * @param {Blocks} blockDefs - Block definitions
 *
 * @returns {boolean}
 */
function isTransparent(colorMap, blockType, blockDefs) {
  if (blockType === 0) {
    // Air is transparent
    return true;
  }

  if (blockType === -1) {
    // Unloaded = opaque (prevent seeing through world boundary)
    return false;
  }

  const block = blockDefs.getById(blockType);

  if (!block) {
    // Unknown = transparent (so we don't render faces against it)
    return true;
  }

  const color = colorMap[block.name];
  if (!color) return true;

  return Number(color[3]) < 1.0; // Alpha < 1 = transparent
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
 * @param {{nx?: Chunk, px?: Chunk, nz?: Chunk, pz?: Chunk}} neighbors - Cached neighbors
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
    return -1; // Unloaded
  } else if (localX >= CHUNK_SIZE_X) {
    if (neighbors.px)
      return neighbors.px.getBlock(localX - CHUNK_SIZE_X, y, localZ);
    return -1; // Unloaded
  }

  if (localZ < 0) {
    if (neighbors.nz)
      return neighbors.nz.getBlock(localX, y, localZ + CHUNK_SIZE_Z);
    return -1; // Unloaded
  } else if (localZ >= CHUNK_SIZE_Z) {
    if (neighbors.pz)
      return neighbors.pz.getBlock(localX, y, localZ - CHUNK_SIZE_Z);
    return -1; // Unloaded
  }

  // Fallback to slow lookup if neighbor not in cache (corners or beyond 1 chunk)
  const worldX = chunk.worldX + localX;
  const worldZ = chunk.worldZ + localZ;

  const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
  const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);
  const neighborChunk = chunkManager.getChunk(chunkX, chunkZ);

  if (!neighborChunk) return -1;

  const lx = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
  const lz = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

  return neighborChunk.getBlock(lx, y, lz);
}

/**
 * Get light level at coordinates, handling cross-chunk lookups with cached neighbors.
 *
 * @param {Chunk} chunk - Current chunk
 * @param {ChunkManager} chunkManager - Chunk manager for neighbor lookups
 * @param {number} localX - Local X (may be out of bounds)
 * @param {number} y - Y coordinate
 * @param {number} localZ - Local Z (may be out of bounds)
 * @param {{nx?: Chunk, px?: Chunk, nz?: Chunk, pz?: Chunk}} neighbors - Cached neighbors
 *
 * @returns {number} Light level 0.0-1.0
 */
function getNeighborLight(
  chunk,
  chunkManager,
  localX,
  y,
  localZ,
  neighbors = {},
) {
  // Handle Y bounds
  if (y < 0 || y >= CHUNK_SIZE_Y) {
    return 1.0; // Fully lit above/below world
  }

  // Within this chunk
  if (
    localX >= 0 &&
    localX < CHUNK_SIZE_X &&
    localZ >= 0 &&
    localZ < CHUNK_SIZE_Z
  ) {
    return (chunk.lightMap?.get(localX, y, localZ) ?? 0) / 15;
  }

  // Handle neighbors using cache if available
  let neighborChunk;
  if (localX < 0) {
    neighborChunk = neighbors.nx;
    localX += CHUNK_SIZE_X;
  } else if (localX >= CHUNK_SIZE_X) {
    neighborChunk = neighbors.px;
    localX -= CHUNK_SIZE_X;
  } else if (localZ < 0) {
    neighborChunk = neighbors.nz;
    localZ += CHUNK_SIZE_Z;
  } else if (localZ >= CHUNK_SIZE_Z) {
    neighborChunk = neighbors.pz;
    localZ -= CHUNK_SIZE_Z;
  }

  if (neighborChunk && neighborChunk.lightMap) {
    return neighborChunk.lightMap.get(localX, y, localZ) / 15;
  }

  // Fallback to slow lookup for corners or uncached
  const worldX = chunk.worldX + localX;
  const worldZ = chunk.worldZ + localZ;

  const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
  const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);
  const targetChunk = chunkManager.getChunk(chunkX, chunkZ);

  if (!targetChunk || !targetChunk.lightMap) return 0;

  const lx = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
  const lz = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

  return targetChunk.lightMap.get(lx, y, lz) / 15;
}

/**
 * Generate mesh for a chunk with face culling. Only visible faces (adjacent to air or transparent
 * blocks) are included in the mesh, dramatically reducing vertex count.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {Blocks} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
/**
 * Vertex corner offsets for AO calculation for each face.
 * Uses 8-neighbor approach with all neighbors checked for each corner.
 * Neighbors are ordered: 4 edges + 3 faces + 1 corner (8 total)
 */
const FACE_CORNERS = [
  {
    // +X: neighbors for each corner in the face's local space
    uvs: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [0, 1],
    ],
    // Each corner has 8 neighbor offsets: 4 edges, 3 faces, 1 corner
    aoOffsets: [
      // Corner at (0,0) - corresponds to UV (0,0)
      [
        [0, -1, 0], // edge 1: -y
        [0, 0, -1], // edge 2: -z
        [0, 1, 0], // face 1: +y
        [0, 0, 1], // face 2: +z
        [0, -1, -1], // face 3: -y-z
        [0, -1, 1], // corner-adjacent 1: -y+z
        [0, 1, -1], // corner-adjacent 2: +y-z
        [0, 1, 1], // corner 1: +y+z
      ],
      // Corner at (1,0) - corresponds to UV (1,0)
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, -1],
        [0, -1, 1],
        [0, 1, -1],
        [0, 1, 1],
      ],
      // Corner at (1,1) - corresponds to UV (1,1)
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 1],
        [0, 1, -1],
        [0, -1, 1],
        [0, -1, -1],
      ],
      // Repeat for 2nd triangle
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, -1],
        [0, -1, 1],
        [0, 1, -1],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 1],
        [0, 1, -1],
        [0, -1, 1],
        [0, -1, -1],
      ],
      // Corner at (0,1) - corresponds to UV (0,1)
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 1],
        [0, 1, -1],
        [0, -1, 1],
        [0, -1, -1],
      ],
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
        [0, 1, 0],
        [0, 0, -1],
        [0, -1, 1],
        [0, -1, -1],
        [0, 1, 1],
        [0, 1, -1],
      ],
      [
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 1],
        [0, 1, -1],
        [0, -1, 1],
        [0, -1, -1],
      ],
      [
        [0, 1, 0],
        [0, 0, -1],
        [0, -1, 0],
        [0, 0, 1],
        [0, 1, -1],
        [0, 1, 1],
        [0, -1, -1],
        [0, -1, 1],
      ],
      [
        [0, -1, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 0, -1],
        [0, -1, 1],
        [0, -1, -1],
        [0, 1, 1],
        [0, 1, -1],
      ],
      [
        [0, 1, 0],
        [0, 0, -1],
        [0, -1, 0],
        [0, 0, 1],
        [0, 1, -1],
        [0, 1, 1],
        [0, -1, -1],
        [0, -1, 1],
      ],
      [
        [0, -1, 0],
        [0, 0, -1],
        [0, 1, 0],
        [0, 0, 1],
        [0, -1, -1],
        [0, -1, 1],
        [0, 1, -1],
        [0, 1, 1],
      ],
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
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
      ],
      [
        [-1, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
      ],
      [
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, 0],
        [0, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
      ],
      [
        [-1, 0, 0],
        [0, 0, -1],
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
      ],
      [
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, 0],
        [0, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
      ],
      [
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 0],
        [0, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
      ],
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
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
      ],
      [
        [-1, 0, 0],
        [0, 0, -1],
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
      ],
      [
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 0],
        [0, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
      ],
      [
        [-1, 0, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
      ],
      [
        [1, 0, 0],
        [0, 0, -1],
        [-1, 0, 0],
        [0, 0, 1],
        [1, 0, -1],
        [1, 0, 1],
        [-1, 0, -1],
        [-1, 0, 1],
      ],
      [
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, 0],
        [0, 0, -1],
        [1, 0, 1],
        [1, 0, -1],
        [-1, 0, 1],
        [-1, 0, -1],
      ],
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
        [1, 0, 0],
        [0, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
      ],
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [0, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
      ],
      [
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
      ],
      [
        [-1, 0, 0],
        [0, -1, 0],
        [1, 0, 0],
        [0, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
      ],
      [
        [1, 0, 0],
        [0, -1, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
      ],
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
        [-1, 0, 0],
        [0, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
      ],
      [
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
      ],
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [0, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
      ],
      [
        [1, 0, 0],
        [0, -1, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
      ],
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [0, -1, 0],
        [-1, 1, 0],
        [-1, -1, 0],
        [1, 1, 0],
        [1, -1, 0],
      ],
      [
        [-1, 0, 0],
        [0, -1, 0],
        [1, 0, 0],
        [0, 1, 0],
        [-1, -1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [1, 1, 0],
      ],
    ],
  },
];

/**
 * Ambient Occlusion gamma correction table.
 * Maps occlusion count to AO multipliers with gamma correction.
 * Default gamma = 1.8.
 */
const AO_GAMMA = 1.8;
const AO_LIGHT_AMOUNTS = [
  Math.pow(0.75, 1.0 / AO_GAMMA), // 5 occluders: 0.75^(1/1.8)
  Math.pow(0.5, 1.0 / AO_GAMMA), // 6 occluders: 0.5^(1/1.8)
  Math.pow(0.25, 1.0 / AO_GAMMA), // 7+ occluders: 0.25^(1/1.8)
];

/**
 * Calculate Ambient Occlusion for a vertex.
 * Checks up to 8 neighbors around a corner and applies darkening only when
 * 5 or more neighbors are solid (occluding).
 *
 * @param {Chunk} chunk - Current chunk
 * @param {ChunkManager} chunkManager - Chunk manager for neighbor lookups
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {Array<Array<number>>} offsets - 8 neighbor offsets for AO calculation
 * @param {Blocks} blockDefs - Block definitions
 * @param {{nx?: Chunk, px?: Chunk, nz?: Chunk, pz?: Chunk}} neighbors - Cached neighbor chunks
 *
 * @returns {number} AO value (1.0 = no occlusion, < 1.0 = darkened)
 */
function getAO(chunk, chunkManager, x, y, z, offsets, blockDefs, neighbors) {
  let occluders = 0;

  // Count how many of the 8 neighbors are solid (opaque) blocks
  for (let i = 0; i < 8; i++) {
    const blockId = getNeighborBlock(
      chunk,
      chunkManager,
      x + offsets[i][0],
      y + offsets[i][1],
      z + offsets[i][2],
      neighbors,
    );

    // Count this neighbor as an occluder if it's a solid block
    if (blockId !== 0 && blockDefs.getById(blockId)?.solid) {
      occluders++;
    }
  }

  // Only apply darkening if 5 or more neighbors are occluding
  if (occluders <= 4) {
    return 1.0; // No occlusion
  }

  // Apply gamma-corrected darkening based on occlusion count
  // occluders ranges from 5-8, so we subtract 5 to index into our table
  const aoIndex = Math.min(occluders - 5, 2); // Clamp to [0, 2] for our 3-entry table
  return AO_LIGHT_AMOUNTS[aoIndex];
}

/**
 * Generate mesh for a chunk with face culling. Only visible faces (adjacent to air or transparent
 * blocks) are included in the mesh, dramatically reducing vertex count.
 *
 * @param {{[k: string]: number[]}} colorMap
 * @param {Chunk} chunk - Chunk to mesh
 * @param {ChunkManager} chunkManager - For neighbor lookups
 * @param {Blocks} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function meshChunk(colorMap, chunk, chunkManager, blockDefs) {
  // Output buffers
  const opaque = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    vertexCount: 0,
  };

  const transparent = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    vertexCount: 0,
  };

  const water = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    vertexCount: 0,
  };

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
  // Add padding to prevent texture bleeding at tile edges
  // With 1-pixel padding on each side of a 16-pixel tile:
  // - Usable portion: 14 pixels
  // - Offset: 1 pixel / 16 = 0.0625
  // - Scale: 14 pixels / 16 = 0.875
  const uvPaddingOffset = 1 / 16;
  const uvPaddingScale = 14 / 16;

  // Iterate all blocks in chunk
  for (let y = 0; y < CHUNK_SIZE_Y; y++) {
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
          const neighborUnloaded = neighborType === -1;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          let shouldRender = false;
          if (neighborIsAir) {
            shouldRender = true;
          } else if (neighborUnloaded) {
            // Cull transparent block faces against unloaded chunks to prevent internal walls
            shouldRender = !isThisTransparent;
          } else if (!isThisTransparent && neighborTransparent) {
            shouldRender = true;
          } else if (
            isThisTransparent &&
            neighborTransparent &&
            neighborType !== type
          ) {
            // Transparent block renders if neighbor is transparent but different (e.g. water vs leaves)
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

            // Water blocks get their own mesh for independent texture control
            let target;
            if (block.name === "Water") {
              target = water;
            } else {
              target = isThisTransparent ? transparent : opaque;
            }

            // Add 6 vertices for this face
            for (let v = 0; v < 6; v++) {
              const corner = face.corners[v];
              target.positions.push(
                worldX + corner[0],
                y + corner[1],
                worldZ + corner[2],
              );

              target.normals.push(dx, dy, dz);
              target.colors.push(r, g, b, a_val);

              // Light level: Get light at the face position
              const lightVal = chunk.lightMap
                ? chunk.lightMap.get(x + dx, y + dy, z + dz)
                : 0;
              // Convert 0-15 to 0.0-1.0 (linear for now, let shader handle curve if needed)
              target.lightLevels.push(lightVal / 15);

              const uvCoord = faceExtra.uvs[v];
              target.uvs.push(
                uBase +
                  uvPaddingOffset * tileSize +
                  uvCoord[0] * uvPaddingScale * tileSize,
                vBase +
                  uvPaddingOffset * tileSize +
                  uvCoord[1] * uvPaddingScale * tileSize,
              );

              // Local coords and 4-corner AO for Radial AO
              target.localUVs.push(uvCoord[0], uvCoord[1]);
              target.cornerAO.push(...ao4);

              // AO calculation (only for solid blocks)
              if (block.solid) {
                target.ao.push(
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
                target.ao.push(1.0);
              }
            }
            target.vertexCount += 6;
          }
        }
      }
    }
  }

  return {
    opaque: {
      positions: new Float32Array(opaque.positions),
      normals: new Float32Array(opaque.normals),
      colors: new Float32Array(opaque.colors),
      uvs: new Float32Array(opaque.uvs),
      ao: new Float32Array(opaque.ao),
      localUVs: new Float32Array(opaque.localUVs),
      cornerAO: new Float32Array(opaque.cornerAO),
      lightLevels: new Float32Array(opaque.lightLevels),
      vertexCount: opaque.vertexCount,
    },
    transparent: {
      positions: new Float32Array(transparent.positions),
      normals: new Float32Array(transparent.normals),
      colors: new Float32Array(transparent.colors),
      uvs: new Float32Array(transparent.uvs),
      ao: new Float32Array(transparent.ao),
      localUVs: new Float32Array(transparent.localUVs),
      cornerAO: new Float32Array(transparent.cornerAO),
      lightLevels: new Float32Array(transparent.lightLevels),
      vertexCount: transparent.vertexCount,
    },
    water: {
      positions: new Float32Array(water.positions),
      normals: new Float32Array(water.normals),
      colors: new Float32Array(water.colors),
      uvs: new Float32Array(water.uvs),
      ao: new Float32Array(water.ao),
      localUVs: new Float32Array(water.localUVs),
      cornerAO: new Float32Array(water.cornerAO),
      lightLevels: new Float32Array(water.lightLevels),
      vertexCount: water.vertexCount,
    },
    vertexCount:
      opaque.vertexCount + transparent.vertexCount + water.vertexCount,
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
 * @param {Blocks} blockDefs - Block definitions
 *
 * @returns {ChunkMesh}
 */
export function greedyMeshChunk(colorMap, chunk, chunkManager, blockDefs) {
  // Output buffers
  const opaque = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    indices: /** @type {number[]} */ ([]),
    vertexCount: 0,
    indexCount: 0,
  };

  const transparent = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    indices: /** @type {number[]} */ ([]),
    vertexCount: 0,
    indexCount: 0,
  };

  const water = {
    positions: /** @type {number[]} */ ([]),
    normals: /** @type {number[]} */ ([]),
    colors: /** @type {number[]} */ ([]),
    uvs: /** @type {number[]} */ ([]),
    ao: /** @type {number[]} */ ([]),
    lightLevels: /** @type {number[]} */ ([]),
    localUVs: /** @type {number[]} */ ([]),
    cornerAO: /** @type {number[]} */ ([]),
    indices: /** @type {number[]} */ ([]),
    vertexCount: 0,
    indexCount: 0,
  };

  const baseX = chunk.worldX;
  const baseZ = chunk.worldZ;

  const tileSize = 1 / 16;
  // Add padding to prevent texture bleeding at tile edges (same as meshChunk)
  const uvPaddingOffset = 1 / 16;
  const uvPaddingScale = 14 / 16;

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
          if (y === 0) {
            // bedrock check
            continue;
          }

          const type = chunk.getBlock(x, y, z);
          if (type === 0) {
            continue;
          }

          const block = blockDefs.getById(type);
          if (!block) continue;
          const [r, g, b, a_val] = colorMap[block.name] || [1, 1, 1, 1];
          const isThisTransparent = Number(a_val) < 1.0;

          const neighborType = getNeighborBlock(
            chunk,
            chunkManager,
            x + (axis === 0 ? dir : 0),
            y + (axis === 1 ? dir : 0),
            z + (axis === 2 ? dir : 0),
            neighbors,
          );

          // Face is visible if neighbor is air or transparent and different
          const neighborIsAir = neighborType === 0;
          const neighborUnloaded = neighborType === -1;
          const neighborTransparent = isTransparent(
            colorMap,
            neighborType,
            blockDefs,
          );

          let shouldRender = false;
          if (neighborIsAir) {
            shouldRender = true;
          } else if (neighborUnloaded) {
            // Cull transparent block faces against unloaded chunks
            shouldRender = !isThisTransparent;
          } else if (!isThisTransparent && neighborTransparent) {
            shouldRender = true;
          } else if (
            isThisTransparent &&
            neighborTransparent &&
            neighborType !== type
          ) {
            // Transparent block renders if neighbor is transparent but different (e.g. water vs leaves)
            shouldRender = true;
          }

          if (shouldRender) {
            mask[uPos + vPos * uSize] = type;
          }
        }
      }

      // Generate quads from mask
      for (let vPos = 0; vPos < vSize; vPos++) {
        for (let uPos = 0; uPos < uSize; uPos++) {
          const type = mask[uPos + vPos * uSize];
          if (type !== 0) {
            // Find quad width
            let width = 1;
            while (
              uPos + width < uSize &&
              mask[uPos + width + vPos * uSize] === type
            ) {
              width++;
            }

            // Find quad height
            let height = 1;
            let canExpand = true;
            while (vPos + height < vSize) {
              for (let x = 0; x < width; x++) {
                if (mask[uPos + x + (vPos + height) * uSize] !== type) {
                  canExpand = false;
                  break;
                }
              }
              if (!canExpand) break;
              height++;
            }

            // Add quad to mesh
            const block = blockDefs.getById(type);
            if (!block) continue;
            const [r, g, b, a_val] = colorMap[block.name] || [1, 1, 1, 1];
            const isThisTransparent = Number(a_val) < 1.0;

            // Water blocks get their own mesh for independent texture control
            let target;
            if (block.name === "Water") {
              target = water;
            } else {
              target = isThisTransparent ? transparent : opaque;
            }

            // Compute quad corners
            const v0 = [0, 0, 0];
            const v1 = [0, 0, 0];
            const v2 = [0, 0, 0];
            const v3 = [0, 0, 0];

            v0[axis] = d + (dir > 0 ? 1 : 0);
            v0[u] = uPos;
            v0[v] = vPos;

            v1[axis] = v0[axis];
            v1[u] = uPos + width;
            v1[v] = vPos;

            v2[axis] = v0[axis];
            v2[u] = uPos + width;
            v2[v] = vPos + height;

            v3[axis] = v0[axis];
            v3[u] = uPos;
            v3[v] = vPos + height;

            // Geometry data
            const quadPositions = [
              v0[0] + baseX,
              v0[1],
              v0[2] + baseZ,
              v1[0] + baseX,
              v1[1],
              v1[2] + baseZ,
              v2[0] + baseX,
              v2[1],
              v2[2] + baseZ,
              v3[0] + baseX,
              v3[1],
              v3[2] + baseZ,
            ];

            const dx = axis === 0 ? dir : 0;
            const dy = axis === 1 ? dir : 0;
            const dz = axis === 2 ? dir : 0;

            const baseIndex = target.vertexCount;

            // Compute AO for the 4 quad corners
            const ao4 = [1.0, 1.0, 1.0, 1.0];
            if (block.solid) {
              // Sample AO at the first block's face position
              const faceCoords = [0, 0, 0];
              faceCoords[axis] = d + (dir > 0 ? 1 : 0);
              faceCoords[u] = uPos;
              faceCoords[v] = vPos;
              const fx = faceCoords[0];
              const fy = faceCoords[1];
              const fz = faceCoords[2];

              // Map the 4 vertices to face-data corner indices
              // FACE_CORNERS indices for canonical corners: 0=(0,0), 1=(1,0), 2=(1,1), 5=(0,1)
              const faceIndex = dir > 0 ? axis * 2 : axis * 2 + 1;
              const faceExtra = FACE_CORNERS[faceIndex];
              const cornersToFetch = [0, 1, 2, 5];
              for (let c = 0; c < 4; c++) {
                ao4[c] = getAO(
                  chunk,
                  chunkManager,
                  fx,
                  fy,
                  fz,
                  faceExtra.aoOffsets[cornersToFetch[c]],
                  blockDefs,
                  neighbors,
                );
              }
            }

            // Add vertices
            target.positions.push(...quadPositions);
            for (let j = 0; j < 4; j++) {
              target.normals.push(dx, dy, dz);
              target.colors.push(r, g, b, a_val);
              target.ao.push(ao4[j]);
              target.localUVs.push(j === 1 || j === 2 ? 1 : 0, j >= 2 ? 1 : 0);
              target.cornerAO.push(...ao4);

              // Light level: sample from the face position (outside the block being rendered)
              const lv = getNeighborLight(
                chunk,
                chunkManager,
                v0[0] + dx,
                v0[1] + dy,
                v0[2] + dz,
                neighbors,
              );
              target.lightLevels.push(lv);
            }

            // UVs - map each vertex to the same atlas tile (not tiled across width/height)
            const uBase = (type % 16) * tileSize;
            const vBase = Math.floor(type / 16) * tileSize;
            for (let j = 0; j < 4; j++) {
              const lu = j === 1 || j === 2 ? 1 : 0;
              const lv = j >= 2 ? 1 : 0;
              target.uvs.push(
                uBase +
                  uvPaddingOffset * tileSize +
                  lu * uvPaddingScale * tileSize,
                vBase +
                  uvPaddingOffset * tileSize +
                  lv * uvPaddingScale * tileSize,
              );
            }

            // Indices
            if (dir > 0) {
              target.indices.push(
                baseIndex,
                baseIndex + 1,
                baseIndex + 2,
                baseIndex,
                baseIndex + 2,
                baseIndex + 3,
              );
            } else {
              target.indices.push(
                baseIndex,
                baseIndex + 2,
                baseIndex + 1,
                baseIndex,
                baseIndex + 3,
                baseIndex + 2,
              );
            }

            target.vertexCount += 4;
            target.indexCount += 6;

            // Clear mask
            for (let vh = 0; vh < height; vh++) {
              for (let uw = 0; uw < width; uw++) {
                mask[uPos + uw + (vPos + vh) * uSize] = 0;
              }
            }
          }
        }
      }
    }
  }

  return {
    opaque: {
      positions: new Float32Array(opaque.positions),
      normals: new Float32Array(opaque.normals),
      colors: new Float32Array(opaque.colors),
      uvs: new Float32Array(opaque.uvs),
      ao: new Float32Array(opaque.ao),
      localUVs: new Float32Array(opaque.localUVs),
      cornerAO: new Float32Array(opaque.cornerAO),
      lightLevels: new Float32Array(opaque.lightLevels),
      indices: new Uint16Array(opaque.indices),
      vertexCount: opaque.vertexCount,
      indexCount: opaque.indexCount,
    },
    transparent: {
      positions: new Float32Array(transparent.positions),
      normals: new Float32Array(transparent.normals),
      colors: new Float32Array(transparent.colors),
      uvs: new Float32Array(transparent.uvs),
      ao: new Float32Array(transparent.ao),
      localUVs: new Float32Array(transparent.localUVs),
      cornerAO: new Float32Array(transparent.cornerAO),
      lightLevels: new Float32Array(transparent.lightLevels),
      indices: new Uint16Array(transparent.indices),
      vertexCount: transparent.vertexCount,
      indexCount: transparent.indexCount,
    },
    water: {
      positions: new Float32Array(water.positions),
      normals: new Float32Array(water.normals),
      colors: new Float32Array(water.colors),
      uvs: new Float32Array(water.uvs),
      ao: new Float32Array(water.ao),
      localUVs: new Float32Array(water.localUVs),
      cornerAO: new Float32Array(water.cornerAO),
      lightLevels: new Float32Array(water.lightLevels),
      indices: new Uint16Array(water.indices),
      vertexCount: water.vertexCount,
      indexCount: water.indexCount,
    },
    vertexCount:
      opaque.vertexCount + transparent.vertexCount + water.vertexCount,
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
 * @param {Blocks} blockDefs - Block definitions
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

  /**
   * @param {WebGLBuffer | null | undefined} target
   * @param {ArrayBufferLike | ArrayBufferView | null | undefined} data
   * @returns {WebGLBuffer | null}
   */
  const uploadBuffer = (target, data) => {
    if (!data) return null;
    let buffer = target;
    if (!buffer) {
      buffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  };

  /**
   * @param {WebGLBuffer | null | undefined} target
   * @param {ArrayBufferLike | ArrayBufferView | null | undefined} data
   * @returns {WebGLBuffer | null}
   */
  const uploadIndexBuffer = (target, data) => {
    if (!data || data.byteLength === 0) return null;
    let buffer = target;
    if (!buffer) {
      buffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  };

  // Upload opaque geometry
  if (mesh.opaque) {
    mesh.opaque.positionBuffer = uploadBuffer(
      mesh.opaque.positionBuffer,
      mesh.opaque.positions,
    );
    mesh.opaque.normalBuffer = uploadBuffer(
      mesh.opaque.normalBuffer,
      mesh.opaque.normals,
    );
    mesh.opaque.colorBuffer = uploadBuffer(
      mesh.opaque.colorBuffer,
      mesh.opaque.colors,
    );
    mesh.opaque.uvBuffer = uploadBuffer(mesh.opaque.uvBuffer, mesh.opaque.uvs);
    mesh.opaque.aoBuffer = uploadBuffer(mesh.opaque.aoBuffer, mesh.opaque.ao);
    mesh.opaque.lightBuffer = uploadBuffer(
      mesh.opaque.lightBuffer,
      mesh.opaque.lightLevels,
    );
    mesh.opaque.localUVBuffer = uploadBuffer(
      mesh.opaque.localUVBuffer,
      mesh.opaque.localUVs,
    );
    mesh.opaque.cornerAOBuffer = uploadBuffer(
      mesh.opaque.cornerAOBuffer,
      mesh.opaque.cornerAO,
    );
    mesh.opaque.indexBuffer = uploadIndexBuffer(
      mesh.opaque.indexBuffer,
      mesh.opaque.indices,
    );
  }

  // Upload transparent geometry
  if (mesh.transparent) {
    mesh.transparent.positionBuffer = uploadBuffer(
      mesh.transparent.positionBuffer,
      mesh.transparent.positions,
    );
    mesh.transparent.normalBuffer = uploadBuffer(
      mesh.transparent.normalBuffer,
      mesh.transparent.normals,
    );
    mesh.transparent.colorBuffer = uploadBuffer(
      mesh.transparent.colorBuffer,
      mesh.transparent.colors,
    );
    mesh.transparent.uvBuffer = uploadBuffer(
      mesh.transparent.uvBuffer,
      mesh.transparent.uvs,
    );
    mesh.transparent.aoBuffer = uploadBuffer(
      mesh.transparent.aoBuffer,
      mesh.transparent.ao,
    );
    mesh.transparent.lightBuffer = uploadBuffer(
      mesh.transparent.lightBuffer,
      mesh.transparent.lightLevels,
    );
    mesh.transparent.localUVBuffer = uploadBuffer(
      mesh.transparent.localUVBuffer,
      mesh.transparent.localUVs,
    );
    mesh.transparent.cornerAOBuffer = uploadBuffer(
      mesh.transparent.cornerAOBuffer,
      mesh.transparent.cornerAO,
    );
    mesh.transparent.indexBuffer = uploadIndexBuffer(
      mesh.transparent.indexBuffer,
      mesh.transparent.indices,
    );
  }

  // Upload water geometry
  if (mesh.water) {
    mesh.water.positionBuffer = uploadBuffer(
      mesh.water.positionBuffer,
      mesh.water.positions,
    );
    mesh.water.normalBuffer = uploadBuffer(
      mesh.water.normalBuffer,
      mesh.water.normals,
    );
    mesh.water.colorBuffer = uploadBuffer(
      mesh.water.colorBuffer,
      mesh.water.colors,
    );
    mesh.water.uvBuffer = uploadBuffer(mesh.water.uvBuffer, mesh.water.uvs);
    mesh.water.aoBuffer = uploadBuffer(mesh.water.aoBuffer, mesh.water.ao);
    mesh.water.lightBuffer = uploadBuffer(
      mesh.water.lightBuffer,
      mesh.water.lightLevels,
    );
    mesh.water.localUVBuffer = uploadBuffer(
      mesh.water.localUVBuffer,
      mesh.water.localUVs,
    );
    mesh.water.cornerAOBuffer = uploadBuffer(
      mesh.water.cornerAOBuffer,
      mesh.water.cornerAO,
    );
    mesh.water.indexBuffer = uploadIndexBuffer(
      mesh.water.indexBuffer,
      mesh.water.indices,
    );
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

  /** @param {import("./chunk.mjs").GeometryBuffers | undefined} buffers */
  const deleteBuffers = (buffers) => {
    if (!buffers) return;
    if (buffers.positionBuffer) gl.deleteBuffer(buffers.positionBuffer);
    if (buffers.normalBuffer) gl.deleteBuffer(buffers.normalBuffer);
    if (buffers.colorBuffer) gl.deleteBuffer(buffers.colorBuffer);
    if (buffers.uvBuffer) gl.deleteBuffer(buffers.uvBuffer);
    if (buffers.aoBuffer) gl.deleteBuffer(buffers.aoBuffer);
    if (buffers.localUVBuffer) gl.deleteBuffer(buffers.localUVBuffer);
    if (buffers.cornerAOBuffer) gl.deleteBuffer(buffers.cornerAOBuffer);
    if (buffers.lightBuffer) gl.deleteBuffer(buffers.lightBuffer);
    if (buffers.indexBuffer) gl.deleteBuffer(buffers.indexBuffer);
  };

  deleteBuffers(mesh.opaque);
  deleteBuffers(mesh.transparent);
  deleteBuffers(mesh.water);

  chunk.mesh = null;
}
