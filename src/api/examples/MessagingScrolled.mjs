import { resizeCanvas } from "../../util/resizeCanvas.mjs";
import { sleep } from "../misc/sleep.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

export class MessagingScrolled extends SpriteGarden {
  surfaceLevel = this.config.SURFACE_LEVEL.get();
  centerLevel = this.config.WORLD_WIDTH.get() / 2;

  // Initialize scroll position
  scrollX = 0;
  animationId = null;
  messageText =
    "A long message can be displayed. It will continue to loop forever.";
  maxScrollWidth = 0;

  startTextScrollAnimation() {
    const scrollStep = 1; // Scroll by 1 character at a time
    const scrollDelay = 200; // ms between scroll steps
    const separator = "   "; // Spacing between end and start of text

    // Create a looping text by appending the start to the end with separator
    const maxVisibleChars = this.getMaxVisibleChars(50);
    const loopingText = this.messageText + separator + this.messageText;

    const animate = () => {
      // Draw the scrolling text with current scroll position
      this.drawScrollableTextBox(
        loopingText,
        this.centerLevel - 25,
        this.surfaceLevel - 20,
        100,
        { scrollX: this.scrollX },
      );

      // Increment scroll position (in characters)
      this.scrollX += scrollStep;

      // Reset scrollX when we've scrolled one full message length
      // This creates the seamless loop effect
      if (this.scrollX >= this.messageText.length + separator.length) {
        this.scrollX = 0;
      }

      // Continue animation
      this.animationId = setTimeout(animate, scrollDelay);
    };

    animate();
  }

  stopTextScrollAnimation() {
    if (this.animationId) {
      clearTimeout(this.animationId);
      this.animationId = null;
    }
  }

  async init() {
    this.config.currentResolution.set("fullscreen");

    if (this.config.fogMode.get() === "fog") {
      this.config.fogMode.set("clear");
    }

    resizeCanvas(this.shadow, this.config);

    console.log(`📝 Drawing text messages...`);

    // Draw initial text (non-animated)
    this.drawScrollableTextBox(
      this.messageText,
      this.centerLevel - 25,
      this.surfaceLevel - 20,
      100,
    );

    await sleep(2000);

    // Start the animation
    this.startTextScrollAnimation();
  }

  // Cleanup method to stop animation when component is destroyed
  destroy() {
    this.stopTextScrollAnimation();
    super.destroy?.();
  }
}

export async function demo() {
  const api = new MessagingScrolled();

  // Setup
  await api.setFullscreen();
  api.setFogMode("clear");

  console.log("🎮 SpriteGarden Demo: MessagingScrolled");

  // Start MessagingScrolled
  await api.init();

  const apiText = "spriteGarden.demo.messagingScrolledAPI";

  console.log("🧬 Messaging started!");
  console.log(`💡 To stop scrolling: ${apiText}.stopTextScrollAnimation();`);
  console.log(
    `💡 To demo again: ${apiText}.messageText = 'your message here...';`,
  );
  console.log(`                  ${apiText}.scrollX = 0;`);
  console.log(`                  ${apiText}.init();`);

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    messagingScrolledAPI: api,
  };
}
