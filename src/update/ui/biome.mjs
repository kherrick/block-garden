import { getBiome } from "../../misc/getBiome.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../../state/config/index.mjs').BiomeMap} BiomeMap */

/**
 * @param {HTMLDivElement} biomeEl
 * @param {Signal.State} player
 * @param {BiomeMap} biomes
 * @param {number} tileSize
 * @param {number} worldWidth
 * @param {Signal.State} worldSeed
 *
 * @returns {void}
 */
export function updateBiomeUI(
  biomeEl,
  player,
  biomes,
  tileSize,
  worldWidth,
  worldSeed,
) {
  const playerTileX = Math.floor(player.get().x / tileSize);

  if (playerTileX >= 0 && playerTileX < worldWidth) {
    const biome = getBiome(playerTileX, biomes, worldSeed.get());

    biomeEl.textContent = biome.name;
  }
}
