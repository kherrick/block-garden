import { gameConfig, gameState } from "./state.mjs";

export function createCaveRoom(centerX, centerY, radius) {
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const tiles = gameConfig.TILES;
  const world = gameState.world.get();

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius && world.getTile(x, y) !== tiles.BEDROCK) {
          world.setTile(x, y, tiles.AIR);
        }
      }
    }
  }
}

export function createCaveTunnel(startX, startY, angle, length, width) {
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const tiles = gameConfig.TILES;
  const world = gameState.world.get();

  let currentX = startX;
  let currentY = startY;

  for (let i = 0; i < length; i++) {
    angle += (Math.random() - 0.5) * 0.3;
    currentX += Math.cos(angle);
    currentY += Math.sin(angle);

    for (let dx = -width; dx <= width; dx++) {
      for (let dy = -width; dy <= width; dy++) {
        const x = Math.floor(currentX + dx);
        const y = Math.floor(currentY + dy);

        if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= width && world.getTile(x, y) !== tiles.BEDROCK) {
            world.setTile(x, y, tiles.AIR);
          }
        }
      }
    }

    if (Math.random() < 0.1) {
      createCaveRoom(
        Math.floor(currentX),
        Math.floor(currentY),
        2 + Math.floor(Math.random() * 2),
      );
    }
  }
}

// Cave generation functions
export function generateCaves() {
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const surfaceLevel = gameConfig.SURFACE_LEVEL.get();

  const caveSeeds = [];

  for (let i = 0; i < 25; i++) {
    caveSeeds.push({
      x: Math.floor(Math.random() * worldWidth),
      y:
        surfaceLevel +
        5 +
        Math.floor(Math.random() * (worldHeight - surfaceLevel - 15)),
      size: 3 + Math.floor(Math.random() * 8),
      branches: 1 + Math.floor(Math.random() * 3),
    });
  }

  caveSeeds.forEach((seed) => {
    createCaveRoom(seed.x, seed.y, seed.size);

    for (let b = 0; b < seed.branches; b++) {
      const angle =
        (Math.PI * 2 * b) / seed.branches + (Math.random() - 0.5) * 0.5;

      const length = 10 + Math.floor(Math.random() * 20);

      createCaveTunnel(
        seed.x,
        seed.y,
        angle,
        length,
        1 + Math.floor(Math.random() * 2),
      );
    }
  });

  for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * worldWidth);
    const y =
      surfaceLevel +
      3 +
      Math.floor(Math.random() * (worldHeight - surfaceLevel - 10));

    const size = 1 + Math.floor(Math.random() * 3);

    if (Math.random() < 0.3) {
      createCaveRoom(x, y, size);
    }
  }
}
