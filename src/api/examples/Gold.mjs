import { sleep } from "../misc/sleep.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

import { getPlayerPosition } from "../player/getPlayerPosition.mjs";
import { jumpUp } from "../player/movement.mjs";
import { pressKey } from "../player/pressKey.mjs";

export class Gold extends SpriteGarden {
  returnToMinDepth = false;

  getMinDepth(worldHeight) {
    return worldHeight * 0.4;
  }

  getMaxDepth(worldHeight) {
    return worldHeight * 0.75;
  }

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

  isAtLeftEdge(position) {
    const { isAtLeft } = position.bounds;

    return isAtLeft;
  }

  isAtRightEdge(position) {
    const { isAtRight } = position.bounds;

    return isAtRight;
  }

  isAtEdge(position) {
    const { isAtRight, isAtLeft, isAtBottom, isAtTop } = position.bounds;

    return isAtRight || isAtLeft || isAtBottom || isAtTop;
  }

  // make sure player is at least minDepth down
  async ensureDepth(player, tileSize, worldHeight, worldWidth) {
    console.log(
      `⬇️ Ensuring player is at least ${this.getMinDepth(worldHeight)} down`,
    );

    while (
      getPlayerPosition(player, tileSize, worldHeight, worldWidth).tile.y <
      this.getMinDepth(worldHeight)
    ) {
      console.log("⬇️ Dig down");

      await pressKey(this.shadow, 82);

      await sleep(300);
    }
  }

  async init(targetGold = 20) {
    console.log(
      `🪙 Starting gold mining automation! Target: ${targetGold} gold`,
    );

    // Start game setup
    await jumpUp(this.shadow, 300);
    await sleep(500);

    // Farm in case starting on tree
    await this.holdKey(70);
    await sleep(500);
    await this.releaseKey(70);

    console.log("🌳 Cleared starting position");

    // Dig down 30 tiles initially with "break mode" set to "extra"
    console.log("⬇️ Initial dig: 30 tiles");
    this.setBreakMode("extra");
    await this.moveAndDig(83, 30);
    await sleep(500);
    this.setBreakMode("regular");

    const player = this.state.player.get();
    const tileSize = this.config.TILE_SIZE.get();
    const worldHeight = this.config.WORLD_HEIGHT.get();
    const worldWidth = this.config.WORLD_WIDTH.get();

    const halfWorldWidth = Math.ceil(worldWidth / 2);

    // First right move: (from center to right edge)
    console.log(
      `➡️ Initial dig: move right ${halfWorldWidth} tiles (toward right edge)`,
    );

    for (let index = 0; index < halfWorldWidth; index++) {
      const position = getPlayerPosition(
        player,
        tileSize,
        worldHeight,
        worldWidth,
      );

      if (position.tile.y > this.getMaxDepth(worldHeight)) {
        console.log(
          `🤿 return to minimum depth: ${this.getMinDepth(worldHeight)}`,
        );

        await this.holdKey(87);
      }

      // farming for safety
      await this.holdKey(70);
      await this.moveAndDig(68, 1, 1);
      await this.releaseKey(70);
      await this.releaseKey(87);

      if (this.isAtRightEdge(position)) {
        break;
      }
    }

    let gold = this.getGoldCount();
    console.log(`💰 Starting gold: ${gold}/${targetGold}`);

    let pass = 1;

    while (gold < targetGold) {
      console.log(`🔄 Pass ${pass} start`);

      console.log(`Jumping before dig at right edge`);
      await jumpUp;
      await sleep(300);

      console.log("⬇️ Dig down 2 tile at right edge");
      await this.pressKeyRepeat(82, 1);
      await sleep(300);

      await this.ensureDepth(player, tileSize, worldHeight, worldWidth);

      gold = this.getGoldCount();
      console.log(`💰 After right-edge dig: ${gold}/${targetGold}`);

      if (gold >= targetGold) {
        break;
      }

      console.log(
        `⬅️ Pass ${pass} - move left ${worldWidth} tiles (to left edge)`,
      );

      // Move left and dig
      for (let index = 0; index < worldWidth; index++) {
        const position = getPlayerPosition(
          player,
          tileSize,
          worldHeight,
          worldWidth,
        );

        if (position.tile.y > this.getMaxDepth(worldHeight)) {
          this.returnToMinDepth = true;

          console.log(
            `🤿 return to minimum depth: ${this.getMinDepth(worldHeight)}`,
          );
        }

        if (position.tile.y < this.getMinDepth(worldHeight)) {
          this.returnToMinDepth = false;
        }

        if (this.returnToMinDepth) {
          await this.holdKey(87);
        }

        // farming for safety
        await this.holdKey(70);
        await this.moveAndDig(65, 1, 1);
        await this.releaseKey(70);
        await this.releaseKey(87);

        if (this.isAtLeftEdge(position)) {
          break;
        }
      }

      console.log("🔄 Jumping before dig at left edge");
      await jumpUp(this.shadow, 300);
      await sleep(300);

      // Dig down 2 tiles at left edge
      console.log("⬇️ Dig down 2 tile at left edge");
      await this.pressKeyRepeat(82, 1, 50);
      await sleep(300);

      await this.ensureDepth(player, tileSize, worldHeight, worldWidth);

      gold = this.getGoldCount();
      console.log(`💰 After left-edge dig: ${gold}/${targetGold}`);

      if (gold >= targetGold) {
        break;
      }

      // Move right again to reset position
      for (let index = 0; index < worldWidth; index++) {
        const position = getPlayerPosition(
          player,
          tileSize,
          worldHeight,
          worldWidth,
        );

        if (position.tile.y > this.getMaxDepth(worldHeight)) {
          this.returnToMinDepth = true;

          console.log(
            `🤿 return to minimum depth: ${this.getMinDepth(worldHeight)}`,
          );
        }

        if (position.tile.y < this.getMinDepth(worldHeight)) {
          this.returnToMinDepth = false;
        }

        if (this.returnToMinDepth) {
          await this.holdKey(87);
        }

        // farming for safety
        await this.holdKey(70);
        await this.moveAndDig(68, 1, 1);
        await this.releaseKey(70);
        await this.releaseKey(87);

        if (this.isAtRightEdge(position)) {
          break;
        }
      }

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
  api.init(20);

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
