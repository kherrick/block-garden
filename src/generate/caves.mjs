/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {TileMap} tiles
 * @param {WorldMap} world
 * @param {number} worldHeight
 * @param {number} worldWidth
 *
 * @returns {void}
 */
export function createCaveRoom(
  centerX,
  centerY,
  radius,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
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

/**
 * @param {number} angle
 * @param {number} length
 * @param {number} startX
 * @param {number} startY
 * @param {TileMap} tiles
 * @param {number} width
 * @param {WorldMap} world
 * @param {number} worldHeight
 * @param {number} worldWidth
 *
 * @returns {void}
 */
export function createCaveTunnel(
  angle,
  length,
  startX,
  startY,
  tiles,
  width,
  world,
  worldHeight,
  worldWidth,
) {
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
        tiles,
        world,
        worldHeight,
        worldWidth,
      );
    }
  }
}

/**
 * Cave generation functions
 *
 * @param {number} surfaceLevel
 * @param {TileMap} tiles
 * @param {WorldMap} world
 * @param {number} worldHeight
 * @param {number} worldWidth
 *
 * @returns {void}
 */
export function generateCaves(
  surfaceLevel,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
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
    createCaveRoom(
      seed.x,
      seed.y,
      seed.size,
      tiles,
      world,
      worldHeight,
      worldWidth,
    );

    for (let b = 0; b < seed.branches; b++) {
      const angle =
        (Math.PI * 2 * b) / seed.branches + (Math.random() - 0.5) * 0.5;
      const length = 10 + Math.floor(Math.random() * 20);

      createCaveTunnel(
        angle,
        length,
        seed.x,
        seed.y,
        tiles,
        1 + Math.floor(Math.random() * 2),
        world,
        worldHeight,
        worldWidth,
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
      createCaveRoom(x, y, size, tiles, world, worldHeight, worldWidth);
    }
  }
}
