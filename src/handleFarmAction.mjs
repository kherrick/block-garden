import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";

function harvestMaturePlant(currentState, structure, structureKey, game, doc) {
  const { TILES, WORLD_WIDTH, WORLD_HEIGHT } = currentState;

  // Clear all blocks in the plant structure
  const currentWorld = game.state.world.get();

  if (structure.blocks) {
    structure.blocks.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < WORLD_WIDTH &&
        block.y >= 0 &&
        block.y < WORLD_HEIGHT
      ) {
        currentWorld.setTile(block.x, block.y, TILES.AIR);
      }
    });
  }

  // Give seeds when harvesting mature plant
  if (structure.seedType) {
    // 3-6 seeds
    const seedsGained = 3 + Math.floor(Math.random() * 4);

    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    console.log(
      `Harvested mature ${structure.seedType}, gained ${seedsGained} seeds`,
    );
  }

  // Update world state
  game.state.world.set(currentWorld);

  // Remove the plant structure and any associated timers
  const currentStructures = game.state.plantStructures.get();
  const currentTimers = game.state.growthTimers.get();

  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...currentTimers };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  game.state.plantStructures.set(updatedStructures);
  game.state.growthTimers.set(updatedTimers);

  // Update inventory display
  import("./updateInventoryDisplay.mjs").then(({ updateInventoryDisplay }) => {
    updateInventoryDisplay(doc, game.state);
  });
}

export function handleFarmAction(currentState, game, doc) {
  const { player, state, TILE_SIZE, TILES, WORLD_HEIGHT, WORLD_WIDTH, world } =
    currentState;

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

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
      targetX >= WORLD_WIDTH ||
      targetY < 0 ||
      targetY >= WORLD_HEIGHT
    ) {
      continue;
    }

    const currentTile = world.getTile(targetX, targetY);

    // Check if this position is part of a mature plant structure
    const plantStructures = game.state.plantStructures.get();
    let harvestableStructure = null;
    let structureKey = null;

    // Look for mature plant structures that contain this tile
    for (const [key, structure] of Object.entries(plantStructures)) {
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
        currentState,
        harvestableStructure,
        structureKey,
        game,
        doc,
      );

      // Exit after successful harvest
      return;
    }
    // Check for simple crops (fallback for any remaining simple crop tiles)
    else if (currentTile && currentTile.crop) {
      harvestCrop(currentState, targetX, targetY, currentTile, game, doc);

      // Exit after successful harvest
      return;
    }
    // Plant seeds if the tile is empty and we have seeds selected
    else if (
      currentTile === TILES.AIR &&
      state.selectedSeedType &&
      state.seedInventory[state.selectedSeedType] > 0
    ) {
      plantSeed(
        currentState,
        targetX,
        targetY,
        state.selectedSeedType,
        game,
        doc,
      );

      // Exit after successful planting
      return;
    }
  }
}
