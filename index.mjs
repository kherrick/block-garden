import { autoSaveGame } from "./src/dialog/storage.mjs";
import { colors as gameColors } from "./src/state/config/colors.mjs";
import { generateColorVars } from "./src/util/colors/generateColorVars.mjs";
import { initGame } from "./src/init/game.mjs";

import "./src/components/select.mjs";

export const tagName = "block-garden";

/**
 * @extends HTMLElement
 */
export class BlockGarden extends HTMLElement {
  constructor() {
    super();

    if (!this.shadowRoot) {
      const template = globalThis.document.createElement("template");

      template.innerHTML = `
        <style>
          [hidden] {
            display: none !important;
          }

          :focus {
            outline: none;
          }

          :host {
            align-items: center;
            display: flex;
            height: var(--bg-ui-host-height, 100vh);
            height: var(--bg-ui-host-height, 100dvh);
            justify-content: center;
            overflow: var(--bg-ui-host-overflow, hidden);
            position: relative;
            width: var(--bg-ui-host-width, 100vw);
            width: var(--bg-ui-host-width, 100dvw);

            ${generateColorVars("--bg-color-", gameColors["color"])}
            ${generateColorVars("--bg-block-", gameColors["block"])}
            ${generateColorVars("--bg-ui-", gameColors["ui"])}
            touch-action: none;
          }

          canvas {
            background-color: var(--bg-color-black);
            height: 25rem;
            width: 25rem;
            touch-action: none;
          }

          .ui-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            height: var(--bg-ui-grid-height, calc(100vh - 1rem));
            height: var(--bg-ui-grid-height, calc(100dvh - 1rem));
            margin: 0.5rem;
            pointer-events: none;
            position: absolute;
            top: 0;
            width: var(--bg-ui-grid-width, calc(100vw - 1rem));
            width: var(--bg-ui-grid-width, calc(100dvw - 1rem));
          }

          .ui-grid__corner {
            max-height: var(--bg-ui-grid-corner-max-height, calc(100vh - 1rem));
            max-height: var(--bg-ui-grid-corner-max-height, calc(100dvh - 1rem));
            overflow-y: auto;
            pointer-events: auto;
            transition: height 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.5);
          }

          .ui-grid__corner--heading {
            color: var(--bg-ui-grid-corner-heading-color);
            backdrop-filter: blur(0.3125rem);
            background-color: var(--bg-ui-grid-corner-heading-background-color);
            border-radius: 0.5rem;
            border-width: 0.0625rem;
            border-style: solid;
            border-color: var(--bg-ui-grid-corner-heading-border-color);
            cursor: pointer;
            font-size: 0.75rem;
            padding: 0.75rem;
          }

          .ui-grid__corner--container {
            color: var(--bg-ui-grid-corner-container-color);
            padding: 0.5rem;
          }

          .ui-grid__corner--sub-heading {
            color: var(--bg-ui-grid-corner-heading-color);
            margin: 1rem 0 0.3125rem 0;
          }

          .ui-grid__corner--sub-section {
            overflow: auto;
          }

          .ui-grid__corner {
            scrollbar-width: thin; /* Slim scrollbar */
            scrollbar-color: var(--bg-color-gray-700) var(--bg-color-stone-100); /* Handle and track colors */
          }

          .ui-grid__corner::-webkit-scrollbar {
            width: 0.625rem; /* Custom width */
          }

          .ui-grid__corner::-webkit-scrollbar-track {
            background: var(--bg-color-stone-100); /* Track background */
          }

          .ui-grid__corner::-webkit-scrollbar-thumb {
            background: var(--bg-color-gray-700); /* Handle color */
            border-radius: 0.625rem; /* Rounded edges */
            border: 0.125rem solid var(--bg-color-stone-100); /* Padding around handle */
          }

          .ui-grid__corner::-webkit-scrollbar-thumb:hover {
            background: var(--bg-color-neutral-950); /* Highlight on hover */
          }

          /* Element modifiers for sticky corners */
          .ui-grid__corner--top-left {
            align-self: start;
            grid-column: 1;
            grid-row: 1;
            justify-self: start;
          }

          .ui-grid__corner--top-right {
            align-self: start;
            grid-column: 2;
            grid-row: 1;
            justify-self: end;
            z-index: 1;
          }

          .ui-grid__corner--bottom-left {
            align-self: end;
            grid-column: 1;
            grid-row: 2;
            justify-self: start;
          }

          .ui-grid__corner--bottom-right {
            align-self: end;
            grid-column: 2;
            grid-row: 2;
            justify-self: end;
            max-width: 15.625rem;
          }

          /* Center position for material button */
          .ui-grid__corner--center {
            align-self: start;
            grid-column: 1 / 3;
            grid-row: 1 / 3;
            justify-self: center;
            max-height: 80dvh;
            max-height: 80vh;
            max-width: 90dvw;
            max-width: 90vw;
            z-index: 100;
          }

          /* Material Button */
          #material {
            backdrop-filter: blur(0.3125rem);
            background: var(--bg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--bg-color-gray-alpha-10);
            color: var(--bg-color-white);
            font-size: 0.5625rem;
          }

          .materialBar {
            backdrop-filter: blur(0.3125rem);
            background: var(--bg-color-black-alpha-60);
            border-radius: 0.3125rem;
            border: 0.125rem solid var(--bg-color-gray-alpha-30);
            bottom: 1rem;
            display: flex;
            gap: 0.3125rem;
            left: 50%;
            max-width: 95%;
            overflow: hidden;
            padding: 0.3125rem;
            pointer-events: auto;
            position: absolute;
            transform: translateX(-50%);
            z-index: 50;
          }

          .materialBar-slot {
            align-items: center;
            background-color: var(--bg-color-black-alpha-60);
            border: 0.125rem solid var(--bg-color-gray-600);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            font-size: 0.5rem;
            gap: 0.25rem;
            height: 3rem;
            justify-content: center;
            padding: 0.25rem;
            position: relative;
            transition: all 0.1s;
            width: 3rem;
          }

          .materialBar-slot-cube {
            height: 1.5rem;
            perspective: 1000px;
            position: relative;
            transform-style: preserve-3d;
            transform: rotateX(20deg) rotateY(-30deg);
            width: 1.5rem;
          }

          .materialBar-cube-face {
            border: 0.0625rem solid rgba(0, 0, 0, 0.3);
            height: 1.5rem;
            position: absolute;
            width: 1.5rem;
          }

          .materialBar-cube-front {
            transform: translateZ(0.75rem);
          }

          .materialBar-cube-top {
            filter: brightness(1.2);
            transform: rotateX(90deg) translateZ(0.75rem);
          }

          .materialBar-cube-right {
            filter: brightness(0.8);
            transform: rotateY(90deg) translateZ(0.75rem);
          }

          .materialBar-slot-name {
            color: var(--bg-color-white);
            font-size: 0.5rem;
            line-height: 1;
            max-width: 2.5rem;
            text-align: center;
            text-shadow: 0 0 2px black;
            word-break: break-word;
          }

          .materialBar-slot.active {
            border-color: var(--bg-color-white);
            box-shadow: 0 0 0.625rem rgba(255, 255, 255, 0.2);
            transform: scale(1.15);
            z-index: 10;
          }

          .materialBar-slot:hover {
            border-color: var(--bg-color-gray-400);
          }

          .materialBar-slot-number {
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 0.125rem;
            color: white;
            font-size: 0.375rem;
            padding: 0.0625rem 0.125rem;
            position: absolute;
            right: 0.125rem;
            text-shadow: 0 0 2px black;
            top: 0.125rem;
            z-index: 1;
          }

          #stats,
          #settings,
          .seed-controls {
            font-size: 0.5625rem;
          }

          #generateWithSeed {
            background: var(--bg-color-blue-400);
          }

          #randomSeed {
            background: var(--bg-color-amber-500);
          }

          #copySeed {
            background: var(--bg-color-emerald-700);
          }

          .seed-controls button {
            border-radius: 0.1875rem;
            border: none;
            color: var(--bg-color-white);
            cursor: pointer;
            font-size: 0.75rem;
            padding: 0.3125rem 0.625rem;
          }

          .seed-controls button:hover {
            opacity: 0.8;
            transform: translateY(-0.0625rem);
          }

          .seed-controls button:active {
            transform: translateY(0);
          }

          .current-seed {
            color: var(--bg-color-gray-600);
            font-size: 0.6875rem;
            margin-top: 0.5rem;
          }

          .seed-controls {
            background: rgba(0, 0, 0, 0.7);
            border-radius: 0.3125rem;
            bottom: 2rem;
            color: var(--bg-color-white);
            margin: 0.625rem 0;
            padding: 0.625rem;
            position: absolute;
            z-index: 2;
          }

          .seed-controls__actions {
            align-items: center;
            display: flex;
            flex-wrap: wrap;
            gap: 0.625rem;
          }

          .seed-controls__header {
            display: flex;
            gap: 0.625rem;
            justify-content: space-between;
            margin-bottom: 0.625rem;
          }

          .seed-controls h4, .seed-controls__header h4 {
            color: var(--bg-color-white);
            margin: 0 0 0.625rem 0;
          }

          .seed-controls__header button {
            background: var(--bg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: white;
            cursor: pointer;
            margin: 0 0 0.625rem 0;
            padding: 0.3125rem 0.625rem;
          }

          .seed-controls input {
            font-size: 0.75rem;
            margin-left: 0.3125rem;
            padding: 0.125rem 0.3125rem;
            width: 5rem;
            font-size: 0.5rem;
          }

          .seed-controls input:focus {
            outline: 0.125rem solid var(--bg-color-blue-400);
          }

          .seed-controls__save-load {
            display: flex;
            flex-direction: column;
            margin-bottom: 0.5rem;
          }

          #saveModeToggle {
            background: var(--bg-color-blue-500);
          }

          .examples {
            background: var(--bg-color-white);
            line-height: 1.5;
            overflow: auto;
            padding: 0.5rem 1rem 1rem 2rem;
          }

          .about,
          .examples,
          .privacy {
            background: var(--bg-color-white);
            line-height: 1.5;
            overflow: auto;
            padding: 0.5rem 1rem 1rem 2rem;
          }

          dialog.about-content,
          dialog.examples-content,
          dialog.privacy-content {
            background: var(--bg-color-gray-50);
            border-radius: 0.5rem;
            border: 0.125rem solid var(--bg-color-gray-900);
            color: var(--bg-color-gray-900);
            font-family: monospace;
            line-height: 1.5;
            max-height: 80vh;
            max-height: 80dvh;
            max-width: 50rem;
            width: 90%;
          }

          .about-content li,
          .examples-content li,
          .privacy-content li {
            margin: 0.25rem 0;
          }

          .about-content_header,
          .examples-content_header,
          .privacy-content_header {
            align-items: center;
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding-top: 1rem;
          }

          .about-content_close-btn,
          .examples-content_close-btn,
          .privacy-content_close-btn {
            background: var(--bg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--bg-color-white);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem 1rem;
          }

          .about-controls {
            background: var(--bg-color-gray-300);
            border-radius: 0.25rem;
            list-style-type: none;
            margin-bottom: 1.5rem;
            margin-top: 0.5rem;
            padding: 1rem;
          }

          /* Mobile Responsive */
          @media (min-width: 30rem) {
            .ui-grid__corner--heading {
              font-size: 1rem;
            }

            #stats,
            #settings {
              font-size: 0.725rem;
            }
          }

          @media (min-width: 48rem) {
            .ui-grid__corner--heading {
              font-size: 1.25rem;
            }

            #stats,
            #settings {
              font-size: 1.25rem;
            }
          }

          /* Stats Panel */
          #stats {
            backdrop-filter: blur(0.3125rem);
            background: var(--bg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--bg-color-gray-alpha-10);
            color: var(--bg-color-white);
          }

          /* Settings Panel */
          #settings {
            backdrop-filter: blur(0.3125rem);
            background: var(--bg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--bg-color-gray-alpha-10);
            color: var(--bg-color-white);
            display: flex;
            flex-direction: column;
            position: relative;
          }

          #settings .settings-actions {
            display: flex;
            flex-direction: column;
          }

          #settings button {
            width: 100%;
          }

          .info-buttons-container {
            border-top: 0.0625rem solid var(--bg-color-gray-500);
            margin-top: 0.9375rem;
            padding-top: 0.625rem;
          }

          #aboutBtn,
          #privacyBtn {
            border-radius: 0.25rem;
            border: none;
            color: var(--bg-color-white);
            cursor: pointer;
            margin: 0.25rem;
            padding: 0.5rem 1rem;
            width: calc(100% - 0.5rem);
          }

          #aboutBtn {
            background: var(--bg-color-green-500);
          }

          #privacyBtn {
            background: var(--bg-color-blue-500);
          }

          #resolution {
            display: block;
            margin: 0 0  0.25rem 0.125rem;
            width: 100%;
            position: relative;
          }

          .resolution-400 #canvas {
            border: 0.125rem solid var(--bg-color-gray-900);
            height: 25rem;
            margin: auto;
            width: 25rem;
          }

          .resolution-800 #canvas {
            border: 0.125rem solid (var(--bg-color-gray-900));
            height: 50rem;
            margin: auto;
            width: 50rem;
          }

          /* Touch Controls */
          .touch-controls {
            bottom: var(--bg-ui-touch-controls-bottom, 2rem);
            position: var(--bg-ui-touch-controls-position, absolute);
            width: var(--bg-ui-touch-controls-width, 100%);
            touch-action: none;
            pointer-events: none;
          }

          .touch-btn {
            align-items: center;
            backdrop-filter: blur(0.3125rem);
            background: var(--bg-ui-touch-btn-background-color);
            border-radius: 50%;
            border: 0.125rem solid var(--bg-ui-touch-btn-border-color);
            color: var(--bg-ui-touch-btn-color);
            cursor: pointer;
            display: inline-flex;
            font-size: 0.7rem;
            height: 3.25rem;
            justify-content: center;
            padding: 0.125rem;
            pointer-events: auto;
            touch-action: manipulation;
            user-select: none;
            width: 3.25rem;
            z-index: 3;
          }

          .touch-btn:active {
            background: var(--bg-color-gray-alpha-20);
            transform: scale(0.95);
          }

          #toastContainer {
            align-items: center;
            bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            left: 50%;
            max-height: var(--bg-ui-toast-container-max-height);
            max-width: 90vw;
            max-width: 90dvw;
            overflow-y: var(--bg-ui-toast-container-overflow-y);
            pointer-events: none;
            position: fixed;
            transform: translateX(-50%);
            z-index: 9999;
          }

          .toast {
            align-items: flex-start;
            animation: toastSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            backdrop-filter: blur(0.5rem);
            background: var(--bg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.125rem solid var(--bg-color-gray-alpha-30);
            box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
            color: var(--bg-color-white);
            display: flex;
            font-family: monospace;
            font-size: 0.875rem;
            gap: 0.75rem;
            justify-content: space-between;
            max-width: 25rem;
            min-width: 15rem;
            padding: 0.75rem 1rem;
            pointer-events: auto;
            position: relative;
            text-align: center;
          }

          .toast--fade-out {
            animation: toastFadeOut 0.2s ease-out forwards;
          }

          .toast--slide-out {
            animation: toastSlideOut 0.2s ease-out forwards;
          }

          .toast__content {
            flex: 1;
            line-height: 1.4;
          }

          .toast__close-btn {
            background: var(--bg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--bg-color-white);
            cursor: pointer;
            font-size: 1rem;
            height: 1.5rem;
            line-height: 1;
            padding: 0;
            transition: background 0.2s;
            width: 1.5rem;
          }

          .toast__close-btn:hover {
            background: var(--bg-color-red-500);
            opacity: 0.8;
          }

          .toast__close-btn:active {
            transform: scale(0.95);
          }

          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: translateY(100%);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes toastFadeOut {
            from {
              opacity: 1;
            }

            to {
              opacity: 0;
            }
          }

          @keyframes toastSlideOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }

            to {
              opacity: 0;
              transform: translateY(100%);
            }
          }

          .dpad-container {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 0 1rem 1rem 0.5rem;
          }

          .dpad {
            display: grid;
            gap: 0.3125rem;
            grid-template-columns: 3.125rem 3.125rem 3.125rem;
            grid-template-rows: 3.125rem 3.125rem 3.125rem;
            justify-content: left;
            position: relative;
            z-index: 3;
          }

          .dpad .up-left {
            grid-column: 1;
            grid-row: 1;
            margin-left: 0.5rem;
            margin-top: 0.5rem;
            padding: 0;
            z-index: 4;
          }

          .dpad .up {
            grid-column: 2;
            grid-row: 1;
          }

          .dpad .up-right {
            grid-column: 3;
            grid-row: 1;
            margin-right: 0.5rem;
            margin-top: 0.5rem;
            padding: 0;
            z-index: 4;
          }

          .dpad .left {
            grid-column: 1;
            grid-row: 2;
            margin-top: 0.125rem;
          }

          .dpad .middle {
            grid-column: 2;
            grid-row: 2;
            z-index: 2;
          }

          .dpad .right {
            grid-column: 3;
            grid-row: 2;
            margin-top: 0.125rem;
          }

          .dpad .down-left {
            grid-column: 1;
            grid-row: 3;
            margin-bottom: 0.5rem;
            margin-left: 0.5rem;
            padding: 0;
            z-index: 4;
          }

          .dpad .down {
            grid-column: 2;
            grid-row: 3;
          }

          .dpad .down-right {
            grid-column: 3;
            grid-row: 3;
            margin-bottom: 0.5rem;
            margin-right: 0.5rem;
            padding: 0;
            z-index: 4;
          }

          /* Button Styles */
          button {
            background: var(--bg-color-green-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--bg-color-white);
            cursor: pointer;
            font-size: 0.625rem;
            margin: 0.125rem;
            padding: 0.375rem 0.75rem;
            transition: background 0.2s;
          }

          button:hover,
          button:focus {
            outline: none;
          }

          button:active {
            transform: scale(0.95);
          }

          #privacy {
            color: var(--bg-color-white);
          }
        </style>
        <canvas id="canvas" tabindex="0"></canvas>
        <div id="ui-grid" class="ui-grid">
          <div class="ui-grid__corner ui-grid__corner--top-left">
            <div id="stats">
              <div class="ui-grid__corner--heading">🌱 Block Garden</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                Block: <span id="blockName"></span><br /><br />

                [ w / a / s / d ]: Move<br />
                [ arrow keys ]: Camera<br />
                [ shift ]: Descend<br />
                [ space ]: Jump / Ascend<br />
                [ enter ]: Place / Remove Block<br /><br />

                [ <b>~ / &#96;</b> ]: Change Block<br />
                [ e ]: Open Inventory<br /><br />

                Use crosshair to center block placement<br />
                Click Game Canvas To Lock Mouse<br /><br />

                Left Click: Place Block<br />
                Right Click: Remove Block<br /><br />

                <div class="info-buttons-container">
                  <button id="aboutBtn">ℹ️ About</button>
                  <button id="privacyBtn">🔒 Privacy</button>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--center" id="materialsPanel">
            <div id="material">
              <div class="ui-grid__corner--heading">🔍 Material</div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--top-right">
            <div id="settings">
              <div class="ui-grid__corner--heading">⚙️ Settings</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div class="settings-actions">
                  <div id="resolution">
                    <block-garden-select id="resolutionSelect" value="600">
                      <block-garden-option value="400">400x400</block-garden-option>
                      <block-garden-option value="600">600x600</block-garden-option>
                      <block-garden-option value="800">800x800</block-garden-option>
                      <block-garden-option value="fullscreen">Fullscreen</block-garden-option>
                    </block-garden-select>
                  </div>
                  <button id="worldState">🌍 World State</button>
                  <button id="randomPlantButton">Plant randomly</button>
                  <button id="fastGrowthButton">Enable Fast Growth</button>
                  <button id="toggleTouchControls">Disable Touch Controls</button>
                  <button id="toggleSplitControls">Enable Split Controls</button>
                  <button
                    onclick="if (confirm('Reloading will lose unsaved progress. Do you want to continue?')) { window.location.reload(); }">
                    Reload Game
                  </button>
                  <div id="customizeColorsBtnContainer" hidden="hidden">
                    <div class="ui-grid__corner--sub-heading">🗺️ Colors</div>

                    <button id="customizeColorsBtn">Customize</button>
                  </div>
                  <div id="examplesBtnContainer" hidden="hidden">
                    <div class="ui-grid__corner--sub-heading">🗺️ Examples</div>
                    <button id="examplesBtn">
                      📝 <span id="examplesBtnText">Open</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--bottom-left" hidden="hidden">
            <div class="ui-grid__corner--heading">
              <div class="ui-grid__corner--container" hidden="hidden"></div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--bottom-right" hidden="hidden">
            <div class="ui-grid__corner--heading">
              <div class="ui-grid__corner--container" hidden="hidden"></div>
            </div>
          </div>
        </div>

        <div class="seed-controls" hidden="hidden">
          <div class="seed-controls__header">
            <h4>World Generation</h4>
            <button id="closeWorldGeneration">
              &times;
            </button>
          </div>
          <div class="seed-controls__actions">
            <label>
              Seed:
              <input id="worldSeedInput" placeholder="Enter seed..." type="number" />
            </label>

            <button id="generateWithSeed">Generate</button>
            <button id="randomSeed">Random</button>
            <button id="copySeed">Copy Seed</button>
          </div>

          <div class="current-seed">
            <p>Current seed: <span id="currentSeed"></span></p>
          </div>

          <h4>Store / Save / Load</h4>

          <div class="seed-controls__save-load">
            <button id="openStorageBtn">🗄️ Open Game Storage</button>
            <button id="saveExternalGameFile">🗃️ Save Game File To Disk</button>
            <button id="loadExternalGameFile">💾 Load Game File From Disk</button>
          </div>

          <h4 class="seed-controls__header seed-controls--share" hidden>Share</h4>

          <div class="seed-controls__save-load seed-controls--share" hidden>
            <button id="shareExternalGameFile">🌍 Share Game File From Disk</button>
          </div>

          <h4>Mode</h4>

          <div class="seed-controls__save-load">
            <button id="saveModeToggle">Save Mode Auto</button>
          </div>
        </div>

        <div class="touch-controls" hidden="hidden">
          <div class="dpad-container">
            <div class="dpad">
              <div class="touch-btn up-left" data-key="upleft">↖</div>
              <div class="touch-btn up" data-key="w">↑</div>
              <div class="touch-btn up-right" data-key="upright">↗</div>

              <div class="touch-btn left" data-key="a">←</div>
              <div class="touch-btn middle" data-key="e">📦</div>
              <div class="touch-btn right" data-key="d">→</div>

              <div class="touch-btn down-left" data-key="downleft">↙</div>
              <div class="touch-btn down" data-key="s">↓</div>
              <div class="touch-btn down-right" data-key="downright">↘</div>
            </div>
            <div class="dpad">
              <div class="up-left"></div>
              <div id="fly" class="touch-btn up" data-key=" " hidden="hidden">↑</div>
              <div class="up-right"></div>

              <div id="dig" class="touch-btn left" data-key="backspace">⛏️</div>
              <div id="jump" class="touch-btn middle" data-key=" ">
                🦘
              </div>
              <div class="right"></div>

              <div class="down-left"></div>
              <div id="descend" class="touch-btn down" data-key="shift" hidden="hidden">↓</div>
              <div class="down-right"></div>
            </div>
          </div>
        </div>

        <div id="materialBar" class="materialBar" hidden="hidden"></div>

        <div id="toastContainer"></div>
      `;

      // Attach open shadow root
      const shadow = this.attachShadow({ mode: "open" });

      // Clone the template content and append to shadow root
      shadow.appendChild(template.content.cloneNode(true));
    }
  }

  /** @returns {Promise<void>} */
  async connectedCallback() {
    const shadow = this.shadowRoot;
    const canvas = shadow.querySelector("canvas");

    await initGame(globalThis, shadow, canvas);
  }

  /** @returns {Promise<void>} */
  async disconnectedCallback() {
    await autoSaveGame(globalThis);
  }
}

if (!globalThis.customElements?.get(tagName)) {
  globalThis.customElements?.define(tagName, BlockGarden);
}
