import { updateState } from "./state.mjs";

export const getHarvestMap = (tiles) => ({
  [tiles.WHEAT.id]: "WHEAT",
  [tiles.CARROT.id]: "CARROT",
  [tiles.MUSHROOM.id]: "MUSHROOM",
  [tiles.CACTUS.id]: "CACTUS",
  [tiles.WALNUT.id]: "WALNUT",
  [tiles.BERRY_BUSH.id]: "BERRY_BUSH",
  [tiles.BAMBOO.id]: "BAMBOO",
  [tiles.SUNFLOWER.id]: "SUNFLOWER",
  [tiles.CORN.id]: "CORN",
  [tiles.PINE_TREE.id]: "PINE_TREE",
  [tiles.WILLOW_TREE.id]: "WILLOW_TREE",
  [tiles.FERN.id]: "FERN",
});

export function harvestCrop({ cropTile, tiles, world, x, y }) {
  const seedType = getHarvestMap(tiles)[cropTile.id];
  if (seedType) {
    // Give player 2-4 seeds when harvesting simple crops
    const seedsGained = 2 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] + seedsGained,
    }));

    // Remove crop from world
    world.setTile(x, y, tiles.AIR);

    console.log(
      `Harvested simple ${seedType} crop, gained ${seedsGained} seeds`,
    );
  }
}
