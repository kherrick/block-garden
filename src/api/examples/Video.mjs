import { BlockGarden } from "../BlockGarden.mjs";

import { applyColorsToShadowHost } from "../../util/colors/applyColorsToShadowHost.mjs";
import { blockNames, getGravityBlocks } from "../../state/config/blocks.mjs";
import { cssColorToRGB } from "../../util/colors/cssColorToRGB.mjs";

export class DrawVideo extends BlockGarden {
  videoStream = null;
  videoElement = null;
  canvasElement = null;
  renderInterval = null;
  isCapturing = false;
  captureButtonRegion = null;
  stopButtonRegion = null;
  currentConfig = null;
  cachedPalette = null; // Cache the block palette
  colorsOptimized = false;

  async manualOptimize() {
    if (!this.videoElement || !this.canvasElement) {
      return;
    }
    if (!this.currentConfig) {
      return;
    }

    const { width: frameWidth, height: frameHeight } = this.currentConfig;

    const ctx = this.canvasElement.getContext("2d", {
      willReadFrequently: true,
    });

    // Draw current video frame to canvas
    ctx.drawImage(this.videoElement, 0, 0, frameWidth, frameHeight);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
    const pixels = imageData.data;

    console.log("🎨 Manually optimizing colors for video feed...");
    const idealColors = await this.getIdealColorMapForPixels(
      pixels,
      frameWidth,
      frameHeight,
    );
    applyColorsToShadowHost(this.shadow, idealColors);
    this.cachedPalette = this.getBlockColorPalette();
    this.colorsOptimized = true;

    console.log("✅ Color palette optimized!");
  }

  /**
   * Get all of the block colors for internal use
   *
   * @param {Set} bannedBlocks
   *
   * @returns {{ blockKey: string; displayName: string; blockId: number; cssVar: string; rgb: number[]; }[]}
   */
  getBlockColorPalette(bannedBlocks = null) {
    const style = this.gThis.getComputedStyle(this.shadow.host);
    const paletteMap = new Map(); // Use Map to deduplicate by blockKey

    if (bannedBlocks === null) {
      bannedBlocks = getGravityBlocks(this.blocks);
    }

    // Convert bannedBlocks to a Set of uppercase block keys for lookup
    const bannedKeys = new Set(
      [...bannedBlocks].map((b) =>
        typeof b === "string" ? b.toUpperCase() : b,
      ),
    );

    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      // Only read --bg-block-*-color entries to avoid duplicates with --bg-color-*
      if (prop.startsWith("--bg-block-") && prop.endsWith("-color")) {
        const colorValue = style.getPropertyValue(prop).trim();
        const rgb = cssColorToRGB(this.doc, colorValue);
        if (!rgb) {
          continue;
        }

        const blockKey = this.extractBlockKey(prop);

        if (!blockKey || bannedKeys.has(blockKey)) {
          continue;
        }

        const displayName = blockNames[blockKey];
        const blockId = this.getBlockIdByName(displayName);
        if (blockId === -1) {
          continue;
        }

        // Use Map to ensure only one entry per blockKey (latest wins)
        paletteMap.set(blockKey, {
          blockKey,
          displayName,
          blockId,
          cssVar: prop,
          rgb,
        });
      }
    }

    const palette = [...paletteMap.values()];
    console.log(`🎨 Found ${palette.length} block colors`);
    return palette;
  }

  /**
   * Creates a live video feed display with interactive in-world controls
   *
   * @param {Object} config - Configuration options
   * @param {number} [config.x=10] - X position in world
   * @param {number} [config.y=50] - Y position in world
   * @param {number} [config.z=20] - Z position in world
   * @param {number} [config.width=48] - Frame width in blocks (default increased to 48)
   * @param {number} [config.height=36] - Frame height in blocks (default increased to 36)
   * @param {number} [config.fps=2] - Frames per second (default reduced to 2, range: 0.5-30)
   * @param {boolean} [config.optimizeColors=false] - Optimize block colors for image
   * @param {number} [config.captureButtonBlock] - Block ID for capture button
   * @param {number} [config.stopButtonBlock] - Block ID for stop button
   * @param {number} [config.borderBlock] - Block ID for border
   * @param {number} [config.emptyBlock] - Block ID for empty space
   * @param {boolean} [config.showBorder=true] - Show border around frame
   * @param {string} [config.facingMode="user"] - Camera facing mode ('user' or 'environment')
   * @param {number} [config.buttonSize=4] - Size of control buttons (default increased to 4)
   * @param {number} [config.buttonSpacing=3] - Spacing between buttons (default increased to 3)
   * @param {number} [config.gamma=1.8] - Gamma correction for brightness (1.0=none, 1.8=default, higher=brighter)
   *
   * @returns {Object} Control API for the video feed
   */
  createVideoFeed(config = {}) {
    const {
      x = 10,
      y = 50,
      z = 20,
      width = 48,
      height = 36,
      fps = 2,
      optimizeColors = false,
      captureButtonBlock = this.getBlockIdByName("Grass"),
      stopButtonBlock = this.getBlockIdByName("Rose"),
      borderBlock = this.getBlockIdByName("Stone"),
      emptyBlock = this.getBlockIdByName("Ice"),
      showBorder = true,
      facingMode = "user",
      buttonSize = 4,
      buttonSpacing = 3,
      gamma = 1.8,
    } = config;

    // Store config for runtime adjustments
    this.currentConfig = {
      x,
      y,
      z,
      width,
      height,
      fps,
      optimizeColors,
      captureButtonBlock,
      stopButtonBlock,
      borderBlock,
      emptyBlock,
      showBorder,
      facingMode,
      buttonSize,
      buttonSpacing,
      gamma,
    };

    const frameWidth = width;
    const frameHeight = height;

    // Calculate button positions (to the right of the frame)
    const buttonX = x + frameWidth + 2;
    const captureButtonY =
      y + Math.floor(frameHeight / 2) - buttonSize - buttonSpacing;
    const stopButtonY = y + Math.floor(frameHeight / 2) + buttonSpacing;

    this.captureButtonRegion = {
      x1: buttonX,
      y1: captureButtonY,
      x2: buttonX + buttonSize - 1,
      y2: captureButtonY + buttonSize - 1,
      z: z,
    };

    this.stopButtonRegion = {
      x1: buttonX,
      y1: stopButtonY,
      x2: buttonX + buttonSize - 1,
      y2: stopButtonY + buttonSize - 1,
      z: z,
    };

    console.log(`📹 Video Feed Setup:`);
    console.log(`   Frame: (${x}, ${y}, ${z}) ${frameWidth}x${frameHeight}`);
    console.log(`   FPS: ${fps} (range: 0.5-30)`);
    console.log(`   Button size: ${buttonSize}x${buttonSize}`);
    console.log(
      `   Capture button (Grass): (${buttonX}, ${captureButtonY}, ${z})`,
    );
    console.log(`   Stop button (Rose): (${buttonX}, ${stopButtonY}, ${z})`);

    // Draw border around frame
    const drawBorder = () => {
      if (!showBorder) {
        return;
      }

      const updates = [];
      const margin = 1;

      // Top and bottom borders
      for (let dx = -margin; dx <= frameWidth + margin - 1; dx++) {
        updates.push({ x: x + dx, y: y - margin, z, block: borderBlock });
        updates.push({
          x: x + dx,
          y: y + frameHeight + margin - 1,
          z,
          block: borderBlock,
        });
      }

      // Left and right borders
      for (let dy = -margin; dy <= frameHeight + margin - 1; dy++) {
        updates.push({ x: x - margin, y: y + dy, z, block: borderBlock });
        updates.push({
          x: x + frameWidth + margin - 1,
          y: y + dy,
          z,
          block: borderBlock,
        });
      }

      this.batchSetBlocks(updates);
    };

    // Draw control buttons (recreate on each call to prevent destruction)
    const drawButtons = () => {
      const updates = [];

      // Capture button (Grass)
      for (let dy = 0; dy < buttonSize; dy++) {
        for (let dx = 0; dx < buttonSize; dx++) {
          updates.push({
            x: buttonX + dx,
            y: captureButtonY + dy,
            z: z,
            block: captureButtonBlock,
          });
        }
      }

      // Stop button (Rose)
      for (let dy = 0; dy < buttonSize; dy++) {
        for (let dx = 0; dx < buttonSize; dx++) {
          updates.push({
            x: buttonX + dx,
            y: stopButtonY + dy,
            z: z,
            block: stopButtonBlock,
          });
        }
      }

      this.batchSetBlocks(updates);
    };

    // Clear the video frame area
    const clearFrame = () => {
      const updates = [];
      for (let dy = 0; dy < frameHeight; dy++) {
        for (let dx = 0; dx < frameWidth; dx++) {
          updates.push({ x: x + dx, y: y + dy, z, block: emptyBlock });
        }
      }
      this.batchSetBlocks(updates);
    };

    // Initialize video elements
    const setupVideoElements = () => {
      // Create hidden video element
      this.videoElement = this.doc.createElement("video");
      this.videoElement.setAttribute("playsinline", "");
      this.videoElement.style.display = "none";
      this.doc.body.appendChild(this.videoElement);

      // Create canvas for frame extraction with willReadFrequently
      this.canvasElement = this.doc.createElement("canvas");
      this.canvasElement.width = frameWidth;
      this.canvasElement.height = frameHeight;

      // CRITICAL: Set willReadFrequently for better performance
      const ctx = this.canvasElement.getContext("2d", {
        willReadFrequently: true,
      });

      // Cache ALL block colors from BlockGarden's existing method
      if (!this.cachedPalette) {
        if (optimizeColors) {
          // For video, we don't have a single URL, but we can capture a frame if started
          // However, simpler is to just use getBlockColorPalette for now
          // or add a method to optimize from current canvas
          console.log(
            "🎨 optimizeColors requested for video (snapshot optimization)",
          );
        }
        this.cachedPalette = this.getBlockColorPalette();
        console.log(`🎨 Cached ${this.cachedPalette.length} block colors`);
      }
    };

    // Start camera stream
    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ getUserMedia not supported in this browser");

        return false;
      }

      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: frameWidth * 20 },
            height: { ideal: frameHeight * 20 },
          },
          audio: false,
        };

        this.videoStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        if ("srcObject" in this.videoElement) {
          this.videoElement.srcObject = this.videoStream;
        } else {
          this.videoElement.src = window.URL.createObjectURL(this.videoStream);
        }

        await this.videoElement.play();

        console.log("📹 Camera started");

        return true;
      } catch (err) {
        console.error("❌ Error accessing camera:", err);

        return false;
      }
    };

    // Stop camera stream
    const stopCamera = () => {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach((track) => track.stop());
        this.videoStream = null;

        console.log("🛑 Camera stopped");
      }

      if (this.renderInterval) {
        clearInterval(this.renderInterval);

        this.renderInterval = null;
        this.isCapturing = false;
      }

      clearFrame();

      // Clear cached palette when stopping
      this.cachedPalette = null;
    };

    // Render current video frame to blocks
    const renderFrame = async () => {
      if (!this.videoElement || !this.canvasElement || !this.isCapturing)
        return;

      const ctx = this.canvasElement.getContext("2d", {
        willReadFrequently: true,
      });

      // Draw video frame to canvas
      ctx.drawImage(this.videoElement, 0, 0, frameWidth, frameHeight);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
      const pixels = imageData.data;

      // Optimize colors if requested and not yet done
      if (this.currentConfig.optimizeColors && !this.colorsOptimized) {
        console.log("🎨 Optimizing colors for video feed...");
        const idealColors = await this.getIdealColorMapForPixels(
          pixels,
          frameWidth,
          frameHeight,
        );

        applyColorsToShadowHost(this.shadow, idealColors);

        this.cachedPalette = this.getBlockColorPalette();
        this.colorsOptimized = true;
      }

      // Use cached palette instead of rebuilding every frame!
      const palette = this.cachedPalette;
      if (!palette || palette.length === 0) {
        console.error("❌ No valid block colors available");

        return;
      }

      // Quantize pixels to blocks
      const paletteRGB = palette.map((p) => p.rgb);
      const updates = [];

      for (let py = 0; py < frameHeight; py++) {
        for (let px = 0; px < frameWidth; px++) {
          const i = (py * frameWidth + px) * 4;
          const alpha = pixels[i + 3];

          if (alpha < 128) {
            updates.push({
              x: x + px,
              y: y + (frameHeight - 1 - py),
              z,
              block: emptyBlock,
            });
            continue;
          }

          let r = pixels[i];
          let g = pixels[i + 1];
          let b = pixels[i + 2];

          // Apply gamma correction to brighten the image
          // Most cameras output in sRGB which looks dark when matched linearly
          const gammaValue = this.currentConfig.gamma;
          r = Math.pow(r / 255, 1 / gammaValue) * 255;
          g = Math.pow(g / 255, 1 / gammaValue) * 255;
          b = Math.pow(b / 255, 1 / gammaValue) * 255;

          const nearestRGB = nearestColor(paletteRGB, r, g, b);
          const blockInfo = palette.find(
            (p) =>
              p.rgb[0] === nearestRGB[0] &&
              p.rgb[1] === nearestRGB[1] &&
              p.rgb[2] === nearestRGB[2],
          );
          const blockId = blockInfo
            ? blockInfo.blockId
            : this.getBlockIdByName("Stone");

          updates.push({
            x: x + px,
            y: y + (frameHeight - 1 - py),
            z,
            block: blockId,
          });
        }
      }

      this.batchSetBlocks(updates);
    };

    // nearestColor helper
    const nearestColor = (palette, r, g, b) => {
      let minDist = Infinity;
      let nearest = palette[0];

      for (const rgb of palette) {
        const dr = r - rgb[0];
        const dg = g - rgb[1];
        const db = b - rgb[2];
        const dist = dr * dr + dg * dg + db * db;

        if (dist < minDist) {
          minDist = dist;
          nearest = rgb;
        }
      }

      return nearest;
    };

    // Start capturing frames
    const startCapture = async () => {
      if (this.isCapturing) {
        console.log("⚠️ Already capturing");

        return;
      }

      setupVideoElements();

      const started = await startCamera();

      if (!started) {
        return;
      }

      this.isCapturing = true;
      this.renderInterval = setInterval(
        renderFrame,
        1000 / this.currentConfig.fps,
      );
      console.log(`✅ Started capturing at ${this.currentConfig.fps} FPS`);
    };

    // Handle block break (button clicks)
    const onBlockBreak = (wx, wy, wz) => {
      // Check capture button
      if (
        wz === this.captureButtonRegion.z &&
        wx >= this.captureButtonRegion.x1 &&
        wx <= this.captureButtonRegion.x2 &&
        wy >= this.captureButtonRegion.y1 &&
        wy <= this.captureButtonRegion.y2
      ) {
        console.log("📹 Capture button clicked!");

        drawButtons();
        startCapture();

        return;
      }

      // Check stop button
      if (
        wz === this.stopButtonRegion.z &&
        wx >= this.stopButtonRegion.x1 &&
        wx <= this.stopButtonRegion.x2 &&
        wy >= this.stopButtonRegion.y1 &&
        wy <= this.stopButtonRegion.y2
      ) {
        console.log("🛑 Stop button clicked!");

        drawButtons();
        stopCamera();

        return;
      }
    };

    // Initialize
    drawBorder();
    clearFrame();
    drawButtons();

    console.log("✅ Video feed ready!");
    console.log("📹 Break GRASS blocks to START camera");
    console.log("🛑 Break ROSE blocks to STOP camera");

    return {
      onBlockBreak,
      startCapture,
      stopCamera,
      isCapturing: () => this.isCapturing,
      setFPS: (newFps) => {
        const clampedFps = Math.max(0.5, Math.min(30, newFps));
        this.currentConfig.fps = clampedFps;

        if (this.renderInterval) {
          clearInterval(this.renderInterval);
          this.renderInterval = setInterval(renderFrame, 1000 / clampedFps);
          console.log(`🎥 FPS updated to ${clampedFps}`);
        }
      },
      getFPS: () => this.currentConfig.fps,
      getResolution: () => ({ width: frameWidth, height: frameHeight }),
      getConfig: () => ({ ...this.currentConfig }),
      setGamma: (newGamma) => {
        const clampedGamma = Math.max(0.5, Math.min(3.0, newGamma));
        this.currentConfig.gamma = clampedGamma;
        console.log(
          `🔆 Gamma updated to ${clampedGamma.toFixed(2)} (1.0=none, higher=brighter)`,
        );
      },
      getGamma: () => this.currentConfig.gamma,
      refreshPalette: () => {
        this.cachedPalette = this.getBlockColorPalette();
        console.log(
          `🔄 Palette refreshed: ${this.cachedPalette.length} blocks available`,
        );
      },
      getPalette: () => this.cachedPalette,
      optimize: () => this.manualOptimize(),
    };
  }
}

export async function demo() {
  const api = new DrawVideo();

  await api.setFullscreen();

  console.log("📹 BlockGarden Demo: Live Video Feed");
  console.log("=".repeat(50));

  const worldWidth = api.config.WORLD_WIDTH?.get() ?? 64;
  const centerX = Math.floor(worldWidth / 2);

  // Enhanced default configuration with better presets
  const presets = {
    low: { width: 24, height: 18, fps: 1 },
    medium: { width: 48, height: 36, fps: 2 },
    high: { width: 64, height: 48, fps: 3 },
    ultra: { width: 80, height: 60, fps: 5 },
  };

  // Use medium preset by default
  const preset = presets.medium;

  api.videoFeed = api.createVideoFeed({
    x: centerX - Math.floor(preset.width / 2),
    y: 55,
    z: 25,
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    facingMode: "user",
    captureButtonBlock: api.getBlockIdByName("Grass"),
    stopButtonBlock: api.getBlockIdByName("Rose"),
    borderBlock: api.getBlockIdByName("Stone"),
    emptyBlock: api.getBlockIdByName("Ice"),
    showBorder: true,
    buttonSize: 4,
    buttonSpacing: 3,
  });

  const apiText = "blockGarden.demo.video.videoFeed";

  console.log("🎥 Video feed initialized!");
  console.log("=".repeat(50));
  console.log(`💡 Break GRASS blocks to start camera`);
  console.log(`💡 Break ROSE blocks to stop camera`);
  console.log("");
  console.log("⚙️  Configuration Commands:");
  console.log(`   ${apiText}.setFPS(n)        - Change frame rate (0.5-30)`);
  console.log(`   ${apiText}.getFPS()         - Get current FPS`);
  console.log(
    `   ${apiText}.setGamma(n)      - Adjust brightness (0.5-3.0, default 1.8)`,
  );
  console.log(`   ${apiText}.getGamma()       - Get current gamma`);
  console.log(
    `   ${apiText}.refreshPalette() - Reload block colors (if changed)`,
  );
  console.log(`   ${apiText}.getPalette()     - View available blocks`);
  console.log(`   ${apiText}.getResolution()  - Get current resolution`);
  console.log(`   ${apiText}.getConfig()      - Get all settings`);
  console.log(`   ${apiText}.isCapturing()    - Check capture status`);
  console.log(`   ${apiText}.optimize()       - Trigger color optimization`);
  console.log("");
  console.log("📊 Available Presets (edit demo() to use):");
  console.log(
    `   low:    ${presets.low.width}x${presets.low.height} @ ${presets.low.fps} FPS`,
  );
  console.log(
    `   medium: ${presets.medium.width}x${presets.medium.height} @ ${presets.medium.fps} FPS (current)`,
  );
  console.log(
    `   high:   ${presets.high.width}x${presets.high.height} @ ${presets.high.fps} FPS`,
  );
  console.log(
    `   ultra:  ${presets.ultra.width}x${presets.ultra.height} @ ${presets.ultra.fps} FPS`,
  );
  console.log("=".repeat(50));

  // Set up block break listener
  api.onBlockBreak((x, y, z) => {
    api.videoFeed.onBlockBreak(x, y, z);
  });

  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    video: api,
    presets, // Expose presets for reference
  };
}
