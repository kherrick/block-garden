import { BlockGarden } from "../BlockGarden.mjs";
import { characters } from "../misc/characters.mjs";
import { showToast } from "../ui/toast.mjs";

export class Messaging extends BlockGarden {
  constructor() {
    super();
  }

  /**
   * Initializes the messaging demo by drawing text in the game world.
   *
   * @param {string} msgOne
   * @param {string} msgTwo
   * @param {string} onBlock
   * @param {string} offBlock
   * @param {number} x1
   * @param {number} y1
   * @param {number} z1
   * @param {number} x2
   * @param {number} y2
   * @param {number} z2
   */
  async init(
    msgOne = "Block",
    msgTwo = "Garden",
    onBlock = "Snow",
    offBlock = "Coal",
    x1 = 15,
    y1 = 76,
    z1 = 45,
    x2 = 15,
    y2 = 70,
    z2 = 45,
    rotate = 180,
  ) {
    try {
      const onBlockId = this.getBlockIdByName(onBlock);
      const offBlockId = this.getBlockIdByName(offBlock);

      const boundsOne = this.drawText(
        msgOne, // text to draw
        x1, // x: 15 = right side of screen (centered)
        y1, // y: 76 = toward the clouds
        z1, // z: 45 = IN FRONT of player (spawn)
        onBlockId, // onBlock: block ID for text pixels (the letters)
        offBlockId, // offBlock: block ID for background (empty space)
        1, // spacing: 1 block between characters
        characters, // IMPORTANT: pass the characters font data
        rotate, // rotate: 180 degrees (Right to Left)
      );

      const boundsTwo = this.drawText(
        msgTwo, // text to draw
        x2, // x: 15 = right side of screen (centered)
        y2, // y: 70 = toward the clouds
        z2, // z: 45 = IN FRONT of player (spawn)
        onBlockId, // onBlock: block ID for text pixels (the letters)
        offBlockId, // offBlock: block ID for background (empty space)
        1, // spacing: 1 block between characters
        characters, // IMPORTANT: pass the characters font data
        rotate, // rotate: 180 degrees (Right to Left)
      );

      showToast(this.shadow, "The text has been drawn successfully!");
      setTimeout(
        () => showToast(this.shadow, "Look up toward the clouds ↑↑↑"),
        4000,
      );
      setTimeout(
        () => showToast(this.shadow, "Look up toward the clouds ↑↑↑"),
        8000,
      );

      console.log(`✓ Text drawn successfully!`);

      console.log(
        `  Position: (${boundsOne.x}, ${boundsOne.y}, ${boundsOne.z})`,
      );
      console.log(`  Size: ${boundsOne.width}x${boundsOne.height} blocks`);

      console.log(
        `  Position: (${boundsTwo.x}, ${boundsTwo.y}, ${boundsTwo.z})`,
      );
      console.log(`  Size: ${boundsTwo.width}x${boundsTwo.height} blocks`);
    } catch (error) {
      console.error("Error drawing text:", error);
    }
  }
}

export async function demo() {
  // Wait for blockGarden to be available
  let attempts = 0;
  while (!globalThis.blockGarden && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (!globalThis.blockGarden) {
    console.error(
      "blockGarden not initialized. Make sure the game has loaded.",
    );
    return;
  }

  const api = new Messaging();
  globalThis.Messaging = api;

  // Setup
  if (typeof api.setFullscreen === "function") {
    await api.setFullscreen();
  }

  console.log("🎮 BlockGarden Demo: Messaging");

  // Start Messaging
  await api.init();

  const apiText = "blockGarden.demo.messagingAPI";

  console.log("🧬 Messaging started!");
  console.log(`💡 Use ${apiText}.init() to demo again!`);

  // Expose to console for interaction
  api.gThis.blockGarden.demo = {
    ...(api.gThis.blockGarden.demo || {}),
    messagingAPI: api,
  };
}
