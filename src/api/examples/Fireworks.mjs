import { getRandomInt } from "../../util/getRandomInt.mjs";
import { BlockGarden } from "../BlockGarden.mjs";

export class Fireworks extends BlockGarden {
  /**
   * Creates a single firework that launches from startY to targetY and then explodes.
   *
   * @param {number} x
   * @param {number} startY
   * @param {number} targetY
   * @param {number} z
   * @param {object} config
   */
  createFirework(x, startY, targetY, z, config = {}) {
    x = Math.floor(x);
    startY = Math.floor(startY);
    targetY = Math.floor(targetY);
    z = Math.floor(z);

    const {
      explosionRadius = 7,
      explosionDuration = 20, // Frames for explosion expansion
      colors = [
        "Gold",
        "Ice",
        "Snow",
        "Rose Bloom",
        "Lavender Flowers",
        "Sunflower Petals",
        "Tulip Petals",
      ],
      rocketBlock = "Iron", // Block appearance for the rocket
      rocketSpeed = 0.8, // Blocks per frame roughly
    } = config;

    // Resolve block IDs once
    const colorIds = colors
      .map((name) => this.getBlockIdByName(name))
      .filter((id) => id !== -1);

    // Fallback if no colors found
    if (colorIds.length === 0) {
      colorIds.push(this.getBlockIdByName("Gold"));
    }

    const rocketBlockId = this.getBlockIdByName(rocketBlock);
    const airBlockId = this.getBlockIdByName("Air");

    // State
    let currentY = startY;
    let phase = "rocket"; // rocket, explode
    let tick = 0;

    // Explosion particles: Array of {x, y, z, vx, vy, vz, block}
    let particles = [];

    const animate = () => {
      const updates = [];

      if (phase === "rocket") {
        // Clear previous position
        updates.push({ x, y: Math.floor(currentY), z, block: airBlockId });

        // Move up
        currentY += rocketSpeed;

        // Draw new position if not reached target
        if (currentY < targetY) {
          updates.push({ x, y: Math.floor(currentY), z, block: rocketBlockId });
        } else {
          // Reached target! Switch to explosion
          phase = "explode";
          this.initExplosion(
            x,
            Math.floor(currentY),
            z,
            colorIds,
            explosionRadius,
            particles,
          );
        }
      } else if (phase === "explode") {
        // Update particles
        // Clear old positions
        particles.forEach((p) => {
          updates.push({
            x: Math.floor(p.x),
            y: Math.floor(p.y),
            z: Math.floor(p.z),
            block: airBlockId,
          });
        });

        // Move particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Gravity / Drag effect on particles
          p.vy -= 0.05; // heavy gravity for fireworks arc
          p.vx *= 0.95; // drag
          p.vz *= 0.95; // drag

          p.life--;
        });

        // Remove dead particles
        particles = particles.filter((p) => p.life > 0);

        // Draw new positions
        particles.forEach((p) => {
          if (p.life > 0) {
            updates.push({
              x: Math.floor(p.x),
              y: Math.floor(p.y),
              z: Math.floor(p.z),
              block: p.block,
            });
          }
        });

        // If no particles left, stop
        if (particles.length === 0) {
          // Final flush of clears
          this.batchSetBlocks(updates);
          return; // Done
        }
      }

      this.batchSetBlocks(updates);
      requestAnimationFrame(animate);
    };

    animate();
  }

  initExplosion(x, y, z, colors, radius, particlesArray) {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      // Random direction in sphere
      // Use Rejection Sampling or simple spherical
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const speed = Math.random() * 0.5 + 0.2; // expansion speed

      const vx = Math.sqrt(1 - u * u) * Math.cos(theta) * speed;
      const vy = Math.sqrt(1 - u * u) * Math.sin(theta) * speed;
      const vz = u * speed;

      particlesArray.push({
        x: x,
        y: y,
        z: z,
        vx: vx,
        vy: vy,
        vz: vz,
        block: colors[Math.floor(Math.random() * colors.length)],
        life: getRandomInt(20, 50), // Random lifetime for fizzle effect
      });
    }
  }

  createFireworksShow(config = {}) {
    const {
      count = 10,
      duration = 8000,
      xMin = 5,
      xMax = 25,
      yStart = 2, // Start near ground
      yMinTarget = 25,
      yMaxTarget = 45,
      zMin = 10,
      zMax = 30,
      delay = 0,
    } = config;

    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const fx = getRandomInt(xMin, xMax);
        const targetY = getRandomInt(yMinTarget, yMaxTarget);
        const fz = getRandomInt(zMin, zMax);

        setTimeout(
          () => {
            this.createFirework(fx, yStart, targetY, fz);
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

  console.log("🎮 BlockGarden Demo: Fireworks (Improved)");

  api.createFireworksShow();

  const apiText = "blockGarden.demo.fireworksAPI";

  console.log("🧬 Fireworks started!");
  console.log(`💡 Use ${apiText}.createFireworksShow() to enjoy another!`);

  // Expose to console for interaction
  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    fireworksAPI: api,
  };
}
