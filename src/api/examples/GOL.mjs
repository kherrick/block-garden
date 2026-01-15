import { BlockGarden } from "../BlockGarden.mjs";

export class GOL extends BlockGarden {
  game;

  createGameOfLife(config = {}) {
    const gameHeight = 40;
    const gameWidth = 40;
    const gameDepth = 12;

    const {
      x = 10,
      y = 60,
      z = 10,
      width = gameWidth,
      height = gameHeight,
      depth = gameDepth,
      aliveBlock = this.getBlockIdByName("Rose"),
      deadBlock = this.getBlockIdByName("Ice"),
      borderBlock = this.getBlockIdByName("Bedrock"),
      updateInterval = 200,
      initialPattern = "random",
      randomDensity = 0.3,
      wrapAround = false,
      showBorder = true,
    } = config;

    console.log(
      `🎯 Game area: X[${x} to ${x + width - 1}], Y[${y} to ${y + height - 1}], Z[${z} to ${z + depth - 1}]`,
    );
    console.log(`🧱 Border block ID: ${borderBlock} (Bedrock)`);
    console.log(`🌹 Alive block ID: ${aliveBlock} (Rose)`);
    console.log(`❄️  Dead block ID: ${deadBlock} (Ice)`);

    // Initialize grid: [height][width][depth]
    let grid = Array(height)
      .fill(0)
      .map(() =>
        Array(width)
          .fill(0)
          .map(() => Array(depth).fill(0)),
      );

    // Set initial pattern
    if (initialPattern === "random") {
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          for (let slice = 0; slice < depth; slice++) {
            grid[row][col][slice] = Math.random() < randomDensity ? 1 : 0;
          }
        }
      }
    } else if (initialPattern === "glider") {
      const glider = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];

      for (let r = 0; r < glider.length; r++) {
        for (let c = 0; c < glider[0].length; c++) {
          if (r < height && c < width) {
            for (let s = 0; s < 4; s++) {
              if (s < depth) grid[r][c][s] = glider[r][c];
            }
          }
        }
      }
    } else if (initialPattern === "sphere") {
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const centerZ = Math.floor(depth / 2);
      const radius = 8;

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          for (let slice = 0; slice < depth; slice++) {
            const dx = col - centerX;
            const dy = row - centerY;
            const dz = slice - centerZ;
            if (dx * dx + dy * dy + dz * dz <= radius * radius) {
              grid[row][col][slice] = 1;
            }
          }
        }
      }
    }

    // Finite bounds neighbor counting
    const countNeighborsFinite = (row, col, slice) => {
      let count = 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0 && dz === 0) continue;
            const nr = row + dy;
            const nc = col + dx;
            const ns = slice + dz;
            if (
              nr >= 0 &&
              nr < height &&
              nc >= 0 &&
              nc < width &&
              ns >= 0 &&
              ns < depth
            ) {
              count += grid[nr][nc][ns];
            }
          }
        }
      }
      return count;
    };

    // Toroidal wrapping neighbor counting
    const countNeighborsToroidal = (row, col, slice) => {
      let count = 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0 && dz === 0) continue;

            const nr = (row + dy + height) % height;
            const nc = (col + dx + width) % width;
            const ns = (slice + dz + depth) % depth;

            count += grid[nr][nc][ns];
          }
        }
      }
      return count;
    };

    const countNeighbors = wrapAround
      ? countNeighborsToroidal
      : countNeighborsFinite;

    // Render current grid state
    const renderGrid = () => {
      const updates = [];
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          for (let slice = 0; slice < depth; slice++) {
            const block = grid[row][col][slice] === 1 ? aliveBlock : deadBlock;

            updates.push({
              x: x + col,
              y: y + row,
              z: z + slice,
              block,
            });
          }
        }
      }
      this.batchSetBlocks(updates);
    };

    // Draw simple rectangular border frame (like 2D version but in 3D)
    const drawBorder = () => {
      if (!showBorder) return;

      const updates = [];

      // In 2D: drawBorder draws a rectangle outline
      // In 3D: we need to draw 12 edges of a rectangular prism (box edges only, not faces)

      // 4 edges on bottom face (Y = y - 1)
      for (let ix = x - 1; ix <= x + width; ix++) {
        updates.push({ x: ix, y: y - 1, z: z - 1, block: borderBlock }); // front bottom edge
        updates.push({ x: ix, y: y - 1, z: z + depth, block: borderBlock }); // back bottom edge
      }
      for (let iz = z - 1; iz <= z + depth; iz++) {
        updates.push({ x: x - 1, y: y - 1, z: iz, block: borderBlock }); // left bottom edge
        updates.push({ x: x + width, y: y - 1, z: iz, block: borderBlock }); // right bottom edge
      }

      // 4 edges on top face (Y = y + height)
      for (let ix = x - 1; ix <= x + width; ix++) {
        updates.push({ x: ix, y: y + height, z: z - 1, block: borderBlock }); // front top edge
        updates.push({
          x: ix,
          y: y + height,
          z: z + depth,
          block: borderBlock,
        }); // back top edge
      }
      for (let iz = z - 1; iz <= z + depth; iz++) {
        updates.push({ x: x - 1, y: y + height, z: iz, block: borderBlock }); // left top edge
        updates.push({
          x: x + width,
          y: y + height,
          z: iz,
          block: borderBlock,
        }); // right top edge
      }

      // 4 vertical edges connecting top and bottom
      for (let iy = y - 1; iy <= y + height; iy++) {
        updates.push({ x: x - 1, y: iy, z: z - 1, block: borderBlock }); // front-left vertical edge
        updates.push({ x: x + width, y: iy, z: z - 1, block: borderBlock }); // front-right vertical edge
        updates.push({ x: x - 1, y: iy, z: z + depth, block: borderBlock }); // back-left vertical edge
        updates.push({ x: x + width, y: iy, z: z + depth, block: borderBlock }); // back-right vertical edge
      }

      console.log(
        `🧱 Placing ${updates.length} border blocks (wireframe edges only)`,
      );
      this.batchSetBlocks(updates);
    };

    // Draw border FIRST, then game content (so we can see if border gets overwritten)
    drawBorder();
    renderGrid();

    // Update grid according to Conway's Game of Life rules
    const updateGrid = () => {
      const newGrid = Array(height)
        .fill(0)
        .map(() =>
          Array(width)
            .fill(0)
            .map(() => Array(depth).fill(0)),
        );

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          for (let slice = 0; slice < depth; slice++) {
            const neighbors = countNeighbors(row, col, slice);
            const alive = grid[row][col][slice] === 1;

            if (alive && (neighbors === 2 || neighbors === 3)) {
              newGrid[row][col][slice] = 1; // Survival
            } else if (!alive && neighbors === 3) {
              newGrid[row][col][slice] = 1; // Birth
            } else {
              newGrid[row][col][slice] = 0; // Death
            }
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
          .map(() =>
            Array(width)
              .fill(0)
              .map(() => Array(depth).fill(0)),
          );
        renderGrid();
        drawBorder();
      },
      getMode: () => (wrapAround ? "toroidal" : "finite"),
      redrawBorder: drawBorder,
    };
  }
}

export async function demo() {
  const api = new GOL();
  await api.setFullscreen();

  console.log("🎮 BlockGarden Demo: Conway's Game of Life");

  api.game = api.createGameOfLife({
    x: 10,
    y: 55,
    z: 10,
    width: 35,
    height: 35,
    depth: 12,
    updateInterval: 150,
    initialPattern: "random",
    randomDensity: 0.28,
    aliveBlock: api.getBlockIdByName("Rose"),
    deadBlock: api.getBlockIdByName("Ice"),
    borderBlock: api.getBlockIdByName("Bedrock"),
    wrapAround: true,
    showBorder: false,
  });

  const apiText = "blockGarden.demo.gameOfLife.game";

  console.log("🧬 Game of Life started!");
  console.log(`💡 Use ${apiText}.stop() to pause`);
  console.log(`💡 Use ${apiText}.step() to advance one generation`);
  console.log(`💡 Use ${apiText}.clear() to reset`);
  console.log(`💡 Use ${apiText}.redrawBorder() to redraw border`);
  console.log(
    `💡 Current mode: ${api.game.getMode()} (patterns ${api.game.getMode() === "toroidal" ? "LOOP FOREVER" : "die at edges"})`,
  );

  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    gameOfLife: api,
  };
}
