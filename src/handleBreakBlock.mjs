import { mapEditorState } from "./mapEditor.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

// Helper function to check if a tile position is part of a mature plant structure
function isMaturePlantPart(x, y, plantStructures) {
  for (const [key, structure] of Object.entries(plantStructures)) {
    if (structure.mature && structure.blocks) {
      if (structure.blocks.find((b) => b.x === x && b.y === y)) {
        return true;
      }
    }
  }

  return false;
}

// Helper function to get material type from tile
function getMaterialFromTile(tile, TILES) {
  const tileToMaterial = {
    [TILES.DIRT.id]: "DIRT",
    [TILES.GRASS.id]: "DIRT", // Grass drops dirt
    [TILES.STONE.id]: "STONE",
    [TILES.TREE_TRUNK.id]: "WOOD",
    [TILES.TREE_LEAVES.id]: "WOOD", // Leaves can drop wood occasionally
    [TILES.SAND.id]: "SAND",
    [TILES.CLAY.id]: "CLAY",
    [TILES.COAL.id]: "COAL",
    [TILES.IRON.id]: "IRON",
    [TILES.GOLD.id]: "GOLD",
    [TILES.SNOW.id]: "SAND", // Snow melts to... sand for simplicity
  };

  return tileToMaterial[tile.id] || null;
}

export function handleBreakBlock(currentState, game, doc, mode = "regular") {
  if (mapEditorState.isEnabled) {
    console.log("Breaking disabled in map editor mode");

    return;
  }

  const { player, world, TILES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } =
    currentState;

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  let blocksToBreak = [];

  if (mode === "regular") {
    if (player.lastDirection !== 0) {
      // Horizontal travel → always break corridors 3 tiles tall:
      // the block directly in front of the player, and the 2 directly above.
      const dx = player.lastDirection > 0 ? 1 : -1;

      for (let dy = 0; dy < 3; dy++) {
        const targetX = playerTileX + dx; // one tile forward
        const targetY = playerTileY - dy; // player's tile (dy=0), +1 above, +2 above

        if (
          targetX < 0 ||
          targetX >= WORLD_WIDTH ||
          targetY < 0 ||
          targetY >= WORLD_HEIGHT
        )
          continue;

        const tile = world.getTile(targetX, targetY);
        if (
          tile &&
          tile !== TILES.AIR &&
          tile !== TILES.BEDROCK &&
          tile !== TILES.LAVA &&
          tile !== TILES.WATER && // Don't break water
          !isMaturePlantPart(targetX, targetY, game.state.plantStructures.get())
        ) {
          blocksToBreak.push({ x: targetX, y: targetY, tile, priority: dy });
        }
      }
    } else {
      // Idle → break directly under the player (1 tile downward)
      const targetX = playerTileX;
      const targetY = playerTileY + 1;

      if (
        targetX >= 0 &&
        targetX < WORLD_WIDTH &&
        targetY >= 0 &&
        targetY < WORLD_HEIGHT
      ) {
        const tile = world.getTile(targetX, targetY);
        if (
          tile &&
          tile !== TILES.AIR &&
          tile !== TILES.BEDROCK &&
          tile !== TILES.LAVA &&
          tile !== TILES.WATER &&
          !isMaturePlantPart(targetX, targetY, game.state.plantStructures.get())
        ) {
          blocksToBreak.push({ x: targetX, y: targetY, tile, priority: 1 });
        }
      }
    }
  } else {
    // Break in an area around the player - adjust pattern based on movement direction
    const breakRadius = 1;

    // If player is moving horizontally, break in a horizontal line
    if (player.lastDirection !== 0) {
      // Horizontal breaking pattern
      for (let dx = -breakRadius; dx <= breakRadius; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const targetX = playerTileX + dx * (player.lastDirection > 0 ? 1 : 1);
          const targetY = playerTileY + dy;

          if (
            targetX < 0 ||
            targetX >= WORLD_WIDTH ||
            targetY < 0 ||
            targetY >= WORLD_HEIGHT
          ) {
            continue;
          }

          const tile = world.getTile(targetX, targetY);

          // Can break most blocks except bedrock, air, lava, and water
          // Also exclude mature plant parts (they should be harvested, not broken)
          if (
            tile &&
            tile !== TILES.AIR &&
            tile !== TILES.BEDROCK &&
            tile !== TILES.LAVA &&
            tile !== TILES.WATER &&
            !isMaturePlantPart(
              targetX,
              targetY,
              game.state.plantStructures.get(),
            )
          ) {
            // Prioritize blocks in the direction player is facing
            const priority =
              Math.abs(dx) === 0 ? 1 : 2 - Math.abs(dx) / breakRadius;
            blocksToBreak.push({
              x: targetX,
              y: targetY,
              tile: tile,
              priority,
            });
          }
        }
      }
    } else {
      // Default circular breaking pattern when not moving
      for (let dx = -breakRadius; dx <= breakRadius; dx++) {
        for (let dy = -breakRadius; dy <= breakRadius; dy++) {
          const targetX = playerTileX + dx;
          const targetY = playerTileY + dy;

          if (
            targetX < 0 ||
            targetX >= WORLD_WIDTH ||
            targetY < 0 ||
            targetY >= WORLD_HEIGHT
          ) {
            continue;
          }

          const tile = world.getTile(targetX, targetY);

          // Can break most blocks except bedrock, air, lava, and water
          // Also exclude mature plant parts (they should be harvested, not broken)
          if (
            tile &&
            tile !== TILES.AIR &&
            tile !== TILES.BEDROCK &&
            tile !== TILES.LAVA &&
            tile !== TILES.WATER &&
            !isMaturePlantPart(
              targetX,
              targetY,
              game.state.plantStructures.get(),
            )
          ) {
            blocksToBreak.push({
              x: targetX,
              y: targetY,
              tile: tile,
              priority: 1,
            });
          }
        }
      }
    }
  }

  if (blocksToBreak.length > 0) {
    // Break multiple blocks at once
    const currentWorld = game.state.world.get();
    const currentTimers = game.state.growthTimers.get();
    const currentStructures = game.state.plantStructures.get();
    const updatedTimers = { ...currentTimers };
    const updatedStructures = { ...currentStructures };
    let seedUpdates = {};
    let materialUpdates = {};

    blocksToBreak.forEach((block) => {
      // Check if this is part of an immature plant structure (these can be broken)
      let isImmaturePlantPart = false;
      let plantKey = null;

      // Find if this block is part of any immature plant structure
      for (const [key, structure] of Object.entries(currentStructures)) {
        if (!structure.mature && structure.blocks) {
          for (const plantBlock of structure.blocks) {
            if (plantBlock.x === block.x && plantBlock.y === block.y) {
              isImmaturePlantPart = true;
              plantKey = key;
              break;
            }
          }
        }

        if (isImmaturePlantPart) break;
      }

      // If it's part of an immature plant, remove the entire plant
      if (isImmaturePlantPart && plantKey) {
        const structure = currentStructures[plantKey];

        if (structure.blocks) {
          structure.blocks.forEach((plantBlock) => {
            if (
              plantBlock.x >= 0 &&
              plantBlock.x < WORLD_WIDTH &&
              plantBlock.y >= 0 &&
              plantBlock.y < WORLD_HEIGHT
            ) {
              currentWorld.setTile(plantBlock.x, plantBlock.y, TILES.AIR);
            }
          });
        }

        // Give small chance to get a seed back when breaking immature plants
        if (structure.seedType && Math.random() < 0.5) {
          seedUpdates[structure.seedType] =
            (seedUpdates[structure.seedType] || 0) + 1;
        }
        delete updatedStructures[plantKey];
        delete updatedTimers[plantKey];
      } else {
        // Regular block breaking
        currentWorld.setTile(block.x, block.y, TILES.AIR);

        // Remove from growth timers if it was a crop
        delete updatedTimers[`${block.x},${block.y}`];

        // Give small chance to drop seeds from broken natural crops
        if (block.tile.crop && Math.random() < 0.3) {
          const cropToSeed = {
            [TILES.WHEAT.id]: "WHEAT",
            [TILES.CARROT.id]: "CARROT",
            [TILES.MUSHROOM.id]: "MUSHROOM",
            [TILES.CACTUS.id]: "CACTUS",
          };

          const seedType = cropToSeed[block.tile.id];

          if (seedType) {
            seedUpdates[seedType] = (seedUpdates[seedType] || 0) + 1;
          }
        }

        // Collect materials from broken blocks
        const materialType = getMaterialFromTile(block.tile, TILES);
        if (materialType) {
          // Special handling for leaves - only sometimes drop wood
          if (block.tile === TILES.TREE_LEAVES && Math.random() < 0.3) {
            materialUpdates[materialType] =
              (materialUpdates[materialType] || 0) + 1;
          } else if (block.tile !== TILES.TREE_LEAVES) {
            materialUpdates[materialType] =
              (materialUpdates[materialType] || 0) + 1;
          }
        }
      }
    });

    // Apply updates back to state, world, timers, and structures
    game.state.world.set(currentWorld);
    game.state.growthTimers.set(updatedTimers);
    game.state.plantStructures.set(updatedStructures);

    // Update seed inventory if we gained any seeds
    if (Object.keys(seedUpdates).length > 0) {
      game.updateState("seedInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(seedUpdates).forEach(([seedType, amount]) => {
          updated[seedType] += amount;
        });

        return updated;
      });
    }

    // Update materials inventory if we gained any materials
    if (Object.keys(materialUpdates).length > 0) {
      game.updateState("materialsInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(materialUpdates).forEach(([materialType, amount]) => {
          updated[materialType] = (updated[materialType] || 0) + amount;
        });

        return updated;
      });
    }

    updateInventoryDisplay(doc, game.state);
  }
}
