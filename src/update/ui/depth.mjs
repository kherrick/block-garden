/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/**
 * @param {HTMLDivElement} depthEl
 * @param {Signal.State} player
 * @param {number} surfaceLevel
 * @param {number} tileSize
 *
 * @returns {void}
 */
export function updateDepthUI(depthEl, player, surfaceLevel, tileSize) {
  const playerTileY = Math.floor(player.get().y / tileSize);

  let depth = "Surface";

  if (playerTileY > surfaceLevel) {
    const depthLevel = playerTileY - surfaceLevel;

    if (depthLevel < 15) {
      depth = "Shallow";
    } else if (depthLevel < 30) {
      depth = "Deep";
    } else {
      depth = "Very Deep";
    }
  } else if (playerTileY < surfaceLevel - 5) {
    depth = "Sky";
  }

  depthEl.textContent = depth;
}
