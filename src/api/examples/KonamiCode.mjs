import { BlockGarden } from "../BlockGarden.mjs";
import { sleep } from "../misc/sleep.mjs";
import { showToast } from "../ui/toast.mjs";

export class KonamiCode extends BlockGarden {
  async start() {
    const code = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

    let message = "";
    await this.pressKeySequence(code, 150, (ck) => {
      switch (ck) {
        case 38:
          message = "Up";
          break;
        case 40:
          message = "Down";
          break;
        case 37:
          message = "Left";
          break;
        case 39:
          message = "Right";
          break;
        case 66:
          message = "B";
          break;
        case 65:
          message = "A";
          break;
        default:
          break;
      }

      showToast(this.shadow, message);
    });
  }
}

export async function demo(
  settingsSelector = '#settings > [class="ui-grid__corner--heading"]',
) {
  const api = new KonamiCode();

  // Setup
  await api.setFullscreen();

  const settingsElement = api.shadow.querySelector(settingsSelector);
  if (settingsElement instanceof HTMLDivElement) {
    settingsElement.click();
  }

  console.log("🎮 BlockGarden Demo: KonamiCode");

  // Start KonamiCode
  console.log("🧬 KonamiCode started!");

  showToast(api.shadow, "Beginning Konami Code sequence");
  await sleep(2000);

  await api.start();

  const apiText = "blockGarden.demo.konamiCodeAPI";

  console.log(`💡 Use ${apiText}.start() to ... well, run the demo again! :-)`);

  // Expose to console for interaction
  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    konamiCodeAPI: api,
  };
}
