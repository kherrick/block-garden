import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

// Helper function to get tile from material type
function getTileFromMaterial(materialType, TILES) {
  const materialToTile = {
    DIRT: TILES.DIRT,
    STONE: TILES.STONE,
    WOOD: TILES.TREE_TRUNK,
    SAND: TILES.SAND,
    CLAY: TILES.CLAY,
    COAL: TILES.COAL,
    IRON: TILES.IRON,
    GOLD: TILES.GOLD,
  };

  return materialToTile[materialType] || null;
}

export function handlePlaceBlock(currentState, game, doc, key) {
  const { player, world, TILES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } =
    currentState;

  const selectedMaterial = game.state.selectedMaterialType.get();
  if (!selectedMaterial) {
    console.log("No material selected for placement");
    return;
  }

  const materialsInventory = game.state.materialsInventory.get();
  if (materialsInventory[selectedMaterial] <= 0) {
    console.log(`No ${selectedMaterial} available to place`);
    return;
  }

  const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

  let targetX, targetY;

  // Determine placement position based on key pressed
  switch (key.toLowerCase()) {
    case "u": // Top left
      targetX = playerTileX - 1;
      targetY = playerTileY - 1;
      break;
    case "i": // Top
      targetX = playerTileX;
      targetY = playerTileY - 1;
      break;
    case "o": // Top right
      targetX = playerTileX + 1;
      targetY = playerTileY - 1;
      break;
    case "j": // Left
      targetX = playerTileX - 1;
      targetY = playerTileY;
      break;
    case "l": // Right
      targetX = playerTileX + 1;
      targetY = playerTileY;
      break;
    case "m": // Bottom Left
      targetX = playerTileX - 1;
      targetY = playerTileY + 1;
      break;
    case ",": // Bottom
      targetX = playerTileX;
      targetY = playerTileY + 1;
      break;
    case ".": // Bottom Right
      targetX = playerTileX + 1;
      targetY = playerTileY + 1;
      break;
    default:
      console.log(`Invalid placement key: ${key}`);
      return;
  }

  // Check if placement position is valid
  if (
    targetX < 0 ||
    targetX >= WORLD_WIDTH ||
    targetY < 0 ||
    targetY >= WORLD_HEIGHT
  ) {
    console.log(
      `Cannot place block outside world bounds at (${targetX}, ${targetY})`,
    );
    return;
  }

  // Check if the target position is already occupied by a solid block
  const currentTile = world.getTile(targetX, targetY);
  if (currentTile && currentTile !== TILES.AIR && currentTile.solid) {
    console.log(
      `Cannot place block at (${targetX}, ${targetY}) - position occupied`,
    );
    return;
  }

  // Get the tile to place
  const tileToPlace = getTileFromMaterial(selectedMaterial, TILES);
  if (!tileToPlace) {
    console.log(`Invalid material type: ${selectedMaterial}`);
    return;
  }

  // Place the block
  const currentWorld = game.state.world.get();
  currentWorld.setTile(targetX, targetY, tileToPlace);
  game.state.world.set(currentWorld);

  // Remove one unit from materials inventory
  game.updateState("materialsInventory", (inv) => ({
    ...inv,
    [selectedMaterial]: inv[selectedMaterial] - 1,
  }));

  updateInventoryDisplay(doc, game.state);

  console.log(
    `Placed ${selectedMaterial} at (${targetX}, ${targetY}), ${
      game.state.materialsInventory.get()[selectedMaterial]
    } remaining`,
  );
}
