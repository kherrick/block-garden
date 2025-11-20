import { updateState } from "../state/state.mjs";
import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";

/**
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} structure
 * @param {any} structureKey
 * @param {any} tiles
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 *
 * @returns {void}
 */
function harvestMaturePlant(
  growthTimers,
  plantStructures,
  structure,
  structureKey,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
  if (structure.blocks) {
    structure.blocks.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < worldWidth &&
        block.y >= 0 &&
        block.y < worldHeight
      ) {
        world.setTile(block.x, block.y, tiles.AIR);
      }
    });
  }

  // Give seeds (and / or wood) when harvesting mature plant
  if (structure.seedType) {
    // 1-3 seeds
    const seedsGained = 1 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    console.log(
      `Harvested mature ${structure.seedType}, gained ${seedsGained} seeds`,
    );

    // Check for a wood like structure
    const item = "WOOD";
    const drops = tiles[structure.seedType].drops;
    const shouldDrop = Array.isArray(drops)
      ? drops.some((item) => item.toLowerCase().includes(item.toLowerCase()))
      : drops.toLowerCase().includes(item.toLowerCase());

    // 0-3 wood
    const woodGained = shouldDrop ? 1 + Math.floor(Math.random() * 3) : 0;

    if (woodGained) {
      updateState("materialsInventory", (inv) => ({
        ...inv,
        [item]: inv[item] + woodGained,
      }));

      console.log(`Gained ${woodGained} ${item.toLowerCase()}`);
    }
  }

  // Remove the plant structure and any associated timers
  const currentStructures = plantStructures.get();
  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...growthTimers.get() };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  plantStructures.set(updatedStructures);
  growthTimers.set(updatedTimers);
}

/**
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} player
 * @param {any} seedInventory
 * @param {any} selectedSeedType
 * @param {any} tileName
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 *
 * @returns {void}
 */
export function handleFarmAction(
  growthTimers,
  plantStructures,
  player,
  seedInventory,
  selectedSeedType,
  tileName,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
) {
  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  // Check multiple positions for farming actions
  const farmingPositions = [];

  // If player is moving horizontally, check in front of player
  if (player.lastDirection !== 0) {
    const dx = player.lastDirection > 0 ? 1 : -1;

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY, // Same level as player
    });

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY + 1, // One below player level
    });
  }

  // Always check directly below the player
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY + 1,
  });

  // Also check the tile the player is standing on
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY,
  });

  // Try each position until we find something to farm
  for (const pos of farmingPositions) {
    const { x: targetX, y: targetY } = pos;

    if (
      targetX < 0 ||
      targetX >= worldWidth ||
      targetY < 0 ||
      targetY >= worldHeight
    ) {
      continue;
    }

    const currentTile = world.getTile(targetX, targetY);

    // Check if this position is part of a mature plant structure
    let harvestableStructure = null;
    let structureKey = null;

    const currentStructures = plantStructures.get();

    // Look for mature plant structures that contain this tile
    for (const [key, structure] of Object.entries(currentStructures)) {
      if (structure.mature && structure.blocks) {
        // Check if any block in the structure matches our target position
        const matchingBlock = structure.blocks.find(
          (block) => block.x === targetX && block.y === targetY,
        );

        if (matchingBlock) {
          harvestableStructure = structure;
          structureKey = key;

          break;
        }
      }
    }

    // If we found a mature plant structure, harvest it
    if (harvestableStructure && structureKey) {
      harvestMaturePlant(
        growthTimers,
        plantStructures,
        harvestableStructure,
        structureKey,
        tiles,
        world,
        worldHeight,
        worldWidth,
      );

      // Exit after successful harvest
      return;
    }
    // Check for simple crops (fallback for any remaining simple crop tiles)
    else if (currentTile && currentTile.crop) {
      harvestCrop(currentTile, tiles, world, targetX, targetY);

      // Exit after successful harvest
      return;
    }
    // Plant seeds if the tile is empty and we have seeds selected
    else if (
      currentTile === tiles.AIR &&
      selectedSeedType &&
      seedInventory[selectedSeedType] > 0
    ) {
      plantSeed(
        growthTimers,
        plantStructures,
        seedInventory,
        selectedSeedType,
        tiles,
        world,
        targetX,
        targetY,
      );

      // Exit after successful planting
      return;
    }
  }
}
