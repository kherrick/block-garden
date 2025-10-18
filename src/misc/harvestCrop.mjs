import { updateState } from "../state/state.mjs";
import { getHarvestMap } from "./getHarvestMap.mjs";

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
