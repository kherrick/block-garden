# Agent Guide: Block Garden

Welcome, Agent. This document provides comprehensive technical context for working on the Block Garden codebase—a full-featured voxel sandbox exploration and farming game.

## 🏗️ Architecture Overview

Block Garden is a 3D voxel sandbox built with **Vanilla JavaScript**, **Web Components**, and **WebGL**. It's designed as a privacy-first Progressive Web App (PWA) with rich offline capabilities, extensibility through a public API, and 20+ plant species with farming mechanics.

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
- **Test**: `npm test` (Jest) or `npm test -- --watch` (watch mode)
- **Build & Dev**: `npm run build:ci` (concurrent dev + production build)

## 📂 Directory Structure

### Core Engine

- **`src/core/systems/game/`**
  **`loop.mjs`**: Fixed-timestep game loop that drives all updates at consistent intervals
  - `state.mjs`: Centralized state with signals
  - `init.mjs`: System initialization and world setup
- **`src/core/world/`**
  - `generation/`: Simplex noise terrain, chunk generation, Web Worker
  - `chunkManager.mjs`: Chunk lifecycle, loading, unloading, persistence
  - `meshing/`: Greedy meshing (opaque, transparent, water passes), AO calculation
  - `lighting/`: Light propagation, ambient occlusion per-vertex
  - `plants/`: 20+ species with growth stages and farming
  - `config/`: Block definitions, biomes, color palettes, block database
  - `time/`: Day/night cycle and time-based updates
- **`src/core/render/`**
  - `webGLContext.mjs`: WebGL initialization and context management
  - `graphics.mjs`: Shader compilation, rendering pipeline
  - `celestialShader.mjs`: Sun, moon, stars rendering
  - `draw/`: Chunk meshes, terrain, celestial bodies, UI overlays, cross-hairs

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
  - `BlockGarden.mjs`: Main Web Component with Shadow DOM
  - `controls/`: Keyboard, mouse, touch (Hammer.js), canvas listeners
  - `controls/eventListeners/`: Material bar, planting, generation, radius, touch toggle
  - `components/`: Custom form elements (select, option)
  - `dialog/`: Inventory, storage, colors, settings, tutorials, examples, privacy, about
  - `effects.mjs`: UI animations and transitions
  - `utils/`: Helper utilities (getShadowRoot, waitForElement, etc.)

### Utilities & API

- **`src/utils/`**
  - `colors/`: CSS color manipulation, theming, custom properties
  - `interaction.mjs`: Mining, placing, farming logic
  - `raycastFromCanvasCoords.mjs`: Ray casting from mouse/touch to world
  - `math.mjs`, `ray.mjs`, `noise.mjs`: Math utilities
  - `compression.mjs`, `conversion.mjs`: Data serialization
  - `urlParams.mjs`, `saveData.mjs`: URL and save utilities
- **`src/api/`**
  - `BlockGarden.mjs`: Public API for extensions
  - `examples/`: GOL, Fireworks, TicTacToe, Video player, Photo gallery, etc.
  - `player/`: Programmatic control (movement, key events)
  - `ui/`: Canvas helpers, toast notifications

### Build & Deployment

- **`service-worker/`**: Workbox configuration, share target handler
- **`bin/`**: Build scripts, server utilities, analysis tools
- **`.github/copilot-instructions.md`**: Coding patterns and guidelines
- **`.claude/CLAUDE.md`**: Comprehensive development guide

## 🛠️ Key Implementation Details

### Chunk Meshing (`src/core/world/meshing/chunkMesher.mjs`)

- **Greedy Algorithm**: Combines adjacent faces into larger quads for efficiency
- **Three Render Passes**: Opaque (solid blocks), Transparent (glass/leaves), Water
- **Ambient Occlusion**: Per-vertex AO based on neighboring block face exposure
- **Performance Critical**: Remeshing on any block change within a chunk

### Game Loop Pattern (`src/core/systems/game/loop.mjs`)

- **Fixed Timestep**: Consistent update intervals for determinism
- **Frame Budget**: All game logic fits within ~16ms frame window
- **Update Order**: Physics → Collision → Player → Plants → Lighting → Render
- **Signal Updates**: Fine-grained reactivity triggers only affected UI updates

### State Management (`src/core/systems/game/state.mjs`)

- **Signal-Based**: Every mutable game state wrapped in `Signal.State`
- **Computed Signals**: Derived properties auto-update on dependency changes
- **Helper Functions**: `getState`, `setState`, `updateState`, `getConfig`, `setConfig`, `updateConfig`
- **No Re-render Overhead**: Only affected UI updates when signals change

### Storage & Persistence

- **IndexedDB**: Unlimited offline storage via `localforage`
- **Compression**: World state compressed with gzip before storage
- **Migration**: Auto-migration between save format versions in `loadSave.mjs`
- **Share Target**: PWA share protocol integration for save files

## 📋 Testing Strategy

- **Jest Framework**: All `.mjs` files have accompanying `.test.mjs` files
- **Test Types**:
  - **Unit Tests**: Math, utilities, algorithms, colors
  - **Integration Tests**: World generation, chunk management, persistence
  - **Reproduction Tests**: Full game scenarios and world state verification
  - **E2E Tests**: Complete plant growth, collision, farming workflows
- **Commands**: `npm test` (watch: `npm test -- --watch`)
- **Coverage**: Comprehensive for `src/core/`, `src/utils/`, critical `src/ui/` logic

## 💾 File Organization Rules

- **ES Modules Only**: All JavaScript uses `.mjs` extension
- **Colocation**: Tests live alongside source (`file.mjs` → `file.test.mjs`)
- **No Frameworks**: Vanilla JS, standard DOM APIs, Web Components only
- **Type Hints**: JSDoc with `@typedef` for complex types (no TypeScript)
- **Exports**: Named exports preferred; default for single-purpose modules
- **Shadow DOM**: All UI components use Shadow DOM (`mode: 'open'`)

## 🎨 Code Patterns & Best Practices

- **Signals**: Wrap mutable state: `new Signal.State(initialValue)`
- **Computed Values**: Use `Signal.Computed` for derived state
- **Helper Functions**: Use `getState(signal)`, `setState(signal, value)` patterns
- **CSS Variables**: Prefix with `--bg-` for colors and themeable properties
- **JSDoc**: Comprehensive type annotations and documentation
- **Vanilla APIs**: No external libraries unless essential; prefer browser APIs
- **Web Components**: Encapsulate with Shadow DOM, use custom elements
- **Immutability**: Favor functional transformations over mutations
- **Graceful Degradation**: Fallbacks for WebGL extensions, missing features

## 🔍 Common Agent Tasks

### Adding a New Block Type

1. Define in `src/core/world/config/blocks.mjs`
2. Add color to `src/core/world/config/colors.mjs`
3. Update meshing in `src/core/world/meshing/chunkMesher.mjs` if custom rendering
4. Test with `src/core/world/config/blocks.test.mjs`

### Adding a New Plant Species

1. Create file in `src/core/world/plants/` with growth stages
2. Register in `src/core/world/plants/index.mjs`
3. Add planting logic to `src/ui/controls/eventListeners/planting.mjs`
4. Add growth rules to `src/core/systems/plantGrowth.mjs`
5. Verify with `src/core/world/plants/plants.test.mjs`

### Modifying Game State

1. Add signal to `src/core/systems/game/state.mjs`
2. Update in appropriate system (physics, player, plant growth, etc.)
3. UI auto-updates when signal changes (no manual binding)
4. Add tests to verify state transitions

### Optimizing Performance

- Check meshing in `chunkMesher.mjs` for geometry generation
- Profile with DevTools Performance tab
- Monitor frame rate in `loop.mjs` update order
- Limit per-frame allocations and expensive operations

## 🐛 Debugging Tips

- **State Inspection**: Check `window.gameState` in DevTools console
- **WebGL Debugging**: Use Chrome/Firefox WebGL shader debuggers
- **Canvas Logging**: Add `console.log()` in render (avoid frame rate impact)
- **Performance Profiling**: DevTools Performance tab for bottlenecks
- **Chunk Issues**: Trace load/unload in `chunkManager.mjs`
- **Physics Issues**: Check AABB collision in `physics.mjs`
- **Lighting Problems**: Verify light propagation in `lightSystem.mjs`

## 🤖 Agent Guidelines

- Always run `npm test` before submitting changes to verify no regressions
- Check related `.test.mjs` files when making core changes
- Use JSDoc annotations for type safety (checkJs enabled in tsconfig.json)
- Prefer signal-based state over manual DOM updates
- Keep rendering hot paths optimized (meshing, draw calls)
- Document complex algorithms with comments
- Follow existing patterns (see similar files in same directory)
