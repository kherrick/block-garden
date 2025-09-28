function generateWheatStructure(x, y, progress, TILES) {
  const blocks = [];

  // Early stage - just the growing seed
  if (progress < 0.1) {
    blocks.push({ x, y, tile: TILES.WHEAT_GROWING });
    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  for (let i = 0; i < currentHeight; i++) {
    const tileY = y - i;

    if (i < currentHeight - 1 || progress < 0.8) {
      // Stalk
      blocks.push({ x, y: tileY, tile: TILES.WHEAT_STALK });
    } else {
      // Top grains when mature
      blocks.push({ x, y: tileY, tile: TILES.WHEAT_GRAIN });
    }

    // Add side stalks for fuller appearance
    if (progress > 0.5 && i > 0 && i < currentHeight - 1) {
      if (Math.random() < 0.4) {
        blocks.push({ x: x - 1, y: tileY, tile: TILES.WHEAT_STALK });
      }
      if (Math.random() < 0.4) {
        blocks.push({ x: x + 1, y: tileY, tile: TILES.WHEAT_STALK });
      }
    }
  }

  // Add grain clusters when fully mature
  if (progress > 0.9) {
    const topY = y - currentHeight + 1;
    blocks.push({ x: x - 1, y: topY, tile: TILES.WHEAT_GRAIN });
    blocks.push({ x: x + 1, y: topY, tile: TILES.WHEAT_GRAIN });
  }

  return blocks;
}

function generateCarrotStructure(x, y, progress, TILES) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: TILES.CARROT_GROWING });
    return blocks;
  }

  // Underground root grows first
  if (progress > 0.2) {
    const rootDepth = Math.ceil(2 * progress);
    for (let i = 1; i <= rootDepth; i++) {
      blocks.push({ x, y: y + i, tile: TILES.CARROT_ROOT });
    }
  }

  // Leaves on top
  const leafHeight = Math.max(1, Math.ceil(2 * progress));
  for (let i = 0; i < leafHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.CARROT_LEAVES });

    // Spread leaves when more mature
    if (progress > 0.5 && i === leafHeight - 1) {
      blocks.push({ x: x - 1, y: y - i, tile: TILES.CARROT_LEAVES });
      blocks.push({ x: x + 1, y: y - i, tile: TILES.CARROT_LEAVES });
    }
  }

  return blocks;
}

function generateMushroomStructure(x, y, progress, TILES) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: TILES.MUSHROOM_GROWING });
    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.MUSHROOM_STEM });
  }

  // Cap grows as progress advances
  if (progress > 0.4) {
    const capY = y - currentHeight;
    blocks.push({ x, y: capY, tile: TILES.MUSHROOM_CAP });

    // Expand cap
    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: capY, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY, tile: TILES.MUSHROOM_CAP });
    }

    if (progress > 0.8) {
      blocks.push({ x: x - 1, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x, y: capY - 1, tile: TILES.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY - 1, tile: TILES.MUSHROOM_CAP });
    }
  }

  return blocks;
}

function generateCactusStructure(x, y, progress, TILES) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: TILES.CACTUS_GROWING });
    return blocks;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Main body (vertical column)
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: TILES.CACTUS_BODY });
  }

  // Add left arm when sufficiently grown
  if (progress > 0.4 && currentHeight > 2) {
    const leftArmY = y - Math.floor(currentHeight * 0.6);
    blocks.push({ x: x - 1, y: leftArmY, tile: TILES.CACTUS_BODY });

    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: leftArmY - 1, tile: TILES.CACTUS_BODY });
    }
  }

  // Add right arm
  if (progress > 0.5 && currentHeight > 3) {
    const rightArmY = y - Math.floor(currentHeight * 0.7);
    blocks.push({ x: x + 1, y: rightArmY, tile: TILES.CACTUS_BODY });

    if (progress > 0.7) {
      blocks.push({ x: x + 1, y: rightArmY - 1, tile: TILES.CACTUS_BODY });
    }
  }

  // Flowers on top if fully mature
  if (progress > 0.95) {
    const topY = y - currentHeight;
    blocks.push({ x, y: topY, tile: TILES.CACTUS_FLOWER });
  }

  return blocks;
}

function generatePlantStructure(x, y, seedType, progress, TILES) {
  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));

  // Different growth patterns for each plant type
  switch (seedType) {
    case "WHEAT":
      return generateWheatStructure(x, y, progress, TILES);
    case "CARROT":
      return generateCarrotStructure(x, y, progress, TILES);
    case "MUSHROOM":
      return generateMushroomStructure(x, y, progress, TILES);
    case "CACTUS":
      return generateCactusStructure(x, y, progress, TILES);
    default:
      return [{ x, y, tile: TILES.WHEAT_GROWING }]; // Fallback
  }
}

export function updateCrops(currentState, game) {
  const { TILES, WORLD_WIDTH, WORLD_HEIGHT } = currentState;

  const currentTimers = game?.state.growthTimers.get();
  const currentWorld = game?.state.world.get();
  const currentStructures = game?.state.plantStructures.get();

  let timersChanged = false;
  let worldChanged = false;
  let structuresChanged = false;

  const updatedTimers = { ...currentTimers };
  const updatedStructures = { ...currentStructures };

  // Update crop growth
  for (const [key, timer] of Object.entries(updatedTimers)) {
    timer.timeLeft -= 1 / 60; // Decrement by frame time

    // Update plant structure growth if structure exists
    if (updatedStructures[key]) {
      const structure = updatedStructures[key];
      const growthProgress = Math.max(
        0,
        Math.min(1, 1 - timer.timeLeft / TILES[timer.seedType].growthTime),
      );

      // Clear old plant blocks from the world
      if (structure.blocks) {
        structure.blocks.forEach((block) => {
          if (
            block.x >= 0 &&
            block.x < WORLD_WIDTH &&
            block.y >= 0 &&
            block.y < WORLD_HEIGHT &&
            currentWorld.getTile(block.x, block.y) !== TILES.AIR
          ) {
            currentWorld.setTile(block.x, block.y, TILES.AIR);
          }
        });
      }

      // Generate new plant structure based on type and growth
      const [x, y] = key.split(",").map(Number);
      structure.blocks = generatePlantStructure(
        x,
        y,
        timer.seedType,
        growthProgress,
        TILES,
        WORLD_WIDTH,
        WORLD_HEIGHT,
      );

      // Place the new plant blocks in the world
      structure.blocks.forEach((block) => {
        if (
          block.x >= 0 &&
          block.x < WORLD_WIDTH &&
          block.y >= 0 &&
          block.y < WORLD_HEIGHT
        ) {
          currentWorld.setTile(block.x, block.y, block.tile);
        }
      });

      worldChanged = true;
      structuresChanged = true;
    }

    // Complete growth if timer has expired
    if (timer.timeLeft <= 0) {
      if (updatedStructures[key]) {
        updatedStructures[key].mature = true;
        updatedStructures[key].seedType = timer.seedType;
      }

      delete updatedTimers[key];
      timersChanged = true;
    }
  }

  // Update state if anything changed
  if (timersChanged) {
    game.state.growthTimers.set(updatedTimers);
  }

  if (structuresChanged) {
    game.state.plantStructures.set(updatedStructures);
  }

  if (worldChanged) {
    game.state.world.set(currentWorld);
  }
}
