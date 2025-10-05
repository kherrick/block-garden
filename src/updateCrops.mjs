import { generateTreeStructure } from "./generateTreeStructure.mjs";

function generateWheatStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage - just the growing seed
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.WHEAT_GROWING });
    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  for (let i = 0; i < currentHeight; i++) {
    const tileY = y - i;

    if (i < currentHeight - 1 || progress < 0.8) {
      // Stalk
      blocks.push({ x, y: tileY, tile: tiles.WHEAT_STALK });
    } else {
      // Top grains when mature
      blocks.push({ x, y: tileY, tile: tiles.WHEAT_GRAIN });
    }

    // Add side stalks for fuller appearance
    if (progress > 0.5 && i > 0 && i < currentHeight - 1) {
      if (Math.random() < 0.4) {
        blocks.push({ x: x - 1, y: tileY, tile: tiles.WHEAT_STALK });
      }
      if (Math.random() < 0.4) {
        blocks.push({ x: x + 1, y: tileY, tile: tiles.WHEAT_STALK });
      }
    }
  }

  // Add grain clusters when fully mature
  if (progress > 0.9) {
    const topY = y - currentHeight + 1;
    blocks.push({ x: x - 1, y: topY, tile: tiles.WHEAT_GRAIN });
    blocks.push({ x: x + 1, y: topY, tile: tiles.WHEAT_GRAIN });
  }

  return blocks;
}

function generateCarrotStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CARROT_GROWING });
    return blocks;
  }

  // Underground root grows first
  if (progress > 0.2) {
    const rootDepth = Math.ceil(2 * progress);
    for (let i = 1; i <= rootDepth; i++) {
      blocks.push({ x, y: y + i, tile: tiles.CARROT_ROOT });
    }
  }

  // Leaves on top
  const leafHeight = Math.max(1, Math.ceil(2 * progress));
  for (let i = 0; i < leafHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CARROT_LEAVES });

    // Spread leaves when more mature
    if (progress > 0.5 && i === leafHeight - 1) {
      blocks.push({ x: x - 1, y: y - i, tile: tiles.CARROT_LEAVES });
      blocks.push({ x: x + 1, y: y - i, tile: tiles.CARROT_LEAVES });
    }
  }

  return blocks;
}

function generateMushroomStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.MUSHROOM_GROWING });
    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.MUSHROOM_STEM });
  }

  // Cap grows as progress advances
  if (progress > 0.4) {
    const capY = y - currentHeight;
    blocks.push({ x, y: capY, tile: tiles.MUSHROOM_CAP });

    // Expand cap
    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: capY, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY, tile: tiles.MUSHROOM_CAP });
    }

    if (progress > 0.8) {
      blocks.push({ x: x - 1, y: capY - 1, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x, y: capY - 1, tile: tiles.MUSHROOM_CAP });
      blocks.push({ x: x + 1, y: capY - 1, tile: tiles.MUSHROOM_CAP });
    }
  }

  return blocks;
}

function generateCactusStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CACTUS_GROWING });
    return blocks;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Main body (vertical column)
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CACTUS_BODY });
  }

  // Add left arm when sufficiently grown
  if (progress > 0.4 && currentHeight > 2) {
    const leftArmY = y - Math.floor(currentHeight * 0.6);
    blocks.push({ x: x - 1, y: leftArmY, tile: tiles.CACTUS_BODY });

    if (progress > 0.6) {
      blocks.push({ x: x - 1, y: leftArmY - 1, tile: tiles.CACTUS_BODY });
    }
  }

  // Add right arm
  if (progress > 0.5 && currentHeight > 3) {
    const rightArmY = y - Math.floor(currentHeight * 0.7);
    blocks.push({ x: x + 1, y: rightArmY, tile: tiles.CACTUS_BODY });

    if (progress > 0.7) {
      blocks.push({ x: x + 1, y: rightArmY - 1, tile: tiles.CACTUS_BODY });
    }
  }

  // Flowers on top if fully mature
  if (progress > 0.95) {
    const topY = y - currentHeight;
    blocks.push({ x, y: topY, tile: tiles.CACTUS_FLOWER });
  }

  return blocks;
}

function generateBerryBushStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.BERRY_BUSH_GROWING });
    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Central branches
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.BERRY_BUSH_BRANCH });
  }

  // Add leaves when growing
  if (progress > 0.3) {
    const topY = y - currentHeight;
    const leafRadius = Math.min(2, Math.ceil((progress - 0.3) * 3));

    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = 0; dy <= leafRadius; dy++) {
        const leafX = x + dx;
        const leafY = topY + dy;
        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance <= leafRadius && distance > 0) {
          blocks.push({ x: leafX, y: leafY, tile: tiles.BERRY_BUSH_LEAVES });
        }
      }
    }
  }

  // Add berries when mature
  if (progress > 0.8) {
    const topY = y - currentHeight;
    if (Math.random() < 0.6)
      blocks.push({ x: x - 1, y: topY + 1, tile: tiles.BERRY_BUSH_BERRIES });
    if (Math.random() < 0.6)
      blocks.push({ x: x + 1, y: topY + 1, tile: tiles.BERRY_BUSH_BERRIES });
    if (Math.random() < 0.6)
      blocks.push({ x: x - 1, y: topY, tile: tiles.BERRY_BUSH_BERRIES });
    if (Math.random() < 0.6)
      blocks.push({ x: x + 1, y: topY, tile: tiles.BERRY_BUSH_BERRIES });
  }

  return blocks;
}

function generateBambooStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.BAMBOO_GROWING });
    return blocks;
  }

  const maxHeight = 7;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Build bamboo stalk with joints
  for (let i = 0; i < currentHeight; i++) {
    // Every 2 blocks is a joint
    if (i % 2 === 0) {
      blocks.push({ x, y: y - i, tile: tiles.BAMBOO_JOINT });
    } else {
      blocks.push({ x, y: y - i, tile: tiles.BAMBOO_STALK });
    }
  }

  // Add leaves at top when more grown
  if (progress > 0.5) {
    const topY = y - currentHeight;
    blocks.push({ x: x - 1, y: topY, tile: tiles.BAMBOO_LEAVES });
    blocks.push({ x: x + 1, y: topY, tile: tiles.BAMBOO_LEAVES });

    if (progress > 0.7) {
      blocks.push({ x: x - 1, y: topY + 1, tile: tiles.BAMBOO_LEAVES });
      blocks.push({ x: x + 1, y: topY + 1, tile: tiles.BAMBOO_LEAVES });
    }
  }

  return blocks;
}

function generateSunflowerStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.SUNFLOWER_GROWING });
    return blocks;
  }

  const maxHeight = 5;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.SUNFLOWER_STEM });
  }

  // Add leaves along stem
  if (progress > 0.3) {
    const leafSpacing = 2;
    for (let i = leafSpacing; i < currentHeight; i += leafSpacing) {
      if (i % 2 === 0) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.SUNFLOWER_LEAVES });
      } else {
        blocks.push({ x: x + 1, y: y - i, tile: tiles.SUNFLOWER_LEAVES });
      }
    }
  }

  // Flower head at top when mature
  if (progress > 0.7) {
    const topY = y - currentHeight;
    blocks.push({ x, y: topY, tile: tiles.SUNFLOWER_CENTER });

    if (progress > 0.85) {
      // Add petals around center
      blocks.push({ x: x - 1, y: topY, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x: x + 1, y: topY, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x, y: topY - 1, tile: tiles.SUNFLOWER_PETALS });
      blocks.push({ x, y: topY + 1, tile: tiles.SUNFLOWER_PETALS });
    }
  }

  return blocks;
}

function generateCornStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.CORN_GROWING });
    return blocks;
  }

  const maxHeight = 4;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Stalk
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.CORN_STALK });
  }

  // Add leaves as it grows
  if (progress > 0.4) {
    for (let i = 1; i < currentHeight; i++) {
      if (i % 2 === 1) {
        blocks.push({ x: x - 1, y: y - i, tile: tiles.CORN_LEAVES });
      } else {
        blocks.push({ x: x + 1, y: y - i, tile: tiles.CORN_LEAVES });
      }
    }
  }

  // Corn ear appears when mature
  if (progress > 0.7) {
    const earY = y - Math.floor(currentHeight * 0.6);
    blocks.push({ x: x + 1, y: earY, tile: tiles.CORN_EAR });

    if (progress > 0.85) {
      blocks.push({ x: x + 1, y: earY - 1, tile: tiles.CORN_SILK });
    }
  }

  return blocks;
}

function generatePineTreeStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.PINE_TREE_GROWING });
    return blocks;
  }

  const maxHeight = 8;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Trunk grows first
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.PINE_TRUNK });
  }

  // Needles in conical shape when tree is growing
  if (progress > 0.25) {
    const needleStartY = y - Math.floor(currentHeight * 0.3);
    const needleLayers = Math.ceil(currentHeight * 0.7);

    for (let layer = 0; layer < needleLayers; layer++) {
      const layerY = needleStartY - layer;
      const layerWidth = Math.max(1, Math.floor((needleLayers - layer) / 2));

      for (let dx = -layerWidth; dx <= layerWidth; dx++) {
        if (dx !== 0 || layer !== 0) {
          blocks.push({ x: x + dx, y: layerY, tile: tiles.PINE_NEEDLES });
        }
      }
    }
  }

  // Pine cones when mature
  if (progress > 0.9) {
    const midY = y - Math.floor(currentHeight * 0.5);
    if (Math.random() < 0.5)
      blocks.push({ x: x - 1, y: midY, tile: tiles.PINE_CONE });
    if (Math.random() < 0.5)
      blocks.push({ x: x + 1, y: midY, tile: tiles.PINE_CONE });
  }

  return blocks;
}

function generateWillowTreeStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.WILLOW_TREE_GROWING });
    return blocks;
  }

  const maxHeight = 6;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Trunk
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.WILLOW_TRUNK });
  }

  // Drooping branches when growing
  if (progress > 0.3) {
    const topY = y - currentHeight;
    const branchLength = Math.ceil(progress * 4);

    // Left drooping branches
    for (let i = 0; i < branchLength; i++) {
      blocks.push({
        x: x - 1 - Math.floor(i / 2),
        y: topY + i,
        tile: tiles.WILLOW_BRANCHES,
      });
      if (progress > 0.6 && i > 0) {
        blocks.push({
          x: x - 1 - Math.floor(i / 2),
          y: topY + i,
          tile: tiles.WILLOW_LEAVES,
        });
      }
    }

    // Right drooping branches
    for (let i = 0; i < branchLength; i++) {
      blocks.push({
        x: x + 1 + Math.floor(i / 2),
        y: topY + i,
        tile: tiles.WILLOW_BRANCHES,
      });
      if (progress > 0.6 && i > 0) {
        blocks.push({
          x: x + 1 + Math.floor(i / 2),
          y: topY + i,
          tile: tiles.WILLOW_LEAVES,
        });
      }
    }
  }

  // Additional leaves when mature
  if (progress > 0.8) {
    const topY = y - currentHeight;
    blocks.push({ x: x - 2, y: topY + 2, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x + 2, y: topY + 2, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x - 3, y: topY + 3, tile: tiles.WILLOW_LEAVES });
    blocks.push({ x: x + 3, y: topY + 3, tile: tiles.WILLOW_LEAVES });
  }

  return blocks;
}

function generateFernStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.FERN_GROWING });
    return blocks;
  }

  const maxHeight = 3;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Central stem
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.FERN_STEM });
  }

  // Unfurling fronds
  if (progress > 0.3) {
    const frondSpread = Math.ceil(progress * 2);

    for (let i = 0; i < currentHeight; i++) {
      const spreadAtHeight = Math.min(frondSpread, i + 1);

      for (let dx = -spreadAtHeight; dx <= spreadAtHeight; dx++) {
        if (dx !== 0) {
          blocks.push({ x: x + dx, y: y - i, tile: tiles.FERN_FROND });
        }
      }
    }
  }

  return blocks;
}

function generatePlantStructure(x, y, seedType, progress, tiles) {
  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));

  // Different growth patterns for each plant type
  switch (seedType) {
    case "WHEAT":
      return generateWheatStructure(x, y, progress, tiles);
    case "CARROT":
      return generateCarrotStructure(x, y, progress, tiles);
    case "MUSHROOM":
      return generateMushroomStructure(x, y, progress, tiles);
    case "CACTUS":
      return generateCactusStructure(x, y, progress, tiles);
    case "WALNUT":
      return generateTreeStructure(x, y, progress, tiles);
    case "BERRY_BUSH":
      return generateBerryBushStructure(x, y, progress, tiles);
    case "BAMBOO":
      return generateBambooStructure(x, y, progress, tiles);
    case "SUNFLOWER":
      return generateSunflowerStructure(x, y, progress, tiles);
    case "CORN":
      return generateCornStructure(x, y, progress, tiles);
    case "PINE_TREE":
      return generatePineTreeStructure(x, y, progress, tiles);
    case "WILLOW_TREE":
      return generateWillowTreeStructure(x, y, progress, tiles);
    case "FERN":
      return generateFernStructure(x, y, progress, tiles);
    default:
      return [{ x, y, tile: tiles.WHEAT_GROWING }];
  }
}

export function updateCrops(
  growthTimers,
  plantStructures,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
  let timersChanged = false;
  let worldChanged = false;
  let structuresChanged = false;

  const currentWorld = world.get();

  const updatedTimers = { ...growthTimers.get() };
  const updatedStructures = { ...plantStructures.get() };

  // Update crop growth
  for (const [key, timer] of Object.entries(updatedTimers)) {
    timer.timeLeft -= 1 / 60; // Decrement by frame time

    // Update plant structure growth if structure exists
    if (updatedStructures[key]) {
      const structure = updatedStructures[key];
      const growthProgress = Math.max(
        0,
        Math.min(1, 1 - timer.timeLeft / tiles[timer.seedType].growthTime),
      );

      // Clear old plant blocks from the world
      if (structure.blocks) {
        structure.blocks.forEach((block) => {
          if (
            block.x >= 0 &&
            block.x < worldWidth &&
            block.y >= 0 &&
            block.y < worldHeight &&
            currentWorld.getTile(block.x, block.y) !== tiles.AIR
          ) {
            currentWorld.setTile(block.x, block.y, tiles.AIR);
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
        tiles,
        worldWidth,
        worldHeight,
      );

      // Place the new plant blocks in the world
      structure.blocks.forEach((block) => {
        if (
          block.x >= 0 &&
          block.x < worldWidth &&
          block.y >= 0 &&
          block.y < worldHeight
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
    growthTimers.set(updatedTimers);
  }

  if (structuresChanged) {
    plantStructures.set(updatedStructures);
  }

  // if (worldChanged) {
  //   currentWorld.set(world);
  // }
}
