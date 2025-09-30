import { gameState } from "./state.mjs";

// Render player
export function renderPlayer(ctx) {
  const player = gameState.player.get();
  const camera = gameState.camera.get();

  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;

  if (ctx) {
    ctx.fillStyle = player.color;
    ctx.fillRect(screenX, screenY, player.width, player.height);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, screenY, player.width, player.height);

    // Eyes
    ctx.fillStyle = "#000000";
    ctx.fillRect(screenX + 1, screenY + 1, 1, 1);
    ctx.fillRect(screenX + 4, screenY + 1, 1, 1);
  }
}
