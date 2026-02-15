# GitHub Copilot Instructions - Block Garden

Block Garden is a vanilla JavaScript voxel-based gardening simulator using Web Components and modern web APIs. It prioritizes high performance, visual excellence, and modular design.

## 🛠️ Tech Stack & Patterns

- **No Frameworks**: Use standard HTML, CSS, and Vanilla JS. Avoid React, Vue, or other external frameworks.
- **Signals**: Use `signal-polyfill` for reactivity. Follow the pattern in `src/core/systems/game/state.mjs`.
  - Use `Signal.State` for mutable state.
  - Use `Signal.Computed` for derived state.
  - Use helper functions: `getState`, `setState`, `updateState`, `getConfig`, `setConfig`, `updateConfig`.
- **Web Components**: Use standard Custom Elements (e.g., `<block-garden>`).
  - Always use Shadow DOM (`mode: 'open'`) for encapsulation.
  - Use `<template>` and `<style>` blocks for component definitions.
- **Styling**: Use Vanilla CSS within Shadow DOM.
  - Use CSS variables for colors and themeable properties, prefixed with `--bg-`.
  - Prefer modern CSS features (Grid, Flexbox, Aspect Ratio).
- **ES Modules**: Always use `.mjs` extensions for JavaScript modules.
- **Type Safety**: Use JSDoc for type definitions. The project has `checkJs: true` enabled in `tsconfig.json`.
  - Define complex types using `@typedef`.
  - Annotate parameters and return values with accurate types.

## 📂 Key Directories

- `src/core/world/`: Core voxel engine, including:
  - `generation/`: Chunk generation and terrain logic.
  - `meshing/`: Greedy meshing and quad generation.
  - `lighting/`: Light propagation and system updates.
  - `config/`: Block definitions, biomes, and color palettes.
- `src/core/systems/`: Game logic systems:
  - `game/`: State management, initialization, and world generation.
  - `physics/`: Collision detection and movement.
- `src/ui/`: UI components (using Shadow DOM).
  - `components/`: Reusable UI elements like buttons and selects.
  - `dialog/`: Content and logic for in-game menus and overlays.
- `src/utils/`: Generic utility functions (math, colors, interaction).
- `src/api/`: Public API exposed for extensions and demo integration.

## 🏛️ Architecture & Best Practices

- **Performance**: High priority on efficient meshing and lighting updates. Avoid expensive per-frame logic unless necessary.
- **State management**: Centralized in `src/core/systems/game/state.mjs`. Signals should be the primary way to manage reactive UI and game logic.
- **Memory**: Be mindful of large arrays (e.g., chunk data). Use `Uint8Array` or similar for memory-intensive data.
- **Clean Code**: Follow a modular, decoupled approach. Avoid tight coupling between core engine and UI.

## 🧪 Testing

- **Unit Tests**: Always look for and maintain accompanying `.test.mjs` files using Node's test runner or appropriate framework.
- **Coverage**: Ensure new features, especially in `src/core/`, have robust unit test coverage.
- **Verify**: Run tests before submitting changes to ensure no regressions.
