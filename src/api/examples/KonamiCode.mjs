import { SpriteGarden } from "../SpriteGarden.mjs";

export class KonamiCode extends SpriteGarden {
  async start() {
    const code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

    await this.pressKeySequence(code, 150);
  }
}

export async function demo(
  settingsSelector = '#settings > [class="ui-grid__corner--heading"]',
) {
  const api = new KonamiCode();

  // Setup
  await api.setFullscreen();

  api.setFogMode("clear");
  api.setBreakMode("extra");

  api.shadow.querySelector(settingsSelector).click();

  console.log("🎮 SpriteGarden Demo: KonamiCode");

  // Start KonamiCode
  console.log("🧬 KonamiCode started!");
  await api.start();

  api.shadow.getElementById("toggleMapEditor").click();

  const apiText = "spriteGarden.demo.konamiCodeAPI";

  console.log(`💡 Use ${apiText}.start() to ... well, run the demo again! :-)`);

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    konamiCodeAPI: api,
  };
}
