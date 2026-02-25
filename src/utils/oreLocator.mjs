/** @typedef {import('../core/world/chunkManager.mjs').ChunkManager} ChunkManager */

import { getBlockById } from "../core/world/config/blocks.mjs";

/**
 * Scan loaded chunks for ore blocks within a radius of the player.
 *
 * @param {ChunkManager} world - ChunkManager instance
 * @param {number} playerX - Player world X
 * @param {number} playerY - Player world Y
 * @param {number} playerZ - Player world Z
 * @param {number} radius - Search radius in blocks
 *
 * @returns {Map<string, number>} Ore name → count
 */
export function scanForOres(world, playerX, playerY, playerZ, radius) {
  const px = Math.floor(playerX);
  const py = Math.floor(playerY);
  const pz = Math.floor(playerZ);

  const minX = px - radius;
  const maxX = px + radius;
  const minY = Math.max(0, py - radius);
  const maxY = Math.min(127, py + radius);
  const minZ = pz - radius;
  const maxZ = pz + radius;

  /** @type {Map<string, number>} */
  const oreCounts = new Map();

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = minY; y <= maxY; y++) {
        const blockId = world.getBlock(x, y, z);

        if (blockId === 0) {
          continue;
        }

        const blockDef = getBlockById(blockId);

        if (blockDef && blockDef.ore) {
          const count = oreCounts.get(blockDef.name) || 0;
          oreCounts.set(blockDef.name, count + 1);
        }
      }
    }
  }

  return oreCounts;
}

/**
 * Format ore scan results into a toast-friendly string.
 *
 * @param {Map<string, number>} oreCounts - Ore name → count
 * @param {number} radius - Search radius used
 *
 * @returns {string} Formatted message
 */
export function formatOreScanResult(oreCounts, radius) {
  if (oreCounts.size === 0) {
    return `🧭 No ores found within ${radius} blocks.`;
  }

  const entries = [...oreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}: ${count}`)
    .join(" | ");

  return `🧭 Ore Scan (${radius} block radius):\n${entries}`;
}
