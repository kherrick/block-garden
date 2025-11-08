import { getRandomInt } from "../../util/getRandomInt.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

export class Fireworks extends SpriteGarden {
  createFirework(x, y, config = {}) {
    const {
      maxRadius = 10,
      maxFrames = 35,
      colors = [
        this.tiles.LAVA,
        this.tiles.ICE,
        this.tiles.WATER,
        this.tiles.SNOW,
      ],
    } = config;

    const world = this.getWorld();

    let radius = 2;
    let frame = 0;

    const animate = () => {
      if (frame >= maxFrames) {
        // Clear firework
        for (let i = -maxRadius; i <= maxRadius; i++) {
          for (let j = -maxRadius; j <= maxRadius; j++) {
            if (Math.sqrt(i * i + j * j) <= maxRadius) {
              world.setTile(x + i, y + j, this.tiles.AIR);
            }
          }
        }

        this.setWorld(world);

        return;
      }

      const angleStep = Math.PI / 8;
      const color = colors[Math.floor(radius) % colors.length];

      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        for (let i = 1; i <= Math.floor(radius); i++) {
          const offsetX = Math.round(Math.cos(angle) * i);
          const offsetY = Math.round(Math.sin(angle) * i);

          world.setTile(x + offsetX, y + offsetY, color);
        }
      }

      // Spark trails
      const angles = [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];
      angles.forEach((angle) => {
        const trailColor = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < radius + 2; i++) {
          const offsetX = Math.round(Math.cos(angle) * i);
          const offsetY = Math.round(Math.sin(angle) * i);

          world.setTile(x + offsetX, y + offsetY, trailColor);
        }
      });

      this.setWorld(world);

      radius += 0.2;
      frame++;

      requestAnimationFrame(animate);
    };

    animate();
  }

  createFireworksShow(config = {}) {
    const surfaceLevel = this.config.SURFACE_LEVEL.get();

    const {
      count = 20,
      duration = 8000,
      xMin = 165,
      xMax = 300,
      yMin = surfaceLevel - 5,
      yMax = surfaceLevel - 20,
      delay = 0,
    } = config;

    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        setTimeout(
          () => {
            this.createFirework(
              getRandomInt(xMin, xMax),
              getRandomInt(yMin, yMax),
            );
          },
          getRandomInt(0, duration),
        );
      }
    }, delay);
  }
}

export async function demo() {
  const api = new Fireworks();

  // Setup
  await api.setFullscreen();

  api.setFogMode("clear");
  api.setBreakMode("extra");

  console.log("🎮 SpriteGarden Demo: Fireworks");

  // Start Fireworks
  api.createFireworksShow();

  const apiText = "spriteGarden.demo.fireworksAPI";

  console.log("🧬 Fireworks started!");
  console.log(`💡 Use ${apiText}.createFireworksShow() to enjoy another!`);

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    fireworksAPI: api,
  };
}
