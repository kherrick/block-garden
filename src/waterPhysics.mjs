import { isSolid } from "./isSolid.mjs";
import { waterNoise, initializeNoise } from "./noise.mjs";

// Water physics constants
const WATER_FLOW_RATE = 0.3; // How fast water flows between tiles
const WATER_SETTLE_THRESHOLD = 0.1; // Minimum water level difference to trigger flow
const MAX_WATER_ITERATIONS = 50; // Prevent infinite loops
const WATER_SOURCE_CHANCE = 0.02; // Chance for a tile to be a water source

export function simulateWaterPhysics(
  world,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILES,
  iterations = 20,
) {
  let waterLevels = initializeWaterLevels(
    world,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    TILES,
  );

  // Run water simulation iterations
  for (let iter = 0; iter < iterations; iter++) {
    const newWaterLevels = [...waterLevels.map((col) => [...col])];
    let hasChanged = false;

    // Process each column from bottom to top
    for (let x = 0; x < WORLD_WIDTH; x++) {
      for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        if (waterLevels[x][y] > 0) {
          hasChanged =
            flowWater(
              x,
              y,
              waterLevels,
              newWaterLevels,
              world,
              WORLD_WIDTH,
              WORLD_HEIGHT,
              TILES,
            ) || hasChanged;
        }
      }
    }

    waterLevels = newWaterLevels;

    // Stop early if water has settled
    if (!hasChanged) break;
  }

  // Apply final water levels to world
  applyWaterToWorld(world, waterLevels, WORLD_WIDTH, WORLD_HEIGHT, TILES);

  return world;
}

function initializeWaterLevels(world, WORLD_WIDTH, WORLD_HEIGHT, TILES) {
  const waterLevels = [];

  for (let x = 0; x < WORLD_WIDTH; x++) {
    waterLevels[x] = [];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      // Initialize water levels based on existing water tiles
      if (world.getTile(x, y) === TILES.WATER) {
        waterLevels[x][y] = 1.0; // Full water level
      } else if (!isSolid(x, y)) {
        waterLevels[x][y] = 0; // Air can hold water
      } else {
        waterLevels[x][y] = -1; // Solid blocks can't hold water
      }
    }
  }

  return waterLevels;
}

function flowWater(
  x,
  y,
  waterLevels,
  newWaterLevels,
  world,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILES,
) {
  let hasFlowed = false;
  const currentWater = waterLevels[x][y];

  if (currentWater <= 0) return false;

  // First, try to flow downward (gravity)
  if (y + 1 < WORLD_HEIGHT && waterLevels[x][y + 1] >= 0) {
    const below = waterLevels[x][y + 1];
    if (below < 1.0) {
      // Space below to flow into
      const flowAmount = Math.min(currentWater * WATER_FLOW_RATE, 1.0 - below);
      if (flowAmount > WATER_SETTLE_THRESHOLD) {
        newWaterLevels[x][y] -= flowAmount;
        newWaterLevels[x][y + 1] += flowAmount;
        hasFlowed = true;
      }
    }
  }

  // Then try to flow horizontally to lower areas
  const directions = [
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
  ];

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
      const neighborWater = waterLevels[nx][ny];

      // Can only flow to non-solid tiles
      if (neighborWater >= 0) {
        const waterDiff = newWaterLevels[x][y] - neighborWater;
        if (waterDiff > WATER_SETTLE_THRESHOLD) {
          const flowAmount = Math.min(
            waterDiff * WATER_FLOW_RATE * 0.5,
            newWaterLevels[x][y] * 0.25,
          );
          if (flowAmount > 0.01) {
            newWaterLevels[x][y] -= flowAmount;
            newWaterLevels[nx][ny] += flowAmount;
            hasFlowed = true;
          }
        }
      }
    }
  }

  // Ensure water levels stay within bounds
  newWaterLevels[x][y] = Math.max(0, Math.min(1.0, newWaterLevels[x][y]));

  return hasFlowed;
}

function applyWaterToWorld(
  world,
  waterLevels,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILES,
) {
  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (waterLevels[x][y] > 0.3) {
        // Threshold for visible water
        // Only place water in air tiles
        if (
          world.getTile(x, y) === TILES.AIR ||
          world.getTile(x, y) === TILES.WATER
        ) {
          world.setTile(x, y, TILES.WATER);
        }
      } else if (
        world.getTile(x, y) === TILES.WATER &&
        waterLevels[x][y] <= 0.1
      ) {
        // Remove water that has drained away
        world.setTile(x, y, TILES.AIR);
      }
    }
  }
}

export function generateWaterSources(
  world,
  heights,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  SURFACE_LEVEL,
  TILES,
  seed,
) {
  initializeNoise(seed);

  for (let x = 0; x < WORLD_WIDTH; x++) {
    const surfaceHeight = heights[x];
    const waterNoiseValue = waterNoise(x, parseInt(seed) + 2000);

    // Generate water sources based on terrain
    if (waterNoiseValue > 0.4) {
      // High water noise indicates good spot for water
      // Create lakes in low-lying areas
      if (surfaceHeight < SURFACE_LEVEL - 3) {
        const lakeSize = Math.floor((waterNoiseValue - 0.4) * 15) + 3;
        createLake(
          world,
          x,
          surfaceHeight,
          lakeSize,
          WORLD_WIDTH,
          WORLD_HEIGHT,
          TILES,
        );
      }
      // Create springs in higher elevations
      else if (waterNoiseValue > 0.7 && surfaceHeight > SURFACE_LEVEL + 5) {
        createSpring(world, x, surfaceHeight, WORLD_WIDTH, WORLD_HEIGHT, TILES);
      }
    }

    // Generate rivers in valleys
    const riverNoise = waterNoise(x, parseInt(seed) + 2500);
    if (riverNoise > 0.6) {
      const leftHeight = x > 0 ? heights[x - 1] : surfaceHeight;
      const rightHeight = x < WORLD_WIDTH - 1 ? heights[x + 1] : surfaceHeight;

      // If this is a valley (lower than neighbors), create a river
      if (surfaceHeight < leftHeight - 2 && surfaceHeight < rightHeight - 2) {
        createRiver(world, x, surfaceHeight, WORLD_WIDTH, WORLD_HEIGHT, TILES);
      }
    }
  }
}

function createLake(
  world,
  centerX,
  surfaceY,
  size,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILES,
) {
  const radius = Math.floor(size / 2);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = 0; dy <= Math.floor(size * 0.3); dy++) {
      const x = centerX + dx;
      const y = surfaceY + dy + 1;

      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const distance = Math.sqrt(dx * dx + dy * dy * 2); // Flatten vertically
        if (distance <= radius) {
          // Clear out space for lake
          if (world.getTile(x, y) !== TILES.BEDROCK) {
            world.setTile(x, y, TILES.WATER);
          }
        }
      }
    }
  }
}

function createSpring(world, x, surfaceY, WORLD_WIDTH, WORLD_HEIGHT, TILES) {
  // Create a small water source
  const y = surfaceY;
  if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
    if (world.getTile(x, y) === TILES.AIR || !isSolid(x, y)) {
      world.setTile(x, y, TILES.WATER);
    }
  }
}

function createRiver(world, x, surfaceY, WORLD_WIDTH, WORLD_HEIGHT, TILES) {
  // Create a shallow river
  const riverY = surfaceY + 1;
  if (x >= 0 && x < WORLD_WIDTH && riverY >= 0 && riverY < WORLD_HEIGHT) {
    if (world.getTile(x, riverY) !== TILES.BEDROCK) {
      world.setTile(x, riverY, TILES.WATER);
    }

    // Add a bit of depth
    const riverY2 = surfaceY + 2;
    if (riverY2 < WORLD_HEIGHT && Math.random() < 0.7) {
      if (world.getTile(x, riverY2) !== TILES.BEDROCK) {
        world.setTile(x, riverY2, TILES.WATER);
      }
    }
  }
}
