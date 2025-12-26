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

          #loadInput {
            padding-top: 0.5rem;
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

          .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.625rem;
            justify-content: end;
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

                [ <b>~ / &#96;</b> ]: Change Block<br />
                [ w / a / s / d ]: Move<br />
                [ arrow keys ]: Camera<br />
                [ shift ]: Descend<br />
                [ space ]: Jump / Ascend<br />
                [ enter / control ]: Place / Remove Block<br /><br />
                Use crosshair to center block placement<br />
                Click Game Canvas To Lock Mouse<br /><br />

                Left Click: Place Block<br />
                Right Click: Remove Block<br /><br />

                <a id="privacy" href="privacy/index.html" target="_blank">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--top-right">
            <div id="settings">
              <div class="ui-grid__corner--heading">⚙️ Settings</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div class="settings-actions">
                  <div id="resolution">
                    <block-garden-select id="resolutionSelect" value="400">
                      <block-garden-option value="400">400x400</block-garden-option>
                      <block-garden-option value="800">800x800</block-garden-option>
                      <block-garden-option value="fullscreen">Fullscreen</block-garden-option>
                    </block-garden-select>
                  </div>
                  <button
                    id="generateWorldButton"
                  >Generate World</button>
                  <button
                    id="randomPlantButton"
                  >Plant randomly</button>
                  <button
                    id="fastGrowthButton"
                  >Enable Fast Growth</button>
                  <button
                    id="togglePrePlanting"
                  >Disable Pre-Planting</button>
                  <button
                    id="toggleTouchControls"
                  >Disable Touch Controls</button>
                  <button
                    id="saveWorld"
                  >💾 Save</button>
                  <input
                    accept=".json.gz"
                    id="loadInput"
                    type="file"
                  />
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

        <div class="touch-controls" hidden="hidden">
          <div class="dpad-container">
            <div class="dpad">
              <div class="touch-btn up-left" data-key="upleft">↖</div>
              <div class="touch-btn up" data-key="w">↑</div>
              <div class="touch-btn up-right" data-key="upright">↗</div>

              <div class="touch-btn left" data-key="a">←</div>
              <div class="touch-btn middle" data-key="backquote">📦</div>
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
  async disconnectedCallback() {}
}

if (!globalThis.customElements?.get(tagName)) {
  globalThis.customElements?.define(tagName, BlockGarden);
}
