import { SpriteGarden } from "../SpriteGarden.mjs";

export class Fullscreen extends SpriteGarden {}

export async function demo() {
  const api = new Fullscreen();

  // Setup
  await api.setFullscreen();

  api.setFogMode("clear");

  console.log("🎮 SpriteGarden Demo: Fullscreen");

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    fullscreen: api,
  };
}
