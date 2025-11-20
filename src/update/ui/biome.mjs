import { getBiome } from "../../misc/getBiome.mjs";

/**
 * @param {any} biomeEl
 * @param {any} player
 * @param {any} biomes
 * @param {any} tileSize
 * @param {any} worldWidth
 * @param {any} worldSeed
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
