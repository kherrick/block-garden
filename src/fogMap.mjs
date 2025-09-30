import { gameConfig, gameState } from "./state.mjs";

export class FogMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
    this.cache = {
      canvas: null,
      lastPlayerTileX: null,
      lastPlayerTileY: null,
      lastCameraGridX: null,
      lastCameraGridY: null,
      needsUpdate: true,
    };
  }

  // Check if a tile is explored
  isExplored(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    const index = y * this.width + x;
    return this.data[index] === 1;
  }

  // Mark a single tile as explored
  setExplored(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    const index = y * this.width + x;
    const wasExplored = this.data[index] === 1;
    this.data[index] = 1;
    return !wasExplored; // Return true if this was a new exploration
  }

  // Mark multiple tiles as explored (returns true if any were newly explored)
  setExploredBatch(tiles) {
    let anyUpdated = false;
    for (const tile of tiles) {
      if (this.setExplored(tile.x, tile.y)) {
        anyUpdated = true;
      }
    }
    return anyUpdated;
  }

  // reset fog
  reset() {
    this.data.fill(0);
    this.cache.needsUpdate = true;
  }

  // Create FogMap from a plain object (for loading saved data)
  static fromObject(fogObj, width, height) {
    const fog = new FogMap(width, height);

    // Handle old object format: { "x,y": true, ... }
    if (fogObj && typeof fogObj === "object") {
      for (const key in fogObj) {
        if (fogObj[key]) {
          const [x, y] = key.split(",").map(Number);
          fog.setExplored(x, y);
        }
      }
    }

    return fog;
  }

  // Convert to plain object for saving (returns sparse object for compatibility)
  toObject() {
    const obj = {};
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isExplored(x, y)) {
          obj[`${x},${y}`] = true;
        }
      }
    }
    return obj;
  }

  // Update explored map based on player position
  updateFromPlayer(tileSize, fogRevealRadius = 15) {
    const player = gameState.player.get();

    // Calculate player's tile position
    const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
    const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

    let mapUpdated = false;

    // Reveal tiles in a circle around the player
    for (let dx = -fogRevealRadius; dx <= fogRevealRadius; dx++) {
      for (let dy = -fogRevealRadius; dy <= fogRevealRadius; dy++) {
        const tileX = playerTileX + dx;
        const tileY = playerTileY + dy;

        // Check if within circular radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= fogRevealRadius) {
          if (this.setExplored(tileX, tileY)) {
            mapUpdated = true;
          }
        }
      }
    }

    return mapUpdated;
  }

  // Render map fog overlay
  render(ctx, canvas, tileSize, camera) {
    if (!ctx || !canvas) return;

    const tilesX = Math.ceil(canvas.width / tileSize) + 1;
    const tilesY = Math.ceil(canvas.height / tileSize) + 1;
    const startX = Math.floor(camera.x / tileSize);
    const startY = Math.floor(camera.y / tileSize);
    const cameraOffsetX = camera.x % tileSize;
    const cameraOffsetY = camera.y % tileSize;

    ctx.fillStyle = "#000000";

    // Process tiles in the same order as the original
    for (let x = 0; x < tilesX; x++) {
      const worldX = startX + x;
      if (worldX < 0 || worldX >= this.width) continue;

      const screenX = Math.round(x * tileSize - cameraOffsetX);

      for (let y = 0; y < tilesY; y++) {
        const worldY = startY + y;
        if (worldY < 0 || worldY >= this.height) continue;

        // Check if tile is unexplored
        if (!this.isExplored(worldX, worldY)) {
          const screenY = Math.round(y * tileSize - cameraOffsetY);
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }
      }
    }
  }

  // Scaled fog for performance
  renderScaled(ctx, canvas, tileSize, camera, fogScale = 2) {
    if (!ctx || !canvas) return;

    // Render fog at scaled size for better performance
    const blockSize = tileSize * fogScale;

    // Calculate how many fog blocks we need to cover the screen
    const blocksX = Math.ceil(canvas.width / blockSize) + 1;
    const blocksY = Math.ceil(canvas.height / blockSize) + 1;

    // Find the starting world coordinate in terms of fog blocks
    const startBlockX = Math.floor(camera.x / blockSize);
    const startBlockY = Math.floor(camera.y / blockSize);

    // Camera offset for fog blocks
    const cameraOffsetX = camera.x % blockSize;
    const cameraOffsetY = camera.y % blockSize;

    ctx.fillStyle = "#000000";

    // Process each fog block
    for (let blockX = 0; blockX < blocksX; blockX++) {
      const worldBlockX = startBlockX + blockX;
      const screenX = Math.round(blockX * blockSize - cameraOffsetX);

      for (let blockY = 0; blockY < blocksY; blockY++) {
        const worldBlockY = startBlockY + blockY;
        const screenY = Math.round(blockY * blockSize - cameraOffsetY);

        // Check if this entire block should be fogged
        // A block is fogged if ALL tiles in it are unexplored
        let shouldFog = true;

        // Check each tile in this fog block
        for (let dx = 0; dx < fogScale && shouldFog; dx++) {
          for (let dy = 0; dy < fogScale && shouldFog; dy++) {
            const tileX = worldBlockX * fogScale + dx;
            const tileY = worldBlockY * fogScale + dy;

            // If tile is within world bounds and is explored, don't fog this block
            if (
              tileX >= 0 &&
              tileX < this.width &&
              tileY >= 0 &&
              tileY < this.height &&
              this.isExplored(tileX, tileY)
            ) {
              shouldFog = false;
            }
          }
        }

        // Draw fog block if needed
        if (shouldFog) {
          ctx.fillRect(screenX, screenY, blockSize, blockSize);
        }
      }
    }
  }
}

// Initialize fog
export function initializeFog(fog = null) {
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();

  gameConfig.isFogScaled.set(false);

  let fogMap = new FogMap(worldWidth, worldHeight);

  // Convert existing explored map if it exists
  const existingMap = fog ?? gameState?.exploredMap;
  if (existingMap && Object.keys(existingMap).length > 0) {
    fogMap = FogMap.fromObject(existingMap, worldWidth, worldHeight);
  }

  // Store the optimized fog instance
  gameState.exploredMap = fogMap;
}
