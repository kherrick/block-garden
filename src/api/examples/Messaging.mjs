import { resizeCanvas } from "../../util/resizeCanvas.mjs";
import { sleep } from "../../util/sleep.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

export class Messaging extends SpriteGarden {
  messagingConfig = {
    initialDelay: 1000,
    waterDropDelay: 3000, // Delay after text appears before water drops (ms)
    textStaggerDelay: 100, // Delay between each text message appearing (ms)
  };

  // Draw all text messages - these run asynchronously
  phrases = [
    { text: "Sprite Garden is the best!", y: 10 },
    { text: "¡Sprite Garden es el mejor!", y: 20 },
    { text: "Sprite Garden ist das Beste!", y: 30 },
    { text: "Sprite Garden est le meilleur !", y: 40 },
  ];

  // Calculate when water starts (after initial delay + text appears + water drop delay)
  waterStartTime =
    this.messagingConfig.initialDelay +
    this.phrases.length * this.messagingConfig.textStaggerDelay +
    this.messagingConfig.waterDropDelay;

  async init() {
    this.config.currentResolution.set("fullscreen");

    if (this.config.fogMode.get() === "fog") {
      this.config.fogMode.set("clear");
    }

    resizeCanvas(this.gThis.document, this.config);

    console.log(
      `🎮 Waiting ${this.messagingConfig.initialDelay / 1000}s before starting animation...`,
    );

    console.log(`Player can explore during this time!`);

    await sleep(this.messagingConfig.initialDelay);

    console.log(`📝 Drawing text messages...`);

    this.phrases.forEach(({ text, y }, index) => {
      setTimeout(() => {
        this.drawTextWithBox(text, 165, y, {
          waterDropDelay:
            this.messagingConfig.initialDelay +
            this.messagingConfig.waterDropDelay,
        });
      }, index * this.messagingConfig.textStaggerDelay);
    });

    console.log(`💧 Water will drop at ${this.waterStartTime / 1000}s`);
    console.log(
      "✅ Animation sequence initialized! Player controls are fully responsive.",
    );
  }
}

export async function demo() {
  const api = new Messaging();

  // Setup
  await api.setFullscreen();

  api.setFogMode("clear");

  console.log("🎮 SpriteGarden Demo: Messaging");

  // Start Messaging
  await api.init();

  const apiText = "spriteGarden.demo.messagingAPI";

  console.log("🧬 Messaging started!");
  console.log(`💡 Use ${apiText}.init() to demo again!`);

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    messagingAPI: api,
  };
}
