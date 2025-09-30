import { gameConfig, gameState } from "./state.mjs";

// Check if a position is solid
export function isSolid(x, y) {
  const tileSize = gameConfig.TILE_SIZE.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const world = gameState.world.get();

  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);

  if (tileX < 0 || tileX >= worldWidth || tileY < 0 || tileY >= worldHeight) {
    return true;
  }

  const tile = world.getTile(tileX, tileY);

  return tile && tile.solid;
}
