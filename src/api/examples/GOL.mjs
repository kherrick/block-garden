import { SpriteGarden } from "../SpriteGarden.mjs";

export class GOL extends SpriteGarden {
  createGameOfLife(config = {}) {
    const {
      x = 50,
      y = 20,
      width = 100,
      height = 60,
      aliveTile = this.tiles.LEAVES,
      deadTile = this.tiles.DIRT,
      borderTile = this.tiles.STONE,
      updateInterval = 200,
      initialPattern = "random", // 'random', 'glider', 'blinker', or custom array
      randomDensity = 0.3,
    } = config;

    // Initialize grid
    let grid = Array(height)
      .fill(0)
      .map(() => Array(width).fill(0));

    // Set initial pattern
    if (initialPattern === "random") {
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          grid[row][col] = Math.random() < randomDensity ? 1 : 0;
        }
      }
    } else if (initialPattern === "glider") {
      // Place a glider in the top-left
      const glider = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];
      for (let r = 0; r < glider.length; r++) {
        for (let c = 0; c < glider[0].length; c++) {
          if (r < height && c < width) {
            grid[r][c] = glider[r][c];
          }
        }
      }
    } else if (initialPattern === "blinker") {
      // Place a blinker in center
      const cy = Math.floor(height / 2);
      const cx = Math.floor(width / 2);

      if (cy > 0 && cy < height - 1 && cx > 0 && cx < width - 1) {
        grid[cy][cx - 1] = 1;
        grid[cy][cx] = 1;
        grid[cy][cx + 1] = 1;
      }
    } else if (Array.isArray(initialPattern)) {
      // Custom pattern
      grid = initialPattern;
    }

    // Draw border
    this.drawBorder(x - 1, y - 1, width + 2, height + 2, borderTile);

    // Render initial state
    const renderGrid = () => {
      const updates = [];

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const tile = grid[row][col] === 1 ? aliveTile : deadTile;

          updates.push({ x: x + col, y: y + row, tile });
        }
      }

      this.batchSetTiles(updates);
    };

    renderGrid();

    // Conway's Game of Life rules
    const countNeighbors = (row, col) => {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;

          const r = row + dr;
          const c = col + dc;

          if (r >= 0 && r < height && c >= 0 && c < width) {
            count += grid[r][c];
          }
        }
      }
      return count;
    };

    const updateGrid = () => {
      const newGrid = Array(height)
        .fill(0)
        .map(() => Array(width).fill(0));

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const neighbors = countNeighbors(row, col);
          const alive = grid[row][col] === 1;

          // Conway's rules
          if (alive && (neighbors === 2 || neighbors === 3)) {
            newGrid[row][col] = 1; // Survival
          } else if (!alive && neighbors === 3) {
            newGrid[row][col] = 1; // Birth
          } else {
            newGrid[row][col] = 0; // Death
          }
        }
      }

      grid = newGrid;

      renderGrid();
    };

    // Start animation loop
    const intervalId = setInterval(updateGrid, updateInterval);

    // Return control object
    return {
      stop: () => clearInterval(intervalId),
      getGrid: () => grid,
      setGrid: (newGrid) => {
        grid = newGrid;
        renderGrid();
      },
      step: updateGrid,
      clear: () => {
        grid = Array(height)
          .fill(0)
          .map(() => Array(width).fill(0));
        renderGrid();
      },
    };
  }
}

export async function demo() {
  const api = new GOL();

  // Setup
  await api.setFullscreen();

  api.setFogMode("clear");
  api.setBreakMode("extra");

  console.log("🎮 SpriteGarden Demo: Conway's Game of Life");

  // Start Game of Life
  api.game = api.createGameOfLife({
    x: 150,
    y: 10,
    width: 80,
    height: 50,
    updateInterval: 150,
    initialPattern: "random",
    randomDensity: 0.35,
    aliveTile: api.tiles.LAVA,
    deadTile: api.tiles.WATER,
    borderTile: api.tiles.CLAY,
  });

  const apiText = "spriteGarden.demo.gameOfLifeAPI.game";

  console.log("🧬 Game of Life started!");
  console.log(`💡 Use ${apiText}.stop() to pause`);
  console.log(`💡 Use ${apiText}.step() to advance one generation`);
  console.log(`💡 Use ${apiText}.clear() to reset`);

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    gameOfLifeAPI: api,
  };
}
