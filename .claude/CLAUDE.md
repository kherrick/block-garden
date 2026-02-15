# Claude Guide - Block Garden

A 3D voxel sandbox exploration and farming game built with Vanilla JavaScript, Web Components, and WebGL. This guide provides essential technical context for working on Block Garden.

## 🚀 Quick Start Commands

- **Build**: `npm run build` (full build pipeline) or `npx rollup -c` (bundle only)
- **Test**: `npm test` (Jest with ES modules)
- **Dev Server**: `npm start` (Port 3000) or `npm run start:dev` (Port 8080)
- **Dev & Build**: `npm run build:ci` (concurrent dev server + production build)
- **Format**: `npm run format` (Prettier for HTML, CSS, JS files)

## 🏗️ Architecture Overview

Block Garden is a full-featured PWA with comprehensive modularization. The project follows a layered architecture: **core engine** (world generation, meshing, lighting, physics), **render system** (WebGL pipeline), **game systems** (player, plants, collision), **UI layer** (Web Components, Shadow DOM), and **public API** (extensions, modding).

### Core Systems Root (`src/core/`)

Entry points for save/load/share functionality:

- **`createSave.mjs`**: Generate compressed savegame files (world state + metadata)
- **`loadSave.mjs`**: Restore world state from saves with version migration
- **`loadSharedSave.mjs`**: Load worlds from shared URLs/PDF embedded data
- **`shareTarget.mjs`**: PWA share target protocol handler for receiving saved worlds

### Game Engine (`src/core/systems/game/`)

- **`loop.mjs`**: Fixed-timestep game loop driving all updates
- **`state.mjs`**: Central state management using `signal-polyfill` for fine-grained reactivity
  - `Signal.State` for mutable values (world, player position, etc.)
  - `Signal.Computed` for derived values (derived camera position, UI text, etc.)
  - Helper functions: `getState()`, `setState()`, `updateState()`, `getConfig()`, `setConfig()`, `updateConfig()`
- **`init.mjs`**: Initialization orchestration for all game subsystems

### World System (`src/core/world/`)

- **`config/`**: Block definitions, biomes, colors, and block database
  - `blocks.mjs`: All 30+ block types with properties (solid, transparent, etc.)
  - `colors.mjs`: RGB color definitions for each block
  - `biomes.mjs`: Terrain generation rules per biome
- **`generation/`**: Procedural terrain generation using simplex noise
  - Runs in Web Worker for performance
  - Generates terrain based on biome and seed
  - Handles chunk generation pipelines
- **`chunkManager.mjs`**: Chunk lifecycle management
  - Load/unload/persist chunks based on player position
  - Remesh chunks when blocks change
  - Manage chunk memory and streaming
- **`meshing/`**: Greedy meshing algorithm with three render passes
  - `chunkMesher.mjs`: Core greedy meshing implementation
  - Opaque pass: Solid blocks
  - Transparent pass: Glass, leaves, etc.
  - Water pass: Optimized water face rendering
  - Per-vertex ambient occlusion calculation
- **`lighting/`**: Dynamic lighting system
  - Light propagation for torches and lanterns
  - Ambient occlusion per vertex
  - Day/night cycle light color transitions
  - Sunlight/moonlight from celestial bodies
- **`plants/`**: 20+ plant species with growth mechanics
  - Each plant type has growth stage definitions
  - Harvesting logic and drop mechanics
  - Conditional growth rules by surrounding blocks
- **`time/`**: Day/night cycle
  - Time progression (in-game minutes → real seconds)
  - Sky color transitions
  - Celestial body positioning (sun, moon, stars)

### Rendering System (`src/core/render/`)

- **`webGLContext.mjs`**: WebGL context initialization and state management
- **`graphics.mjs`**: Shader compilation and rendering pipeline
  - Vertex/fragment shader management
  - Render pass organization
  - Buffer management and draw calls
- **`celestialShader.mjs`**: Specialized shaders for sun, moon, stars rendering
- **`draw/`**: Individual draw call implementations
  - `drawChunks.mjs`: Render chunk geometry
  - `drawCelestial.mjs`: Render sky objects
  - `drawUI.mjs`: Render UI overlays (crosshair, dig highlight)

### Game Systems (`src/core/systems/`)

- **`physics.mjs`**: AABB collision detection and response
- **`gravity.mjs`**: Gravity and vertical velocity management
- **`player.mjs`**: Player state, inventory, camera, and selection
- **`persistence.mjs`**: Save/load orchestration
- **`plantGrowth.mjs`**: Plant progression and harvesting
- **`world.mjs`**: World-level updates and block change listeners
- **Test reproductions**: Comprehensive reproduction tests for complex scenarios
  - `autoJump_repro.test.mjs`: Auto-jump mechanism
  - `plantGrowthRestoration.test.mjs`: Plant state persistence
  - `reproductionDeep.test.mjs`: Complete world workflows

### UI System (`src/ui/`)

- **`BlockGarden.mjs`**: Main Web Component with Shadow DOM
  - Custom `<block-garden>` element
  - Initializes all UI subsystems
  - Manages DOM lifecycle
- **`controls/`**: Event handling infrastructure
  - **`eventListeners/`**: Specific input handlers
    - `canvasListeners.mjs`: Mouse and touch canvas interactions
    - `elementListeners.mjs`: DOM element event hooks
    - `handleGenerateButton.mjs`: World generation UI
    - `handleRandomSeedButton.mjs`: Random seed button
    - `initGenerationControlListeners.mjs`: World generation menu setup
    - `materialBar.mjs`: Block selection bar input
    - `planting.mjs`: Plant/seed placement logic
    - `radiusControls.mjs`: Dig radius adjustment
    - `resizeObserver.mjs`: Window resize handling
    - `touchToggle.mjs`: Touch mode alternatives
  - **`hammerControls.mjs`**: Touch gesture handling (Hammer.js)
  - **`touchControls.mjs`**: Mobile-specific controls
- **`components/`**: Reusable form elements
  - Custom `<select>` and `<option>` implementations
  - Styled with CSS variables for theming
- **`dialog/`**: Modal dialogs for menus and settings
  - `about.mjs`: About/credits dialog
  - `examples.mjs`: Community examples showcase
  - `gettingStarted.mjs`: Tutorial and welcome flow
  - `inventory.mjs`: Player inventory management
  - `linkConfiguration.mjs`: URL parameter/link editor
  - `privacy.mjs`: Privacy policy dialog
  - `storage.mjs`: Save management, list, delete, import/export worlds
  - `textConfiguration.mjs`: Text-based configuration dialog
  - `url.mjs`: URL state synchronization
  - `colors/`: Color customization
    - `resetColors.mjs`: Reset to defaults
    - `saveColors.mjs`: Save custom colors
- **`materialBar.mjs`**: Block/material selection bar display
- **`effects.mjs`**: UI animations and transitions
- **`utils/`**: UI utility functions
  - `getShadowRoot.mjs`: Access shadow DOM from different contexts
  - `waitForElement.mjs`: Promise-based DOM polling
  - `pollForElement.mjs`: Recurring element polling
  - `canControlCanvas.mjs`: Check focus/control status
  - `closeMenus.mjs`: Close all open dialogs
  - `digHighlight.mjs`: Render dig preview visual
  - `flightToggle.mjs`: Flight mode toggle
  - `handleCornerClick.mjs`: Corner UI click handling

### Public API (`src/api/`)

Allows extensions, mods, and community integrations:

- **`BlockGarden.mjs`**: Main API class (~764 lines)
  - World access (`getWorld()`, `setWorld()`)
  - Block interactions (place, break, paint)
  - Color management and theming
  - Block break listeners for plugins
  - Toast notifications
  - Full player control

- **`examples/`**: Community extension examples
  - **`Fireworks.mjs`**: Particle effects demonstration
  - **`GOL.mjs`**: Conway's Game of Life simulation
  - **`KonamiCode.mjs`**: Easter egg trigger
  - **`Link.mjs`**: Deep linking and world sharing
  - **`Messaging.mjs`**: Window communication example
  - **`Photo.mjs`**: Photo placement and rendering
  - **`TicTacToe.mjs`**: Playable game in world
  - **`Video.mjs`**: Video playback on blocks
  - `index.mjs`: Example collection loader
  - `index.html`: Example gallery page

- **`player/`**: Programmatic player control utilities
  - `createKeyEvent.mjs`: Synthetic keyboard events
  - `pressKey.mjs`: Simulate key presses
  - `movement.mjs`: Programmatic player movement

- **`ui/`**: Canvas and UI helpers
  - `resizeCanvas.mjs`: Canvas resize utilities
  - `toast.mjs`: Toast notification system

- **`misc/`**: Utility functions
  - `actions.mjs`: Common action sequences
  - `characters.mjs`: Special character definitions
  - `keys.mjs`: Keyboard key definitions
  - `sleep.mjs`: Async sleep utility

### Utilities (`src/utils/`)

- **`colors/`**: Comprehensive color system
  - `cssColorToRGB.mjs`: Parse CSS colors
  - `rgbToHex.mjs`: RGB to hex conversion
  - `nearestColor.mjs`: Find closest matching block color
  - `getCustomProperties.mjs`: Read CSS custom properties
  - `buildStyleMapByPropNames.mjs`: Generate style maps
  - `transformStyleMap.mjs`: Apply color transformations
  - `generateColorVars.mjs`: Create CSS variables
  - `applyColorsToShadowHost.mjs`: Apply theme to Shadow DOM
  - `customColors.mjs`: Custom color storage
  - `normalizeRGB.mjs`: RGB normalization

- **Block interaction**
  - `interaction.mjs`: Mining, placing, farming logic (~878 lines)
  - `isSolid.mjs`: Block solidity checks
  - `isOnGround.mjs`: Ground contact detection

- **Raycasting & Math**
  - `raycastFromCanvasCoords.mjs`: Ray-to-world conversion
  - `math.mjs`: Vector, matrix, utility functions
  - `ray.mjs`: Ray intersection algorithms
  - `noise.mjs`: Simplex noise utilities

- **Data serialization & Compression**
  - `compression.mjs`: GZIP compression/decompression
  - `conversion.mjs`: Data format conversions
  - `saveData.mjs`: Save file utilities
  - `urlParams.mjs`: URL parameter encoding/decoding
  - `extractAttachments.mjs`: Extract data from PDFs

- **Utility functions**
  - `copyToClipboard.mjs`: Clipboard operations
  - `debounce.mjs`: Function debouncing
  - `effect.mjs`: Reactive side effects
  - `formatWorldName.mjs`: World name formatting
  - `getDateTime.mjs`: Date/time utilities
  - `getRandomInt.mjs`: Random number generation
  - `getRandomSeed.mjs`: Seed generation
  - `getBiome.mjs`: Biome lookup
  - `collectDrop.mjs`: Item collection mechanics
  - `canvasToPngWithState.mjs`: Canvas export with world state

- **Canvas utilities**
  - `canvasToPngWithState.mjs`: Export canvas as PNG with embedded world data

### Build & Deployment Infrastructure

- **Rollup**: ES module bundling with tree-shaking
  - `rollup.config.mjs`: Multi-output bundle configuration
  - Produces both bundled and unbundled distributions

- **Service Worker**: Workbox for PWA support
  - `service-worker/init.mjs`: Service worker initialization
  - `service-worker/share-target-handler.mjs`: Share target protocol
  - `service-worker/workbox-config.cjs`: Workbox configuration
  - Offline support and intelligent caching

- **Build Scripts**: Comprehensive build utilities in `bin/`
  - `build.sh`: Main build orchestration
  - `serve.mjs`: Development server with hot reload
  - `build-html.mjs`: HTML template building
  - `base64-encode-*.sh`: Single-file bundle creation
  - `add-site-verification.mjs`: SEO/verification setup
  - `analyze-trace.mjs`: Performance trace analysis
  - File operations: `ncp.mjs`, `rimraf.mjs`, `touch-nojekyll.mjs`

- **PWA & Deployment**
  - `manifest.json`: PWA manifest with icons and metadata
  - `assets/icons/`: Multiple icon sizes (48px - 1024px)
  - `404.html`: Custom 404 page for SPA routing
  - `privacy/index.html`: Privacy policy page
  - `about/index.html`: About page with features and links
  - `share/share-target.html`: Share target handler page

- **Deployment targets**
  - GitHub Pages (base path: `/block-garden/`)
  - Automatic CI/CD with GitHub Actions
  - Production build optimization

### Dependencies (`deps/`)

External dependencies served as ES modules:

- `signal.mjs`: Signal-polyfill for reactive state
- `simplex-noise.mjs`: Procedural generation
- `hammerjs.mjs`: Touch gesture handling
- `localForage.mjs`: IndexedDB wrapper
- `workbox-window.mjs`: Service worker client
- `qrcode.mjs`: QR code generation
- `pdf-lib.mjs`: PDF creation and manipulation
- `alea.mjs`: Seeded random number generator
- `isNumber.mjs`: Type checking utility
- `konami-code-js.mjs`: Easter egg detection

## 🛠️ Key Implementation Details

### Chunk Meshing (`src/core/world/meshing/chunkMesher.mjs`)

- **Greedy Algorithm**: Optimizes geometry by combining adjacent faces into larger quads
- **Three Render Passes**:
  - Opaque geometry (dirt, stone, etc.)
  - Transparent blocks (glass, leaves) with proper depth sorting
  - Water with special wave/reflection effects
- **Ambient Occlusion**: Per-vertex AO based on neighboring block face exposure creates shadowing
- **Performance Critical**: Remeshing triggered on any block change within a chunk (~64-block cubes)
- Uses typed arrays (Float32Array, Uint16Array) for efficient GPU memory

### Game Loop Pattern (`src/core/systems/game/loop.mjs`)

- **Fixed Timestep**: Consistent update intervals for physics determinism
- **Frame Budget**: All game logic fits within ~16ms frame window
- **Update Order**:
  1. Physics integration (velocity, acceleration)
  2. Collision detection and response
  3. Player input processing
  4. Plant growth and updates
  5. Lighting updates (if needed)
  6. WebGL render pass
- **Adaptive**: Handles frame skipping gracefully if performance drops
- **Signal triggers**: Updates trigger reactive UI updates automatically

### State Management (`src/core/systems/game/state.mjs`)

- **Signals**: Every mutable game state is a `Signal` for fine-grained reactivity
  - World state (chunks, voxels, plants)
  - Player state (position, inventory, selection)
  - UI state (dialog visibility, hotbar selection)
- **Computed Signals**: Derived properties auto-update when dependencies change
  - Camera position (derived from player position)
  - Visible chunks (derived from player position + view distance)
  - UI text (derived from selected block + inventory count)
- **No Re-render Overhead**: Only affected UI updates when signals change - not full page re-renders
- **Helper patterns**:
  ```javascript
  getState(stateSignal); // Read current value
  setState(stateSignal, newValue); // Write new value
  updateState(stateSignal, fn); // Functional update
  ```

### Storage & Persistence (`localforage` + compression)

- **IndexedDB**: Unlimited offline storage for world saves
- **Compression**: World state compressed with gzip before storage (10-100MB → 1-10MB)
- **Migration**: Auto-migration between save format versions in `loadSave.mjs`
- **Formats supported**:
  - Native IndexedDB saves (JSON)
  - PDF-embedded saves (using pdf-lib)
  - PNG-embedded saves (using canvas data)
  - URL-encoded saves (for sharing via link)
- **Sharing**: Full world snapshots can be saved as individual files and re-imported

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

- **Jest Testing Framework**: All `.mjs` files have accompanying `.test.mjs` files
- **ES Module Support**: `NODE_OPTIONS=--experimental-vm-modules jest` for native ESM

- **Test Types**:
  - **Unit Tests**: Math utilities, color conversions, compression, noise generation
  - **Integration Tests**:
    - World generation pipelines (terrain + biomes)
    - Chunk management (load/unload/remesh)
    - Save/load roundtrips with data integrity
    - Plant growth state transitions
  - **E2E/Reproduction Tests**: Full game scenarios
    - `BlockGarden.reproduction.test.mjs`: Complex multi-step workflows
    - `autoJump_repro.test.mjs`: Auto-jump physics edge cases
    - `reproductionDeep.test.mjs`: Full world lifecycle

- **Test Organization**:
  - File-local tests: `file.mjs` → `file.test.mjs` (unit focus)
  - Feature-level tests: `feature.integration.test.mjs` (complex workflows)
  - Reproduction tests: `*.repro.test.mjs` (user-reported scenarios)
  - Coverage: Comprehensive for `src/core/`, `src/utils/`, critical `src/ui/` logic

- **Running Tests**:
  - `npm test`: Full test suite once
  - `npm test -- --watch`: Watch mode for development
  - `npm test -- --testNamePattern="pattern"`: Run specific tests

## 💾 File Organization Rules

- **ES Modules Only**: `.mjs` extension required for all JavaScript
- **Colocation**: Tests live alongside source files (`file.mjs` → `file.test.mjs`)
- **No Frameworks**: Vanilla JS, standard DOM APIs, Web Components only
- **Types**: JSDoc with `@typedef` for complex types (checkJs enabled in tsconfig.json, no TypeScript compilation)
- **Exports**: Named exports preferred; default for single-purpose modules
- **Shadow DOM**: All UI components use Shadow DOM (`mode: 'open'`) for encapsulation
- **Dependencies**: Vendored in `deps/` folder for single-file distribution
- **Public API**: All extension exports via `src/api/BlockGarden.mjs`

## 🎨 Code Style & Patterns

- Use **JSDoc** for types and comprehensive documentation
  - `@typedef` for complex type definitions
  - Parameter types on all public functions
  - Return type annotations
  - Examples for complex functions

- Prefer **vanilla browser APIs** over third-party libraries
  - Use Web Components instead of frameworks
  - Fetch API for network requests
  - IndexedDB via localforage wrapper
  - Canvas API for rendering (WebGL)

- **Signal-based reactivity**: Wrap mutable state in signals

  ```javascript
  const myState = new Signal.State(initialValue);
  getState(myState); // Get value
  setState(myState, value); // Set value
  ```

- **Web Components**: Encapsulate with Shadow DOM and custom elements

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

- **Error Handling**: Graceful degradation
  - Fallbacks for WebGL extensions (ANGLE_instanced_arrays, etc.)
  - Fallbacks for APIs (IndexedDB → localStorage → in-memory)
  - User-friendly error messages in UI

- **CSS Variables**: Prefix with `--bg-` for colors and themeable properties
  ```css
  :root {
    --bg-dirt: #8b4513;
    --bg-stone: #808080;
  }
  ```

## 🔍 Common Tasks

### Adding a New Block Type

1. Add definition to [src/core/world/config/blocks.mjs](src/core/world/config/blocks.mjs)
   - Set properties: `solid`, `transparent`, `colorIndex`
2. Add color to [src/core/world/config/colors.mjs](src/core/world/config/colors.mjs)
3. Update [src/core/world/meshing/chunkMesher.mjs](src/core/world/meshing/chunkMesher.mjs) if custom rendering
4. Add to biome generation if terrain block
5. Test with Jest: `src/core/world/config/blocks.test.mjs`

### Adding a New Plant Species

1. Create plant file in [src/core/world/plants/](src/core/world/plants/) with growth stages
   - Export growth stage definitions
   - Define planting requirements (soil blocks, light, water)
2. Register in [src/core/world/plants/index.mjs](src/core/world/plants/index.mjs)
3. Add planting UI to [src/ui/controls/eventListeners/planting.mjs](src/ui/controls/eventListeners/planting.mjs)
4. Add growth rules to [src/core/systems/plantGrowth.mjs](src/core/systems/plantGrowth.mjs)
5. Define drop items in game loot table
6. Test with [src/core/world/plants/plants.test.mjs](src/core/world/plants/plants.test.mjs)

### Creating an Extension/Mod

1. Extend the `BlockGarden` class from [src/api/BlockGarden.mjs](src/api/BlockGarden.mjs)
2. Use public API methods:
   - `getWorld()`, `setWorld()` - Access chunks and voxels
   - `getBlock(x,y,z)`, `setBlock(x,y,z,blockId)` - Get/set blocks
   - `onBlockBreak(callback)` - Listen to player mining
   - `toast(message)` - Show notifications
   - `resizeCanvas()` - Manage render canvas
3. Load from HTML or programmatically via JavaScript
4. See [src/api/examples/](src/api/examples/) for working examples

### Modifying Game State

1. Add signal to [src/core/systems/game/state.mjs](src/core/systems/game/state.mjs)
   - Use `new Signal.State()` for mutable state
   - Use `Signal.Computed()` for derived values
2. Update in appropriate system handler (physics, player, plant growth, etc.)
3. UI auto-updates when signal changes - no manual binding needed
4. Add tests to verify state transitions

### Optimizing Performance

- **Meshing**: Check [src/core/world/meshing/chunkMesher.mjs](src/core/world/meshing/chunkMesher.mjs) for geometry generation improvements
- **Lighting**: Profile [src/core/world/lighting/](src/core/world/lighting/) light propagation
- **Rendering**: Monitor frame budget in [src/core/systems/game/loop.mjs](src/core/systems/game/loop.mjs)
- **Memory**: Watch large arrays (chunks are Uint8Array, geometry floats are Float32Array)
- **Profiling**: Use DevTools Performance tab, trace individual frame updates

## 🐛 Debugging Tips

- **State Inspection**: Check `window.blockGarden.state` in DevTools console
  - Access signals directly: `console.log(getState(state.world))`
  - Monitor signal changes: Use signal subscriptions

- **WebGL Debugging**:
  - Chrome/Firefox WebGL shader debuggers in DevTools
  - Check WebGL errors: `ctx.getError()` after draw calls
  - Validate shader compilation in [src/core/render/graphics.mjs](src/core/render/graphics.mjs)

- **Canvas Logging**: Add `console.log()` in render functions
  - Avoid per-frame logging (100s messages/second kills performance)
  - Use conditional logging: `if (debugMode) console.log(...)`

- **Performance Profiling**:
  - DevTools Performance tab: Record frames, analyze flame graph
  - Look for bottlenecks in: meshing, physics, update loop
  - Frame rate indicator shows if GPU-bound vs CPU-bound

- **Chunk Issues**: Trace in [src/core/world/chunkManager.mjs](src/core/world/chunkManager.mjs)
  - Check load/unload timing
  - Verify remesh triggers on block changes
  - Monitor memory usage of chunk pool

- **Physics Issues**:
  - Check AABB collision in [src/core/systems/physics.mjs](src/core/systems/physics.mjs)
  - Verify chunk geometry matches physics colliders
  - Debug movement in [src/core/systems/player.mjs](src/core/systems/player.mjs)

- **Lighting Problems**:
  - Verify light propagation in [src/core/world/lighting/](src/core/world/lighting/)
  - Check ambient occlusion calculations in mesher
  - Validate day/night transitions in [src/core/world/time/](src/core/world/time/)

- **Persistence Bugs**:
  - Check version migration in [src/core/loadSave.mjs](src/core/loadSave.mjs)
  - Verify compression roundtrips in [src/utils/compression.mjs](src/utils/compression.mjs)
  - Test save/load cycle in [src/api/BlockGarden.test.mjs](src/api/BlockGarden.test.mjs)

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
