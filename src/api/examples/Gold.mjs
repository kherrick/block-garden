import { sleep } from "../../util/sleep.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

export class Gold extends SpriteGarden {
  getGoldCount() {
    const mats = this.state.materialsInventory?.get
      ? this.state.materialsInventory.get()
      : {};

    return mats.GOLD || 0;
  }

  setGold(amount = 99999) {
    this.setMaterialCount("GOLD", amount);

    console.log(`💎 Gold set to ${amount}`);
  }

  async init(targetGold = 100) {
    console.log(
      `🪙 Starting gold mining automation! Target: ${targetGold} gold`,
    );

    // Start game setup
    await this.pressKey(32, 300);
    await sleep(500);
    await this.holdKey(70);
    await sleep(500);
    await this.releaseKey(70);
    console.log("🌳 Cleared starting position");

    // Dig down 40 tiles initially
    console.log("⬇️ Initial dig: 40 tiles");
    await this.moveAndDig(83, 40);
    await sleep(500);

    // First right move: (from center to right edge)
    const mapWidth = this.config.WORLD_WIDTH.get();
    console.log(`➡️ Initial dig: move right ${mapWidth} tiles (to right edge)`);
    await this.moveAndDig(68, mapWidth / 2);

    let gold = this.getGoldCount();
    console.log(`💰 Starting gold: ${gold}/${targetGold}`);

    let pass = 1;

    while (gold < targetGold) {
      console.log(`🔄 Pass ${pass} start`);

      console.log(`Jumping before dig at right edge`);
      await this.pressKey(32, 300);
      await sleep(300);

      console.log("⬇️ Dig down 2 tile at right edge");
      await this.pressKeyRepeat(82, 1, 50);
      await sleep(300);

      gold = this.getGoldCount();
      console.log(`💰 After right-edge dig: ${gold}/${targetGold}`);

      if (gold >= targetGold) {
        break;
      }

      console.log(
        `⬅️ Pass ${pass} - move left ${mapWidth} tiles (to left edge)`,
      );

      // Move left and dig
      await this.moveAndDig(65, mapWidth);

      console.log("🔄 Jumping before dig at left edge");
      await this.pressKey(32, 300);
      await sleep(300);

      // Dig down 2 tiles at left edge
      console.log("⬇️ Dig down 2 tile at left edge");
      await this.pressKeyRepeat(82, 1, 50);
      await sleep(300);

      gold = this.getGoldCount();
      console.log(`💰 After left-edge dig: ${gold}/${targetGold}`);

      if (gold >= targetGold) {
        break;
      }

      // Move right again to reset position
      await this.moveAndDig(68, mapWidth);
      gold = this.getGoldCount();

      console.log(`💰 After return move: ${gold}/${targetGold}`);

      pass++;
    }

    console.log(
      `✅ Mining complete after ${pass} passes! Final gold: ${gold} 🪙`,
    );
  }
}

export async function demo() {
  const api = new Gold();

  // Setup
  await api.setFullscreen();
  api.setFogMode("clear");

  console.log("🎮 SpriteGarden Demo: Automated Gold Mining");
  console.log("⛏️ Watch the character mine gold using a zigzag pattern!");
  console.log("");
  console.log("📋 Strategy:");
  console.log("   • Dig down 40 tiles to reach mining depth");
  console.log("   • Move to right edge");
  console.log("   • Zigzag left-right across map width");
  console.log("   • Dig down 2 tiles at each edge");
  console.log("   • Stop when expected gold collected");
  console.log("");

  await sleep(1000);

  // Run the automated pattern
  api.init(100);

  const apiText = "spriteGarden.demo.goldAPI";

  console.log(`💡 Use ${apiText}.init() to run again!`);
  console.log(
    `💡 Use individual methods like ${apiText}.setGold(10) to set player's gold inventory to 10.`,
  );

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    goldAPI: api,
  };
}
