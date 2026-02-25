# Agent Guide: Block Garden

Welcome, Agent. This document provides comprehensive technical context for working on the Block Garden codebase—a full-featured voxel sandbox exploration and farming game.

## 🏗️ Architecture Overview

Block Garden is a 3D voxel sandbox built with **Vanilla JavaScript**, **Web Components**, and **WebGL**. It's designed as a privacy-first Progressive Web App (PWA) with rich offline capabilities, extensibility through a public API, and 20+ plant species with farming mechanics.

The project follows a layered architecture: **core engine** (world generation, meshing, lighting, physics), **render system** (WebGL pipeline), **game systems** (player, plants, collision), **UI layer** (Web Components, Shadow DOM), and **public API** (extensions, modding).

### Primary Systems

- **Game Engine** (`src/core/systems/game/`): Fixed-timestep loop, state management, and initialization
- **World System** (`src/core/world/`): Procedural generation, chunks, meshing, lighting, and plants
- **Rendering** (`src/core/render/`): WebGL pipeline with three render passes, celestial rendering, UI overlays
- **UI System** (`src/ui/`): Shadow DOM components, event handling, dialogs, and canvas utilities
- **Persistence** (`src/core/`): Save/load with compression, share target protocol, IndexedDB storage
- **Public API** (`src/api/`): Extensions, modding, and community examples

## 💻 Tech Stack

- **Reactive State**: `signal-polyfill` (Signal.State, Signal.Computed) for fine-grained reactivity
- **Rendering**: WebGL with custom shader compilation and vertex lighting
- **Procedural Generation**: Simplex noise in Web Worker for terrain
- **Physics**: Custom AABB collision detection and response
- **Persistence**: `localforage` (IndexedDB) with gzip compression
- **UI**: Web Components, Shadow DOM, vanilla CSS with CSS variables
- **Build**: Rollup ES module bundling with tree-shaking
- **PWA**: Manifest, Service Worker (Workbox), offline support
- **Testing**: Jest with comprehensive unit, integration, and reproduction tests

## 🚀 Development Commands

- **Dev Server**: `npm start` (Port 3000) or `npm run start:dev` (Port 8080)
- **Build**: `npm run build` (full pipeline) or `npx rollup -c` (bundle only)
- **Dev & Build**: `npm run build:ci` (concurrent dev + production build)
- **Test**: `npm test` (Jest) or `npm test -- --watch` (watch mode)
- **Test Pattern**: `npm test -- --testNamePattern="pattern"`
- **Format**: `npm run format` (Prettier for HTML, CSS, JS files)

## 📂 Directory Structure

### Core Engine

- **`src/core/systems/game/`**
  - `loop.mjs`: Fixed-timestep game loop that drives all updates at consistent intervals
  - `state.mjs`: Centralized state with signals
    - `Signal.State` for mutable values (world, player position, etc.)
    - `Signal.Computed` for derived values (derived camera position, UI text, etc.)
    - Helper functions: `getState()`, `setState()`, `updateState()`, `getConfig()`, `setConfig()`, `updateConfig()`
  - `init.mjs`: System initialization and world setup
- **`src/core/world/`**
  - `generation/`: Simplex noise terrain, chunk generation, Web Worker
  - `chunkManager.mjs`: Chunk lifecycle, loading, unloading, persistence
  - `meshing/`: Greedy meshing (opaque, transparent, water passes), AO calculation
  - `lighting/`: Light propagation, ambient occlusion per-vertex, day/night cycle light color transitions
  - `plants/`: 20+ species with growth stages and farming
  - `config/`: Block definitions (`blocks.mjs` with 30+ block types), biomes, color palettes, block database
  - `time/`: Day/night cycle, sky color transitions, celestial body positioning
- **`src/core/render/`**
  - `webGLContext.mjs`: WebGL initialization and context management
  - `graphics.mjs`: Shader compilation, rendering pipeline, buffer management
  - `celestialShader.mjs`: Sun, moon, stars rendering
  - `draw/`: Chunk meshes (`drawChunks.mjs`), celestial bodies (`drawCelestial.mjs`), UI overlays (`drawUI.mjs`)

### Core Persistence (`src/core/`)

- `createSave.mjs`: Generate compressed savegame files (world state + metadata)
- `loadSave.mjs`: Restore world state from saves with version migration
- `loadSharedSave.mjs`: Load worlds from shared URLs/PDF embedded data
- `shareTarget.mjs`: PWA share target protocol handler for receiving saved worlds

### Game Systems

- **`src/core/systems/`**
  - `physics.mjs`: AABB collision, velocity, response
  - `gravity.mjs`: Gravity and vertical movement
  - `player.mjs`: Player state, inventory, selection, camera
  - `persistence.mjs`: Save/load world snapshots
  - `plantGrowth.mjs`: Plant age progression, harvesting
  - `world.mjs`: Block updates, listener triggers

### UI & Dialog

- **`src/ui/`**
  - `BlockGarden.mjs`: Main Web Component (`<block-garden>` custom element) with Shadow DOM
  - `controls/`: Keyboard, mouse, touch (Hammer.js), canvas listeners
  - `controls/eventListeners/`: Material bar, planting, generation, radius, touch toggle
  - `components/`: Custom form elements (select, option)
  - `dialog/`: Inventory, storage, colors, settings, tutorials, examples, privacy, about
  - `effects.mjs`: UI animations and transitions
  - `materialBar.mjs`: Block/material selection bar display
  - `utils/`: Helper utilities (`getShadowRoot`, `waitForElement`, `pollForElement`, `canControlCanvas`, `closeMenus`, `digHighlight`, `flightToggle`, etc.)

### Utilities & API

- **`src/utils/`**
  - `colors/`: CSS color manipulation, theming, custom properties, normalization
  - `interaction.mjs`: Mining, placing, farming logic (~878 lines)
  - `raycastFromCanvasCoords.mjs`: Ray casting from mouse/touch coords to world coordinates
  - `math.mjs`, `ray.mjs`, `noise.mjs`: Math, ray intersection, and simplex noise utilities
  - `compression.mjs`, `conversion.mjs`: Data serialization and gzip compression
  - `urlParams.mjs`, `saveData.mjs`: URL and save utilities
  - `oreLocator.mjs`: Ore scanning within radius of player position
  - `isSolid.mjs`, `isOnGround.mjs`: Block solidity and ground contact detection
  - `debounce.mjs`, `effect.mjs`, `collectDrop.mjs`, `canvasToPngWithState.mjs`: Various utilities
- **`src/api/`**
  - `BlockGarden.mjs`: Public API for extensions (~764 lines)
    - World access (`getWorld()`, `setWorld()`)
    - Block interactions (place, break, paint)
    - Color management and theming
    - Block break listeners for plugins
    - Toast notifications, full player control
  - `examples/`: GOL, Fireworks, TicTacToe, Video player, Photo gallery, Link, Messaging, Konami Code
  - `player/`: Programmatic control (movement, key events, synthetic keyboard events)
  - `ui/`: Canvas helpers, toast notifications
  - `misc/`: Action sequences, character definitions, key definitions, async sleep

### Build & Deployment

- **`service-worker/`**: Workbox configuration, share target handler, offline support
- **`bin/`**: Build scripts (`build.sh`, `serve.mjs`, `build-html.mjs`), single-file bundle creation, server utilities, analysis tools
- **`deps/`**: Vendored ES module dependencies (signal, simplex-noise, hammerjs, localForage, workbox-window, qrcode, pdf-lib, alea, etc.)
- **`.github/copilot-instructions.md`**: GitHub Copilot coding patterns and guidelines
- **Deployment**: GitHub Pages (base path: `/block-garden/`), automatic CI/CD with GitHub Actions

## 🛠️ Key Implementation Details

### Chunk Meshing (`src/core/world/meshing/chunkMesher.mjs`)

- **Greedy Algorithm**: Combines adjacent faces into larger quads for efficiency
- **Three Render Passes**: Opaque (solid blocks), Transparent (glass/leaves with depth sorting), Water (special wave/reflection effects)
- **Ambient Occlusion**: Per-vertex AO based on neighboring block face exposure creates shadowing
- **Performance Critical**: Remeshing on any block change within a chunk (~64-block cubes)
- Uses typed arrays (Float32Array, Uint16Array) for efficient GPU memory

### Game Loop Pattern (`src/core/systems/game/loop.mjs`)

- **Fixed Timestep**: Consistent update intervals for determinism
- **Frame Budget**: All game logic fits within ~16ms frame window
- **Update Order**: Physics → Collision → Player → Plants → Lighting → Render
- **Adaptive**: Handles frame skipping gracefully if performance drops
- **Signal Updates**: Fine-grained reactivity triggers only affected UI updates

### State Management (`src/core/systems/game/state.mjs`)

- **Signal-Based**: Every mutable game state wrapped in `Signal.State`
  - World state (chunks, voxels, plants)
  - Player state (position, inventory, selection)
  - UI state (dialog visibility, hotbar selection)
- **Computed Signals**: Derived properties auto-update on dependency changes
  - Camera position (derived from player position)
  - Visible chunks (derived from player position + view distance)
  - UI text (derived from selected block + inventory count)
- **Helper Functions**: `getState`, `setState`, `updateState`, `getConfig`, `setConfig`, `updateConfig`
- **No Re-render Overhead**: Only affected UI updates when signals change — not full page re-renders
- **Helper Patterns**:
  ```javascript
  getState(stateSignal); // Read current value
  setState(stateSignal, newValue); // Write new value
  updateState(stateSignal, fn); // Functional update
  ```

### Storage & Persistence

- **IndexedDB**: Unlimited offline storage via `localforage`
- **Compression**: World state compressed with gzip before storage (10-100MB → 1-10MB)
- **Migration**: Auto-migration between save format versions in `loadSave.mjs`
- **Formats supported**: Native IndexedDB (JSON), PDF-embedded (pdf-lib), PNG-embedded (canvas data), URL-encoded (link sharing)
- **Share Target**: PWA share protocol integration for save files

### Plants & Growth System

- **Growth Stages**: Each plant has 0-N growth stages (seed → mature → dead/harvested)
- **Conditional Growth**: Growth rules check surrounding blocks (water, soil, light)
- **Harvesting**: Different drops per plant type and stage
- **Replanting**: Seeds stored in inventory can be planted on appropriate blocks

### Physical Interaction

- **Raycasting**: Convert mouse/touch position on canvas to world coordinates
- **Block selection**: Ray intersects chunk meshes to find block under cursor
- **Actions**: Mining (break), placing, painting (with dyes), farming (planting/harvesting)
- **Collision**: AABB against chunk geometry for movement validation

## 📋 Testing Strategy

- **Jest Framework**: All `.mjs` files have accompanying `.test.mjs` files
- **ES Module Support**: `NODE_OPTIONS=--experimental-vm-modules jest` for native ESM
- **Test Types**:
  - **Unit Tests**: Math, utilities, algorithms, colors, compression, noise generation
  - **Integration Tests**: World generation, chunk management, persistence, plant growth
  - **Reproduction Tests**: Full game scenarios and world state verification
  - **E2E Tests**: Complete plant growth, collision, farming workflows
- **Test Organization**:
  - File-local tests: `file.mjs` → `file.test.mjs` (unit focus)
  - Feature-level tests: `feature.integration.test.mjs` (complex workflows)
  - Reproduction tests: `*.repro.test.mjs` (user-reported scenarios)
  - Coverage: Comprehensive for `src/core/`, `src/utils/`, critical `src/ui/` logic
- **Commands**: `npm test` (full suite), `npm test -- --watch` (watch mode), `npm test -- --testNamePattern="pattern"` (specific tests)

## 💾 File Organization Rules

- **ES Modules Only**: All JavaScript uses `.mjs` extension
- **Colocation**: Tests live alongside source (`file.mjs` → `file.test.mjs`)
- **No Frameworks**: Vanilla JS, standard DOM APIs, Web Components only
- **Type Hints**: JSDoc with `@typedef` for complex types (checkJs enabled in tsconfig.json, no TypeScript compilation)
- **Exports**: Named exports preferred; default for single-purpose modules
- **Shadow DOM**: All UI components use Shadow DOM (`mode: 'open'`) for encapsulation
- **Dependencies**: Vendored in `deps/` folder for single-file distribution
- **Public API**: All extension exports via `src/api/BlockGarden.mjs`

## 🎨 Code Patterns & Best Practices

- **Signals**: Wrap mutable state: `new Signal.State(initialValue)`
- **Computed Values**: Use `Signal.Computed` for derived state
- **Helper Functions**: Use `getState(signal)`, `setState(signal, value)` patterns
- **CSS Variables**: Prefix with `--bg-` for colors and themeable properties
  ```css
  :root {
    --bg-dirt: #8b4513;
    --bg-stone: #808080;
  }
  ```
- **JSDoc**: Comprehensive type annotations and documentation
  - `@typedef` for complex type definitions
  - Parameter types on all public functions
  - Return type annotations and examples for complex functions
- **Vanilla APIs**: No external libraries unless essential; prefer browser APIs
  - Web Components instead of frameworks
  - Fetch API for network requests
  - IndexedDB via localforage wrapper
  - Canvas API for rendering (WebGL)
- **Web Components**: Encapsulate with Shadow DOM, use custom elements
  ```javascript
  class MyComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
  }
  customElements.define("my-component", MyComponent);
  ```
- **Immutability**: Favor functional transformations over mutations
  ```javascript
  // Good: spread creates new object
  const updated = { ...state, property: newValue };
  // Avoid: direct mutation
  state.property = newValue;
  ```
- **Graceful Degradation**: Fallbacks for WebGL extensions (ANGLE_instanced_arrays, etc.), APIs (IndexedDB → localStorage → in-memory), user-friendly error messages in UI

## 🔍 Common Agent Tasks

### Adding a New Block Type

1. Define in `src/core/world/config/blocks.mjs` — set properties: `solid`, `transparent`, `colorIndex`, `ore` (if applicable)
2. Add color to `src/core/world/config/colors.mjs`
3. Update meshing in `src/core/world/meshing/chunkMesher.mjs` if custom rendering
4. Add to biome generation if terrain block
5. Test with `src/core/world/config/blocks.test.mjs`

### Adding a New Plant Species

1. Create file in `src/core/world/plants/` with growth stages
   - Export growth stage definitions
   - Define planting requirements (soil blocks, light, water)
2. Register in `src/core/world/plants/index.mjs`
3. Add planting logic to `src/ui/controls/eventListeners/planting.mjs`
4. Add growth rules to `src/core/systems/plantGrowth.mjs`
5. Define drop items in game loot table
6. Verify with `src/core/world/plants/plants.test.mjs`

### Creating an Extension/Mod

1. Extend the `BlockGarden` class from `src/api/BlockGarden.mjs`
2. Use public API methods:
   - `getWorld()`, `setWorld()` — Access chunks and voxels
   - `getBlock(x,y,z)`, `setBlock(x,y,z,blockId)` — Get/set blocks
   - `onBlockBreak(callback)` — Listen to player mining
   - `toast(message)` — Show notifications
   - `resizeCanvas()` — Manage render canvas
3. Load from HTML or programmatically via JavaScript
4. See `src/api/examples/` for working examples

### Modifying Game State

1. Add signal to `src/core/systems/game/state.mjs`
   - Use `new Signal.State()` for mutable state
   - Use `Signal.Computed()` for derived values
2. Update in appropriate system (physics, player, plant growth, etc.)
3. UI auto-updates when signal changes (no manual binding)
4. Add tests to verify state transitions

### Optimizing Performance

- **Meshing**: Check `src/core/world/meshing/chunkMesher.mjs` for geometry generation improvements
- **Lighting**: Profile `src/core/world/lighting/` light propagation
- **Rendering**: Monitor frame budget in `src/core/systems/game/loop.mjs`
- **Memory**: Watch large arrays (chunks are Uint8Array, geometry floats are Float32Array)
- **Profiling**: Use DevTools Performance tab, trace individual frame updates
- Limit per-frame allocations and expensive operations

## 🐛 Debugging Tips

- **State Inspection**: Check `window.blockGarden.state` in DevTools console
  - Access signals directly: `console.log(getState(state.world))`
  - Monitor signal changes: Use signal subscriptions
- **WebGL Debugging**: Use Chrome/Firefox WebGL shader debuggers in DevTools
  - Check WebGL errors: `ctx.getError()` after draw calls
  - Validate shader compilation in `src/core/render/graphics.mjs`
- **Canvas Logging**: Add `console.log()` in render functions
  - Avoid per-frame logging (100s messages/second kills performance)
  - Use conditional logging: `if (debugMode) console.log(...)`
- **Performance Profiling**: DevTools Performance tab for bottlenecks
  - Look for bottlenecks in: meshing, physics, update loop
  - Frame rate indicator shows if GPU-bound vs CPU-bound
- **Chunk Issues**: Trace load/unload in `src/core/world/chunkManager.mjs`
  - Check load/unload timing
  - Verify remesh triggers on block changes
  - Monitor memory usage of chunk pool
- **Physics Issues**: Check AABB collision in `src/core/systems/physics.mjs`
  - Verify chunk geometry matches physics colliders
  - Debug movement in `src/core/systems/player.mjs`
- **Lighting Problems**: Verify light propagation in `src/core/world/lighting/`
  - Check ambient occlusion calculations in mesher
  - Validate day/night transitions in `src/core/world/time/`
- **Persistence Bugs**:
  - Check version migration in `src/core/loadSave.mjs`
  - Verify compression roundtrips in `src/utils/compression.mjs`
  - Test save/load cycle in `src/api/BlockGarden.test.mjs`

## 🤖 Agent Guidelines

- Always run `npm test` before submitting changes to verify no regressions
- Check related `.test.mjs` files when making core changes
- Use JSDoc annotations comprehensively (checkJs enabled in tsconfig.json)
- Prefer signal-based state over manual DOM updates
- Keep rendering hot paths optimized (meshing, draw calls tight)
- Document complex algorithms with line comments
- Follow existing patterns (examine similar files in same directory)
- Update tests when modifying public APIs
- Maintain type safety with JSDoc `@typedef` and `@param` annotations
