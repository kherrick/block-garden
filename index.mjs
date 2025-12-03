import { autoSaveGame } from "./src/dialog/storage.mjs";
import { colors as gameColors } from "./src/state/config/colors.mjs";
import { generateColorVars } from "./src/util/colors/generateColorVars.mjs";
import { initGame } from "./src/init/game.mjs";

export const tagName = "sprite-garden";

/**
 * @extends HTMLElement
 */
export class SpriteGarden extends HTMLElement {
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
            height: var(--sg-ui-host-height, 100vh);
            height: var(--sg-ui-host-height, 100dvh);
            justify-content: center;
            overflow: var(--sg-ui-host-overflow, hidden);
            position: relative;
            width: var(--sg-ui-host-width, 100vw);
            width: var(--sg-ui-host-width, 100dvw);

            ${generateColorVars("--sg-color-", gameColors["color"])}
            ${generateColorVars("--sg-tile-", gameColors["tile"])}
            ${generateColorVars("--sg-ui-", gameColors["ui"])}
          }

          #canvas {
            object-fit: cover;
            background: var(--sg-color-black);
            display: block;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-crisp-edges;
            image-rendering: crisp-edges;
            position: absolute;
          }

          #loading {
            animation: pulseSpin 1.8s infinite;
            height: 11rem;
            image-rendering: pixelated;
            position: relative;
            width: 11rem;
            z-index: 1;
          }

          #loading .pixel {
            background: var(--sg-tile-loading-pixel-color);
            height: 4rem;
            position: absolute;
            width: 4rem;
          }

          .pixel-one {
            top: 0;
            left: 4rem;
          }

          .pixel-two {
            top: 1rem;
            left: 1rem;
          }

          .pixel-three {
            top: 1rem;
            left: 7rem;
          }

          .pixel-four {
            top: 4rem;
            left: 0;
          }

          .pixel-five {
            top: 4rem;
            left: 8rem;
          }

          .pixel-six {
            top: 7rem;
            left: 1rem;
          }

          .pixel-seven {
            top: 7rem;
            left: 7rem;
          }

          .pixel-eight {
            top: 8rem;
            left: 4rem;
          }

          .pixel-nine {
            top: 4rem;
            left: 4rem;
          }

          @keyframes pulseSpin {
            0% {
              transform: scale(0.05) rotate(0deg);
              opacity: 0;
            }
            50% {
              transform: scale(1) rotate(-180deg);
              opacity: 1;
            }
            100% {
              transform: scale(0.05) rotate(-360deg);
              opacity: 0;
            }
          }

          .ui-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            height: var(--sg-ui-grid-height, calc(100vh - 1rem));
            height: var(--sg-ui-grid-height, calc(100dvh - 1rem));
            margin: 0.5rem;
            pointer-events: none;
            position: absolute;
            top: 0;
            width: var(--sg-ui-grid-width, calc(100vw - 1rem));
            width: var(--sg-ui-grid-width, calc(100dvw - 1rem));
          }

          .ui-grid__corner {
            max-height: var(--sg-ui-grid-corner-max-height, calc(100vh - 1rem));
            max-height: var(--sg-ui-grid-corner-max-height, calc(100dvh - 1rem));
            overflow-y: auto;
            pointer-events: auto;
            transition: height 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.5);
          }

          .ui-grid__corner--heading {
            color: var(--sg-ui-grid-corner-heading-color);
            backdrop-filter: blur(0.3125rem);
            background-color: var(--sg-ui-grid-corner-heading-background-color);
            border-radius: 0.5rem;
            border-width: 0.0625rem;
            border-style: solid;
            border-color: var(--sg-ui-grid-corner-heading-border-color);
            cursor: pointer;
            font-size: 0.75rem;
            padding: 0.75rem;
          }

          .ui-grid__corner--container {
            color: var(--sg-ui-grid-corner-container-color);
            padding: 0.5rem;
          }

          #controls .ui-grid__corner--container {
            cursor: pointer;
          }

          .ui-grid__corner--sub-heading {
            color: var(--sg-ui-grid-corner-heading-color);
            margin: 1rem 0 0.3125rem 0;
          }

          .ui-grid__corner--sub-section {
            overflow: auto;
          }

          .ui-grid__corner {
            scrollbar-width: thin; /* Slim scrollbar */
            scrollbar-color: var(--sg-color-gray-700) var(--sg-color-stone-100); /* Handle and track colors */
          }

          .ui-grid__corner::-webkit-scrollbar {
            width: 0.625rem; /* Custom width */
          }

          .ui-grid__corner::-webkit-scrollbar-track {
            background: var(--sg-color-stone-100); /* Track background */
          }

          .ui-grid__corner::-webkit-scrollbar-thumb {
            background: var(--sg-color-gray-700); /* Handle color */
            border-radius: 0.625rem; /* Rounded edges */
            border: 0.125rem solid var(--sg-color-stone-100); /* Padding around handle */
          }

          .ui-grid__corner::-webkit-scrollbar-thumb:hover {
            background: var(--sg-color-neutral-950); /* Highlight on hover */
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

          #stats,
          #controls,
          #settings,
          #inventory,
          .seed-controls {
            font-size: 0.5625rem;
          }

          /* Stats Panel */
          #stats {
            backdrop-filter: blur(0.3125rem);
            background: var(--sg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--sg-color-gray-alpha-10);
            color: var(--sg-color-white);
          }

          /* Settings Panel */
          #settings {
            backdrop-filter: blur(0.3125rem);
            background: var(--sg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--sg-color-gray-alpha-10);
            color: var(--sg-color-white);
            display: flex;
            flex-direction: column;
            position: relative;
          }

          #settings .settings-actions {
            display: flex;
            flex-direction: column;
          }

          #settings #resolution,
          #settings select,
          #settings button {
            width: 100%;
          }

          .map-editor-controls_header,
          .map-editor-controls-section_header {
            margin-bottom: 0.3125rem;
          }

          .map-editor-controls-section {
            margin-top: 0.3125rem;
          }

          .map-editor-controls-section_buttons-container {
            display: grid;
            gap: 0.125rem;
            grid-template-columns: repeat(4, 1fr);
            margin-bottom: 0.625rem;
          }

          /* Inventory Panel */
          #inventory {
            backdrop-filter: blur(0.3125rem);
            background: var(--sg-color-black-alpha-80);
            border-radius: 0.5rem;
            border-top: 0.0625rem solid var(--sg-color-gray-500);
            border: 0.0625rem solid var(--sg-color-gray-alpha-10);
            bottom: 1.625rem;
            color: var(--sg-color-white);
          }

          /* Controls Panel */
          #controls {
            backdrop-filter: blur(0.3125rem);
            background: var(--sg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.0625rem solid var(--sg-color-gray-alpha-10);
            color: var(--sg-color-white);
          }

          .control-instruction {
            padding: 0.25rem 0;
          }

          .control-instruction_icon-container {
            align-items: center;
            display: flex;
          }

          .control-instruction_icon-container svg {
            padding-right: 0.25rem;
          }

          .touch-controls {
            bottom: var(--sg-ui-touch-controls-bottom, 6rem);
            position: var(--sg-ui-touch-controls-position, absolute);
            width: var(--sg-ui-touch-controls-width, 100%);
          }

          .touch-btn {
            align-items: center;
            backdrop-filter: blur(0.3125rem);
            background: var(--sg-ui-touch-btn-background-color);
            border-radius: 50%;
            border: 0.125rem solid var(--sg-ui-touch-btn-border-color);
            color: var(--sg-ui-touch-btn-color);
            cursor: pointer;
            display: inline-flex;
            font-size: 0.7rem;
            height: 3.25rem;
            justify-content: center;
            padding: 0.125rem;
            touch-action: manipulation;
            user-select: none;
            width: 3.25rem;
            z-index: 3;
          }

          .touch-btn:active {
            background: var(--sg-color-gray-alpha-20);
            transform: scale(0.95);
          }

          #toastContainer {
            align-items: center;
            bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            left: 50%;
            max-height: var(--sg-ui-toast-container-max-height);
            max-width: 90vw;
            max-width: 90dvw;
            overflow-y: var(--sg-ui-toast-container-overflow-y);
            pointer-events: none;
            position: fixed;
            transform: translateX(-50%);
            z-index: 9999;
          }

          .toast {
            align-items: flex-start;
            animation: toastSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            backdrop-filter: blur(0.5rem);
            background: var(--sg-color-black-alpha-80);
            border-radius: 0.5rem;
            border: 0.125rem solid var(--sg-color-gray-alpha-30);
            box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
            color: var(--sg-color-white);
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
            background: var(--sg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--sg-color-white);
            cursor: pointer;
            font-size: 1rem;
            height: 1.5rem;
            line-height: 1;
            padding: 0;
            transition: background 0.2s;
            width: 1.5rem;
          }

          .toast__close-btn:hover {
            background: var(--sg-color-red-500);
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
            margin-left: 0.125rem;
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
            margin-left: 0.125rem;
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
          button,
          select {
            background: var(--sg-color-green-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--sg-color-white);
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

          select {
            background: var(--sg-color-gray-900);
            border: 0.0625rem solid var(--sg-color-neutral-950);
          }

          select:focus {
            outline: 0.125rem solid var(--sg-color-green-500);
          }

          .material-btn,
          .seed-btn {
            border: 0.0625rem solid var(--sg-color-black);
            cursor: pointer;
            font-size: 0.5625rem;
            margin: 0.125rem;
            padding: 0.25rem 0.5rem;
          }

          .material-btn {
            background: var(--sg-color-gray-100);
            color: var(--sg-color-black);
          }

          .material-btn--cloud,
          .material-btn--grass,
          .material-btn--ice,
          .material-btn--iron,
          .material-btn--pumice,
          .material-btn--sand,
          .material-btn--snow {
            background: var(--sg-color-gray-800);
            color: var(--sg-color-white);
          }

          .material-btn:hover {
            background: var(--sg-color-gray-alpha-10);
            color: var(--sg-color-white);
          }

          .material-btn.selected,
          .seed-btn.selected {
            border: 0.125rem solid var(--sg-color-sky-50);
            outline: 0.125rem solid var(--sg-color-blue-500);
          }

          .seed-btn:hover {
            background: var(--sg-color-amber-900);
            color: var(--sg-color-white);
          }

          .seed-btn {
            background: var(--sg-color-amber-800);
            color: var(--sg-color-white);
          }

          .seed-btn--berry-bush {
            background: var(--sg-tile-berry-bush-color);
          }

          .seed-btn--bamboo {
            background: var(--sg-tile-bamboo-color);
            color: var(--sg-color-black);
          }

          .seed-btn--sunflower {
            background: var(--sg-tile-sunflower-color);
            color: var(--sg-color-black);
          }

          .seed-btn--corn {
            background: var(--sg-tile-corn-color);
            color: var(--sg-color-black);
          }

          .seed-btn--pine-tree {
            background: var(--sg-tile-pine-tree-color);
          }

          .seed-btn--willow-tree {
            background: var(--sg-tile-willow-tree-color);
            color: var(--sg-color-black);
          }

          .seed-btn--fern {
            background: var(--sg-tile-fern-color);
            color: var(--sg-color-black);
          }

          .seed-btn--tulip {
            background: var(--sg-tile-tulip-color);
          }

          .seed-btn--agave {
            color: var(--sg-color-black);
            background: var(--sg-tile-agave-color);
          }

          .seed-btn--lavender {
            background: var(--sg-tile-lavender-color);
          }

          .seed-btn--kelp {
            background: var(--sg-tile-kelp-color);
          }

          .seed-btn--rose {
            background: var(--sg-tile-rose-color);
          }

          .seed-btn--pumpkin {
            background: var(--sg-tile-pumpkin-color);
          }

          .seed-btn--lotus {
            color: var(--sg-color-black);
            background: var(--sg-tile-lotus-color);
          }

          .seed-btn--birch {
            color: var(--sg-color-black);
            background: var(--sg-tile-birch-color);
          }

          .info-buttons-container {
            border-top: 0.0625rem solid var(--sg-color-gray-500);
            margin-top: 0.9375rem;
            padding-top: 0.625rem;
          }

          #aboutBtn,
          #privacyBtn {
            border-radius: 0.25rem;
            border: none;
            color: var(--sg-color-white);
            cursor: pointer;
            margin: 0.25rem;
            padding: 0.5rem 1rem;
            width: calc(100% - 0.5rem);
          }

          #aboutBtn {
            background: var(--sg-color-green-500);
          }

          #privacyBtn {
            background: var(--sg-color-blue-500);
          }

          #resolution {
            display: inline;
            margin-bottom: 0.5rem;
          }

          /* Desktop Resolution Classes */
          .resolution-400 #canvas {
            border: 0.125rem solid var(--sg-color-gray-900);
            height: 25rem;
            margin: auto;
            width: 25rem;
          }

          .resolution-800 #canvas {
            border: 0.125rem solid (var(--sg-color-gray-900));
            height: 50rem;
            margin: auto;
            width: 50rem;
          }

          .resolution #gameContainer {
            background: var(--sg-color-black);
          }

          .seed-controls {
            background: rgba(0, 0, 0, 0.7);
            border-radius: 0.3125rem;
            bottom: 3rem;
            color: var(--sg-color-white);
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
            color: var(--sg-color-white);
            margin: 0 0 0.625rem 0;
          }

          .seed-controls__header button {
            background: var(--sg-color-red-500);
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
            outline: 0.125rem solid var(--sg-color-blue-400);
          }

          .seed-controls__save-load {
            display: flex;
            flex-direction: column;
            margin-bottom: 0.5rem;
          }

          #saveModeToggle {
            background: var(--sg-color-blue-500);
          }

          .tile-btn {
            border-radius: 0.125rem;
            border: 0.0625rem solid var(--sg-color-gray-500);
            cursor: pointer;
            font-size: 0.625rem;
            padding: 0.25rem 0.375rem;
            transition: all 0.2s;
          }

          .tile-btn--air {
            background: var(--sg-tile-air-color);
            color: var(--sg-color-black);
          }

          .tile-btn--sand {
            background: var(--sg-tile-sand-color);
            color: var(--sg-color-black);
          }

          .tile-btn--birch {
            color: var(--sg-color-black);
          }

          .tile-btn--clay {
            background: var(--sg-tile-clay-color);
          }

          .tile-btn--cloud,
          .tile-btn--gold,
          .tile-btn--grass,
          .tile-btn--ice,
          .tile-btn--pumice,
          .tile-btn--snow {
            color: var(--sg-color-gray-900);
          }

          .tile-btn--cloud {
            background: var(--sg-tile-cloud-color);
          }

          .tile-btn--gold {
            background: var(--sg-tile-gold-color);
          }

          .tile-btn--grass {
            background: var(--sg-tile-grass-color);
          }

          .tile-btn--ice {
            background: var(--sg-tile-ice-color);
          }

          .tile-btn--pumice {
            background: var(--sg-tile-pumice-color);
          }

          .tile-btn--snow {
            background: var(--sg-tile-snow-color);
          }

          .tile-btn--coal,
          .tile-btn--dirt,
          .tile-btn--lava,
          .tile-btn--mushroom,
          .tile-btn--stone,
          .tile-btn--tree-leaves,
          .tile-btn--tree-trunk,
          .tile-btn--water {
            color: var(--sg-color-white);
          }

          .tile-btn--iron {
            background: var(--sg-tile-iron-color);
          }

          .tile-btn--wheat {
            background: var(--sg-tile-wheat-color);
            color: var(--sg-color-black);
          }

          .tile-btn--carrot {
            background: var(--sg-tile-carrot-color);
          }

          .tile-btn--cactus {
            background: var(--sg-tile-cactus-color);
            color: var(--sg-color-black);
          }

          .tile-btn--tulip {
            background: var(--sg-tile-tulip-color);
          }

          .tile-btn--agave {
            background: var(--sg-tile-agave-color);
            color: var(--sg-color-black);
          }

          .tile-btn--lavender {
            background: var(--sg-tile-lavender-color);
          }

          .tile-btn--kelp {
            background: var(--sg-tile-kelp-color);
          }

          .tile-btn--rose {
            background: var(--sg-tile-rose-color);
          }

          .tile-btn--pumpkin {
            background: var(--sg-tile-pumpkin-color);
          }

          .tile-btn--lotus {
            background: var(--sg-tile-lotus-color);
            color: var(--sg-color-black);
          }

          .tile-btn--birch {
            background: var(--sg-tile-birch-color);
          }

          .tile-btn--coal {
            background: var(--sg-tile-coal-color);
          }

          .tile-btn--dirt {
            background: var(--sg-tile-dirt-color);
          }

          .tile-btn--lava {
            background: var(--sg-tile-lava-color);
          }

          .tile-btn--mushroom {
            background: var(--sg-tile-mushroom-color);
          }

          .tile-btn--stone {
            background: var(--sg-tile-stone-color);
          }

          .tile-btn--tree_trunk {
            background: var(--sg-tile-tree-trunk-color);
          }

          .tile-btn--tree_leaves {
            background: var(--sg-tile-tree-leaves-color);
          }

          .tile-btn--water {
            background: var(--sg-tile-water-color);
          }

          .tile-btn:hover {
            border-color: var(--sg-color-gray-800);
            transform: scale(1.05);
          }

          .tile-btn.selected {
            border: 0.125rem solid var(--sg-color-sky-50);
            outline: 0.125rem solid var(--sg-color-blue-500);
            font-weight: bold;
          }

          #mapEditor,
          #examplesBtnContainer {
            border-top: 0.0625rem solid var(--sg-color-gray-500);
            margin-top: 0.625rem;
            padding-top: 0.625rem;
          }

          #mapEditorControls {
            display: flex;
            flex-direction: column;
            margin-top: 0.3125rem;
            padding-right: 1rem;
          }

          #mapEditorControls div {
            margin-bottom: 0.5rem;
          }

          #brushSizeSelect {
            margin-left: 0.3125rem;
            padding: 0.125rem;
          }

          #generateWithSeed {
            background: var(--sg-color-blue-400);
          }

          #randomSeed {
            background: var(--sg-color-amber-500);
          }

          #copySeed {
            background: var(--sg-color-emerald-700);
          }

          .seed-controls button {
            border-radius: 0.1875rem;
            border: none;
            color: var(--sg-color-white);
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
            color: var(--sg-color-gray-600);
            font-size: 0.6875rem;
            margin-top: 0.5rem;
          }

          .swatch-cloud,
          .swatch-grass,
          .swatch-ice,
          .swatch-kelp,
          .swatch-pumice,
          .swatch-snow {
            display: inline-block;
            height: 0.625rem;
            width: 0.625rem;
          }

          .swatch-cloud {
            background: var(--sg-tile-cloud-color);
          }

          .swatch-grass {
            background: var(--sg-tile-grass-color);
          }

          .swatch-kelp {
            background: var(--sg-tile-kelp-color);
          }

          .swatch-ice {
            background: var(--sg-tile-ice-color);
          }

          .swatch-pumice {
            background: var(--sg-tile-pumice-color);
          }

          .swatch-snow {
            background: var(--sg-tile-snow-color);
          }

          .about,
          .examples,
          .privacy {
            background: var(--sg-color-white);
            line-height: 1.5;
            overflow: auto;
            padding: 0.5rem 1rem 1rem 2rem;
          }

          dialog.about-content,
          dialog.examples-content,
          dialog.privacy-content {
            background: var(--sg-color-gray-50);
            border-radius: 0.5rem;
            border: 0.125rem solid var(--sg-color-gray-900);
            color: var(--sg-color-gray-900);
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
            background: var(--sg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--sg-color-white);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem 1rem;
          }

          .about-controls {
            background: var(--sg-color-gray-300);
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
            #controls,
            #settings,
            #inventory,
            .seed-controls {
              font-size: 0.725rem;
            }

            .touch-btn {
              font-size: 0.75rem;
            }

            .seed-controls {
              font-size: 0.6875rem;
            }

            .seed-controls button {
              font-size: 0.6875rem;
              padding: 0.25rem 0.5rem;
            }

            .seed-controls input {
              width: 3.75rem;
            }
          }

          @media (min-width: 48rem) {
            .ui-grid__corner--heading {
              font-size: 1.25rem;
            }

            #stats,
            #controls,
            #settings,
            #inventory,
            .seed-controls {
              font-size: 1.25rem;
            }

            .touch-btn {
              font-size: 0.875rem;
            }
          }
        </style>

        <div id="loading">
          <div class="pixel pixel-one"></div>
          <div class="pixel pixel-two"></div>
          <div class="pixel pixel-three"></div>
          <div class="pixel pixel-four"></div>
          <div class="pixel pixel-five"></div>
          <div class="pixel pixel-six"></div>
          <div class="pixel pixel-seven"></div>
          <div class="pixel pixel-eight"></div>
          <div class="pixel pixel-nine"></div>
        </div>
        <canvas id="canvas" tabindex="0"></canvas>
        <div id="ui-grid" class="ui-grid">
          <div class="ui-grid__corner ui-grid__corner--top-left">
            <div id="stats">
              <div class="ui-grid__corner--heading">🌱 Sprite Garden</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div>Biome: <span id="currentBiome">Forest</span></div>
                <div>Depth: <span id="currentDepth">Surface</span></div>
                <div>Total Seeds: <span id="seedCount">0</span></div>
                <div>Time: <span id="gameTime">0</span>s</div>

                <div class="info-buttons-container">
                  <button id="aboutBtn">ℹ️ About</button>
                  <button id="privacyBtn">🔒 Privacy</button>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--top-right">
            <div id="settings">
              <div class="ui-grid__corner--heading">⚙️ Settings</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div class="settings-actions">
                  <div id="resolution">
                    <select id="resolutionSelect">
                      <option value="400">400x400</option>
                      <option value="800">800x800</option>
                      <option hidden="hidden" value="fullscreen">
                        Fullscreen
                      </option>
                    </select>
                  </div>
                  <button id="worldState">🌍 World State</button>
                  <button id="toggleView">
                    🔍 <span id="viewModeText">View Normal</span>
                  </button>
                  <button id="toggleFog">
                    ☁ <span id="fogModeText">Fog</span>
                  </button>
                  <button id="toggleBreakMode">
                    ⛏️ <span id="breakModeText">Dig Regular</span>
                  </button>
                </div>

                <div class="settings-actions">
                  <div id="customizeColorsBtnContainer">
                    <div class="ui-grid__corner--sub-heading">🗺️ Colors</div>
                    <button id="customizeColorsBtn">Customize</button>
                  </div>
                  <div id="examplesBtnContainer" hidden="hidden">
                    <div class="ui-grid__corner--sub-heading">🗺️ Examples</div>
                    <button id="examplesBtn">
                      📝 <span id="examplesBtnText">Open</span>
                    </button>
                  </div>
                  <div id="mapEditor" hidden="hidden">
                    <div class="ui-grid__corner--sub-heading">
                      🗺️ Map Editor
                    </div>
                    <button id="toggleMapEditor">
                      📝 <span id="mapEditorText">Enable Editor</span>
                    </button>
                    <div
                      class="ui-grid__corner--sub-section"
                      id="mapEditorControls"
                      hidden="hidden"
                    >
                      <div>
                        Brush Size:
                        <select id="brushSizeSelect">
                          <option value="1">1x1</option>
                          <option value="3">3x3</option>
                          <option value="5">5x5</option>
                        </select>
                      </div>
                      <div class="map-editor-controls-section">
                        <div class="map-editor-controls-section_header">
                          🌍 Terrain:
                        </div>
                        <div
                          class="map-editor-controls-section_buttons-container"
                        >
                          <button
                            class="tile-btn tile-btn--air"
                            data-tile="AIR"
                          >
                            Air
                          </button>
                          <button
                            class="tile-btn tile-btn--dirt"
                            data-tile="DIRT"
                          >
                            Dirt
                          </button>
                          <button
                            class="tile-btn tile-btn--grass"
                            data-tile="GRASS"
                          >
                            Grass
                          </button>
                          <button
                            class="tile-btn tile-btn--stone"
                            data-tile="STONE"
                          >
                            Stone
                          </button>
                          <button
                            class="tile-btn tile-btn--sand"
                            data-tile="SAND"
                          >
                            Sand
                          </button>
                          <button
                            class="tile-btn tile-btn--clay"
                            data-tile="CLAY"
                          >
                            Clay
                          </button>
                          <button
                            class="tile-btn tile-btn--snow"
                            data-tile="SNOW"
                          >
                            Snow
                          </button>
                          <button
                            class="tile-btn tile-btn--ice"
                            data-tile="ICE"
                          >
                            Ice
                          </button>
                          <button
                            class="tile-btn tile-btn--cloud"
                            data-tile="CLOUD"
                          >
                            Cloud
                          </button>
                        </div>
                        <div class="map-editor-controls_header">
                          🏔️ Resources:
                        </div>
                        <div
                          class="map-editor-controls-section_buttons-container"
                        >
                          <button
                            class="tile-btn tile-btn--coal"
                            data-tile="COAL"
                          >
                            Coal
                          </button>
                          <button
                            class="tile-btn tile-btn--iron"
                            data-tile="IRON"
                          >
                            Iron
                          </button>
                          <button
                            class="tile-btn tile-btn--gold"
                            data-tile="GOLD"
                          >
                            Gold
                          </button>
                          <button
                            class="tile-btn tile-btn--pumice"
                            data-tile="PUMICE"
                          >
                            Pumice
                          </button>
                        </div>
                        <div class="map-editor-controls_header">🌳 Nature:</div>
                        <div
                          class="map-editor-controls-section_buttons-container"
                        >
                          <button
                            class="tile-btn tile-btn--tree_trunk"
                            data-tile="TREE_TRUNK"
                          >
                            Trunk
                          </button>
                          <button
                            class="tile-btn tile-btn--tree_leaves"
                            data-tile="TREE_LEAVES"
                          >
                            Leaves
                          </button>
                          <button
                            class="tile-btn tile-btn--water"
                            data-tile="WATER"
                          >
                            Water
                          </button>
                          <button
                            class="tile-btn tile-btn--lava"
                            data-tile="LAVA"
                          >
                            Lava
                          </button>
                        </div>
                        <div class="map-editor-controls_header">🌱 Crops:</div>
                        <div
                          class="map-editor-controls-section_buttons-container"
                        >
                          <button
                            class="tile-btn tile-btn--wheat"
                            data-tile="WHEAT"
                          >
                            Wheat
                          </button>
                          <button
                            class="tile-btn tile-btn--carrot"
                            data-tile="CARROT"
                          >
                            Carrot
                          </button>
                          <button
                            class="tile-btn tile-btn--mushroom"
                            data-tile="MUSHROOM"
                          >
                            Mushroom
                          </button>
                          <button
                            class="tile-btn tile-btn--cactus"
                            data-tile="CACTUS"
                          >
                            Cactus
                          </button>
                          <button
                            class="tile-btn tile-btn--tulip"
                            data-tile="TULIP"
                          >
                            Tulip
                          </button>
                          <button
                            class="tile-btn tile-btn--agave"
                            data-tile="AGAVE"
                          >
                            Agave
                          </button>
                          <button
                            class="tile-btn tile-btn--lavender"
                            data-tile="LAVENDER"
                          >
                            Lavender
                          </button>
                          <button
                            class="tile-btn tile-btn--kelp"
                            data-tile="KELP"
                          >
                            Kelp
                          </button>
                          <button
                            class="tile-btn tile-btn--rose"
                            data-tile="ROSE"
                          >
                            Rose
                          </button>
                          <button
                            class="tile-btn tile-btn--pumpkin"
                            data-tile="PUMPKIN"
                          >
                            Pumpkin
                          </button>
                          <button
                            class="tile-btn tile-btn--lotus"
                            data-tile="LOTUS"
                          >
                            Lotus
                          </button>
                          <button
                            class="tile-btn tile-btn--birch"
                            data-tile="BIRCH"
                          >
                            Birch
                          </button>
                        </div>
                      </div>
                      <div>
                        <button id="clearMapEditor">🧹 Clear All</button>
                        <button id="fillMapEditor">🪣 Fill Layer</button>
                        <button id="saveMapAsState">💾 Save as State</button>
                        <button id="regenerateMap">🌍 Regenerate Map</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--bottom-left">
            <div id="controls">
              <div class="ui-grid__corner--heading">⌨️ Controls</div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div class="control-instruction">w / ↑ / Space: Jump</div>
                <div class="control-instruction">a / d or ← / →: Move</div>
                <div class="control-instruction">f: Plant/Harvest</div>
                <div class="control-instruction">r: Break Block</div>
                <div class="control-instruction">e / x / k: mode / scale / range</div>
                <div class="control-instruction">
                  <span style="font-family: monospace;">u</span> / i / o / j / l / m / , / .: Set Block
                </div>
                <div class="control-instruction">ctrl+s: World State</div>
                <div class="control-instruction">Mouse: Inspect Tiles</div>
                <div
                  class="control-instruction control-instruction_icon-container"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="var(--sg-color-gray-200)"
                  >
                    <path
                      d="M419-80q-28 0-52.5-12T325-126L107-403l19-20q20-21 48-25t52 11l74 45v-328q0-17 11.5-28.5T340-760q17 0 29 11.5t12 28.5v472l-97-60 104 133q6 7 14 11t17 4h221q33 0 56.5-23.5T720-240v-160q0-17-11.5-28.5T680-440H461v-80h219q50 0 85 35t35 85v160q0 66-47 113T640-80H419ZM167-620q-13-22-20-47.5t-7-52.5q0-83 58.5-141.5T340-920q83 0 141.5 58.5T540-720q0 27-7 52.5T513-620l-69-40q8-14 12-28.5t4-31.5q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 17 4 31.5t12 28.5l-69 40Zm335 280Z"
                    />
                  </svg>
                  Mobile Controls
                </div>
              </div>
            </div>
          </div>

          <div class="ui-grid__corner ui-grid__corner--bottom-right">
            <div id="inventory">
              <div class="ui-grid__corner--heading" id="seeds">
                🎒 Inventory
              </div>
              <div class="ui-grid__corner--container" hidden="hidden">
                <div class="ui-grid__corner--sub-heading">🫘 Seeds</div>
                <div class="ui-grid__corner--sub-section">
                  <div>Selected: <span id="selectedSeed">None</span></div>
                  <div>
                    <button class="seed-btn" data-wheat="data-wheat">
                      🌾 <span id="wheatCount">0</span>
                    </button>
                    <button class="seed-btn" data-carrot="data-carrot">
                      🥕 <span id="carrotCount">0</span>
                    </button>
                    <button class="seed-btn" data-mushroom="data-mushroom">
                      🍄 <span id="mushroomCount">0</span>
                    </button>
                    <button class="seed-btn" data-cactus="data-cactus">
                      🌵 <span id="cactusCount">0</span>
                    </button>
                    <button class="seed-btn" data-walnut="data-walnut">
                      🌰 <span id="walnutCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--berry-bush"
                      data-berry_bush="data-berry_bush"
                    >
                      🍓 <span id="berry_bushCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--bamboo"
                      data-bamboo="data-bamboo"
                    >
                      🎋 <span id="bambooCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--sunflower"
                      data-sunflower="data-sunflower"
                    >
                      🌻 <span id="sunflowerCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--corn"
                      data-corn="data-corn"
                    >
                      🌽 <span id="cornCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--pine-tree"
                      data-pine_tree="data-pine_tree"
                    >
                      🌲 <span id="pine_treeCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--willow-tree"
                      data-willow_tree="data-willow_tree"
                    >
                      🌳 <span id="willow_treeCount">0</span>
                    </button>

                    <button
                      class="seed-btn seed-btn--fern"
                      data-fern="data-fern"
                    >
                      🌿 <span id="fernCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--tulip"
                      data-tulip="data-tulip"
                    >
                      🌷 <span id="tulipCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--agave"
                      data-agave="data-agave"
                    >
                      🌱 <span id="agaveCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--lavender"
                      data-lavender="data-lavender"
                    >
                      🌺 <span id="lavenderCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--kelp"
                      data-kelp="data-kelp"
                    >
                      <div class="swatch-kelp"></div>
                      <span id="kelpCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--rose"
                      data-rose="data-rose"
                    >
                      🌸 <span id="roseCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--pumpkin"
                      data-pumpkin="data-pumpkin"
                    >
                      🎃 <span id="pumpkinCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--lotus"
                      data-lotus="data-lotus"
                    >
                      🪷 <span id="lotusCount">0</span>
                    </button>
                    <button
                      class="seed-btn seed-btn--birch"
                      data-birch="data-birch"
                    >
                      🪵 <span id="birchCount">0</span>
                    </button>
                  </div>
                </div>

                <div id="materials">
                  <div class="ui-grid__corner--sub-heading">🧱 Materials</div>
                  <div class="ui-grid__corner--sub-section">
                    <div>Selected: <span id="selectedMaterial">None</span></div>
                    <div>
                      <button
                        class="material-btn material-btn--dirt"
                        data-dirt="data-dirt"
                      >
                        🟤 <span id="dirtCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--stone"
                        data-stone="data-stone"
                      >
                        🪨 <span id="stoneCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--grass"
                        data-grass="data-grass"
                      >
                        <div class="swatch-grass"></div>
                        <span id="grassCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--snow"
                        data-snow="data-snow"
                      >
                        ❄️ <span id="snowCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--ice"
                        data-ice="data-ice"
                      >
                        🧊 <span id="iceCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--wood"
                        data-wood="data-wood"
                      >
                        🪵 <span id="woodCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--sand"
                        data-sand="data-sand"
                      >
                        🏖️ <span id="sandCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--clay"
                        data-clay="data-clay"
                      >
                        🧱 <span id="clayCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--coal"
                        data-coal="data-coal"
                      >
                        ⚫ <span id="coalCount">0</span>
                      </button>

                      <button
                        class="material-btn material-btn--iron"
                        data-iron="data-iron"
                      >
                        🔩 <span id="ironCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--gold"
                        data-gold="data-gold"
                      >
                        🟡 <span id="goldCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--pumice"
                        data-pumice="data-pumice"
                      >
                        <div class="swatch-pumice"></div>
                        <span id="pumiceCount">0</span>
                      </button>
                      <button
                        class="material-btn material-btn--cloud"
                        data-cloud="data-cloud"
                      >
                        ☁️ <span id="cloudCount">0</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
              <input
                id="worldSeedInput"
                placeholder="Enter seed..."
                type="number"
              />
            </label>

            <button id="generateWithSeed">Generate</button>
            <button id="randomSeed">Random</button>
            <button id="copySeed">Copy Seed</button>
          </div>

          <div class="current-seed">
            <p>Current seed: <span id="currentSeed"></span></p>
          </div>

          <h4>Load / Save / Store</h4>

          <div class="seed-controls__save-load">
            <button id="loadExternalGameFile">💾 Load Game File From Disk</button>
            <button id="saveExternalGameFile">🗃️ Save Game File To Disk</button>
            <button id="openStorageBtn">🗄️ Open Game Storage</button>
          </div>

          <h4 class="seed-controls__header seed-controls--share" hidden>Share</h4>

          <div class="seed-controls__save-load seed-controls--share" hidden>
            <button id="shareExternalGameFile">🌍 Share External Game File</button>
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
              <div class="touch-btn middle" data-key="x">&times;</div>
              <div class="touch-btn right" data-key="d">→</div>

              <div class="touch-btn down-left" data-key="downleft">↙</div>
              <div class="touch-btn down" data-key="s">↓</div>
              <div class="touch-btn down-right" data-key="downright">↘</div>
            </div>
            <div class="dpad">
              <div class="touch-btn place-block up-left" data-key="u">↖</div>
              <div class="touch-btn place-block up" data-key="i">↑</div>
              <div class="touch-btn place-block up-right" data-key="o">↗</div>

              <div class="touch-btn place-block left" data-key="j">←</div>
              <div class="touch-btn place-block middle" data-key="k">
                &times;
              </div>
              <div class="touch-btn place-block right" data-key="l">→</div>

              <div class="touch-btn place-block down-left" data-key="m">↙</div>
              <div class="touch-btn place-block down" data-key=",">↓</div>
              <div class="touch-btn place-block down-right" data-key=".">
                ↘
              </div>
            </div>
          </div>
          <div>
            <div class="action-buttons">
              <div class="touch-btn" data-key=" ">🦘</div>
              <div class="touch-btn" data-key="r">⛏️</div>
              <div class="touch-btn" data-key="f">🧑‍🌾</div>
            </div>
          </div>
        </div>

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
  globalThis.customElements?.define(tagName, SpriteGarden);
}
