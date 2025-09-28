import { configSignals, stateSignals } from "./state.mjs";

// Check if a position is solid
export function isSolid(x, y) {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const world = stateSignals.world.get();

  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
    return true;
  }

  const tile = world.getTile(tileX, tileY);

  return tile && tile.solid;
}
