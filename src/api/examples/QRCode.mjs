import { SpriteGarden } from "../SpriteGarden.mjs";

export class QRCode extends SpriteGarden {
  url = "https://kherrick.github.io/sprite-garden/";
}

export async function demo() {
  const api = new QRCode();

  // Setup
  await api.setFullscreen();
  api.setFogMode("clear");
  api.setBreakMode("extra");

  console.log("🎮 SpriteGarden Demo: QR Code");

  // Draw QR code for karlherrick.com
  await api.drawQRCode(api.url, 220, 80, api.tiles.ICE, api.tiles.COAL);

  const apiText = "spriteGarden.demo.qrCodeAPI";

  console.log("📱 QR Code drawn!");
  console.log(`💡 Scan it to check it out!`);
  console.log(`💡 Use ${apiText}.tiles for variety!`);
  console.log(`💡 Use ${apiText}.drawQRCode() to create more!`);
  console.log(
    `💡 Example:
    ${apiText}.drawQRCode(
      "Hello World!",
      180,
      80,
      ${apiText}.tiles.ICE,
      ${apiText}.tiles.COAL
    )`,
  );

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    qrCodeAPI: api,
  };
}
