import { BlockGarden } from "../BlockGarden.mjs";

export class LinkDemo extends BlockGarden {
  createLink(config = {}) {
    const {
      x = 30,
      y = 60,
      z = 20,
      text = "Block Garden",
      url = "https://github.com/kherrick/block-garden",
      target = "_blank",
      onBlock = this.getBlockIdByName("Gold"),
      offBlock = this.getBlockIdByName("Air"),
      replaceBlock = true,
    } = config;

    console.log(`🔗 Link Demo Setup:`);
    console.log(`   Position: (${x}, ${y}, ${z})`);
    console.log(`   URL: ${url}`);
    console.log(`   Target: ${target}`);

    // Draw the text
    const bounds = this.drawText(text, x, y, z, onBlock, offBlock);

    // Filter updates to only include the "on" blocks for interactivity
    const interactionRegion = {
      x1: x,
      y1: y,
      x2: bounds.width + x - 1,
      y2: bounds.height + y - 1,
      z: z,
    };

    const onBlockBreak = (wx, wy, wz) => {
      if (
        wz === interactionRegion.z &&
        wx >= interactionRegion.x1 &&
        wx <= interactionRegion.x2 &&
        wy >= interactionRegion.y1 &&
        wy <= interactionRegion.y2
      ) {
        console.log(`🚀 Navigating to: ${url}`);
        this.openUrl(url, target);

        if (replaceBlock) {
          this.setBlock(wx, wy, wz, onBlock);
        }
      }
    };

    return {
      onBlockBreak,
      updateUrl: (newUrl) => {
        config.url = newUrl;
        console.log(`🔗 URL updated to: ${newUrl}`);
      },
    };
  }
}

export async function demo() {
  const api = new LinkDemo();
  await api.setFullscreen();

  const link = api.createLink({
    text: "Block Garden",
    url: "https://github.com/kherrick/block-garden",
    x: 20,
    y: 60,
    z: 25,
  });

  api.onBlockBreak((x, y, z) => {
    link.onBlockBreak(x, y, z);
  });

  console.log("🔗 BlockGarden Demo: Link Interaction");
  console.log("💡 Break a GOLD block to open the URL");
}
