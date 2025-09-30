import { gameConfig, gameState } from "./state.mjs";
import { renderPlayer } from "./renderPlayer.mjs";

// Render world
export function render(canvas) {
  const camera = gameState.camera.get();
  const tiles = gameConfig.TILES;
  const tileSize = gameConfig.TILE_SIZE.get();
  const viewMode = gameState.viewMode.get();
  const world = gameState.world.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();

  const ctx = canvas?.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const tilesX = Math.ceil(canvas?.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas?.height / tileSize) + 1;

  const startX = Math.floor(camera.x / tileSize);
  const startY = Math.floor(camera.y / tileSize);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      if (
        worldX >= 0 &&
        worldX < worldWidth &&
        worldY >= 0 &&
        worldY < worldHeight
      ) {
        const tile = world.getTile(worldX, worldY);

        // skip empty tiles
        if (!tile || tile === tiles.AIR) continue;

        let color = tile.color;

        if (viewMode === "xray") {
          if (tile === tiles.COAL) color = "#FFFF00";
          else if (tile === tiles.IRON) color = "#FF6600";
          else if (tile === tiles.GOLD) color = "#FFD700";
          else if (tile === tiles.LAVA) color = "#FF0000";
          else if (!tile.solid) color = tile.color;
          else color = "rgba(100,100,100,0.3)";
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x * tileSize - (camera.x % tileSize)),
          Math.round(y * tileSize - (camera.y % tileSize)),
          tileSize,
          tileSize,
        );
      }
    }
  }

  renderPlayer(ctx);
  // update fog map based on player position
  const isFogEnabled = gameConfig.fogMode.get() === "fog";
  const fog = gameState?.exploredMap;

  if (isFogEnabled) {
    fog.updateFromPlayer(tileSize);
  }

  // Render map fog overlay if enabled
  if (isFogEnabled && ctx && canvas) {
    if (gameConfig.isFogScaled.get()) {
      fog.renderScaled(
        ctx,
        canvas,
        tileSize,
        camera,
        gameConfig.fogScale.get(),
      );

      return;
    }

    const { velocityX, velocityY } = gameState.player.get();
    if (velocityX > 0 || velocityY > 0) {
      gameConfig.isFogScaled.set(true);
    }

    fog.render(ctx, canvas, tileSize, camera);
  }
}
