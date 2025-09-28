import { configSignals, stateSignals } from "./state.mjs";
import { renderPlayer } from "./renderPlayer.mjs";
import { renderMapFog } from "./mapFog.mjs";

// Render world
export function render(canvas, isFogEnabled) {
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const TILES = configSignals.TILES;
  const camera = stateSignals.camera.get();
  const world = stateSignals.world.get() || [];
  const viewMode = stateSignals.viewMode.get();

  const ctx = canvas?.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const tilesX = Math.ceil(canvas?.width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(canvas?.height / TILE_SIZE) + 1;

  const startX = Math.floor(camera.x / TILE_SIZE);
  const startY = Math.floor(camera.y / TILE_SIZE);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      if (
        worldX >= 0 &&
        worldX < WORLD_WIDTH &&
        worldY >= 0 &&
        worldY < WORLD_HEIGHT
      ) {
        const tile = world.getTile(worldX, worldY);

        // skip empty tiles
        if (!tile || tile === TILES.AIR) continue;

        let color = tile.color;

        if (viewMode === "xray") {
          if (tile === TILES.COAL) color = "#FFFF00";
          else if (tile === TILES.IRON) color = "#FF6600";
          else if (tile === TILES.GOLD) color = "#FFD700";
          else if (tile === TILES.LAVA) color = "#FF0000";
          else if (!tile.solid) color = tile.color;
          else color = "rgba(100,100,100,0.3)";
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x * TILE_SIZE - (camera.x % TILE_SIZE)),
          Math.round(y * TILE_SIZE - (camera.y % TILE_SIZE)),
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }

  renderPlayer(ctx);

  // Render map fog overlay if enabled
  if (isFogEnabled && ctx && canvas) {
    renderMapFog(ctx, canvas);
  }
}
