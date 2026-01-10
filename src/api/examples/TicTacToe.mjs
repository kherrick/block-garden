import { BlockGarden } from "../BlockGarden.mjs";

export class TicTacToe extends BlockGarden {
  game;

  createTicTacToe(config = {}) {
    const {
      x = 15,
      y = 60,
      z = 15,
      cellSize = 5,
      spacing = 2,
      xBlock = this.getBlockIdByName("Coal"),
      oBlock = this.getBlockIdByName("Snow"),
      emptyBlock = this.getBlockIdByName("Ice"),
      borderBlock = this.getBlockIdByName("Bedrock"),
      lineBlock = this.getBlockIdByName("Gold"),
      showBorder = true,
    } = config;

    // Game state: 3x3 grid (0=empty, 1=X, 2=O)
    let board = Array(3)
      .fill(0)
      .map(() => Array(3).fill(0));
    let currentPlayer = 1; // 1=X, 2=O
    let gameOver = false;
    let winLine = null;

    const boardWidth = cellSize * 3 + spacing * 2;
    const boardHeight = cellSize * 3 + spacing * 2;

    // Reset button configuration
    const resetButtonSize = 3;
    const resetButtonY = y + boardHeight + 3; // 3 blocks above the board
    const resetButtonX =
      x + Math.floor(boardWidth / 2) - Math.floor(resetButtonSize / 2);
    const resetBlock = this.getBlockIdByName("Iron");

    console.log(`🎮 Tic-Tac-Toe Board Setup:`);
    console.log(`   Position: (${x}, ${y}, ${z})`);
    console.log(`   Board size: ${boardWidth}x${boardHeight}`);
    console.log(`   Cell size: ${cellSize}x${cellSize}`);
    console.log(`   Reset button: (${resetButtonX}, ${resetButtonY}, ${z})`);

    // Get cell coordinates from world position
    const getCellFromPosition = (wx, wy, wz) => {
      if (wz !== z) {
        return null;
      }

      const relX = wx - x;
      const relY = wy - y;

      if (relX < 0 || relX >= boardWidth || relY < 0 || relY >= boardHeight) {
        return null;
      }

      // Determine which cell (accounting for spacing)
      let col = -1;
      let row = -1;

      // Calculate column
      if (relX < cellSize) {
        col = 0;
      } else if (relX >= cellSize + spacing && relX < cellSize * 2 + spacing) {
        col = 1;
      } else if (relX >= cellSize * 2 + spacing * 2) {
        col = 2;
      }

      // Calculate row
      if (relY < cellSize) {
        row = 0;
      } else if (relY >= cellSize + spacing && relY < cellSize * 2 + spacing) {
        row = 1;
      } else if (relY >= cellSize * 2 + spacing * 2) {
        row = 2;
      }

      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        return { row, col };
      }

      return null;
    };

    // Get world coordinates for a cell
    const getCellPosition = (row, col) => {
      const cellX = x + col * (cellSize + spacing);
      const cellY = y + row * (cellSize + spacing);

      return { x: cellX, y: cellY };
    };

    // Draw a single cell with X or O pattern
    const drawCell = (row, col) => {
      const { x: cellX, y: cellY } = getCellPosition(row, col);
      const updates = [];
      const state = board[row][col];

      // Draw the base cell
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          let block = emptyBlock;

          if (state === 1) {
            // Draw X pattern (diagonals)
            if (dx === dy || dx === cellSize - 1 - dy) {
              block = xBlock;
            } else {
              block = emptyBlock;
            }
          } else if (state === 2) {
            // Draw O pattern (hollow square/circle)
            const isEdge =
              dx === 0 ||
              dx === cellSize - 1 ||
              dy === 0 ||
              dy === cellSize - 1;

            const isCorner =
              (dx === 0 || dx === cellSize - 1) &&
              (dy === 0 || dy === cellSize - 1);

            if (isEdge && !isCorner) {
              block = oBlock;
            } else {
              block = emptyBlock;
            }
          }

          updates.push({
            x: cellX + dx,
            y: cellY + dy,
            z: z,
            block,
          });
        }
      }

      this.batchSetBlocks(updates);
    };

    // Draw the entire board
    const drawBoard = () => {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          drawCell(row, col);
        }
      }
    };

    // Draw border
    const drawBorder = () => {
      if (!showBorder) {
        return;
      }

      const updates = [];
      const margin = 1;

      // Top and bottom borders
      for (let dx = -margin; dx <= boardWidth + margin - 1; dx++) {
        updates.push({ x: x + dx, y: y - margin, z, block: borderBlock });
        updates.push({
          x: x + dx,
          y: y + boardHeight + margin - 1,
          z,
          block: borderBlock,
        });
      }

      // Left and right borders
      for (let dy = -margin; dy <= boardHeight + margin - 1; dy++) {
        updates.push({ x: x - margin, y: y + dy, z, block: borderBlock });
        updates.push({
          x: x + boardWidth + margin - 1,
          y: y + dy,
          z,
          block: borderBlock,
        });
      }

      this.batchSetBlocks(updates);
    };

    // Draw reset button
    const drawResetButton = () => {
      const updates = [];

      for (let dy = 0; dy < resetButtonSize; dy++) {
        for (let dx = 0; dx < resetButtonSize; dx++) {
          updates.push({
            x: resetButtonX + dx,
            y: resetButtonY + dy,
            z: z,
            block: resetBlock,
          });
        }
      }

      this.batchSetBlocks(updates);
      console.log("🔄 Reset button drawn");
    };

    // Draw direction indicators (arrows pointing to front)
    const drawDirectionIndicators = () => {
      const updates = [];
      const indicatorBlock = this.getBlockIdByName("Stone");
      const arrowBlock = this.getBlockIdByName("Grass");

      // Left arrow indicator
      const leftArrowX = x - 4;
      const leftArrowY = y + Math.floor(boardHeight / 2);

      // Arrow pointing right (toward front): >
      updates.push({ x: leftArrowX, y: leftArrowY, z: z, block: arrowBlock });
      updates.push({
        x: leftArrowX + 1,
        y: leftArrowY + 1,
        z: z,
        block: arrowBlock,
      });

      updates.push({
        x: leftArrowX + 1,
        y: leftArrowY - 1,
        z: z,
        block: arrowBlock,
      });

      // Right arrow indicator
      const rightArrowX = x + boardWidth + 3;
      const rightArrowY = y + Math.floor(boardHeight / 2);

      // Arrow pointing left (toward front): <
      updates.push({ x: rightArrowX, y: rightArrowY, z: z, block: arrowBlock });
      updates.push({
        x: rightArrowX - 1,
        y: rightArrowY + 1,
        z: z,
        block: arrowBlock,
      });

      updates.push({
        x: rightArrowX - 1,
        y: rightArrowY - 1,
        z: z,
        block: arrowBlock,
      });

      this.batchSetBlocks(updates);
      console.log("➡️ Direction indicators drawn - FRONT is at Z=" + z);
    };

    // Check for winner
    const checkWinner = () => {
      // Check rows
      for (let row = 0; row < 3; row++) {
        if (
          board[row][0] !== 0 &&
          board[row][0] === board[row][1] &&
          board[row][1] === board[row][2]
        ) {
          return { winner: board[row][0], line: { type: "row", index: row } };
        }
      }

      // Check columns
      for (let col = 0; col < 3; col++) {
        if (
          board[0][col] !== 0 &&
          board[0][col] === board[1][col] &&
          board[1][col] === board[2][col]
        ) {
          return { winner: board[0][col], line: { type: "col", index: col } };
        }
      }

      // Check diagonals
      if (
        board[0][0] !== 0 &&
        board[0][0] === board[1][1] &&
        board[1][1] === board[2][2]
      ) {
        return { winner: board[0][0], line: { type: "diag", index: 0 } };
      }
      if (
        board[0][2] !== 0 &&
        board[0][2] === board[1][1] &&
        board[1][1] === board[2][0]
      ) {
        return { winner: board[0][2], line: { type: "diag", index: 1 } };
      }

      // Check for draw
      const isFull = board.every((row) => row.every((cell) => cell !== 0));
      if (isFull) {
        return { winner: 0, line: null }; // Draw
      }

      return null;
    };

    // Draw winning line (on both front and back of board)
    const drawWinLine = (line) => {
      if (!line) {
        return;
      }

      const updates = [];
      const centerOffset = Math.floor(cellSize / 2);

      if (line.type === "row") {
        const { x: startX, y: startY } = getCellPosition(line.index, 0);
        const { x: endX } = getCellPosition(line.index, 2);
        const lineY = startY + centerOffset;

        // Draw continuous line across all three cells plus spacing (both sides)
        for (let lx = startX; lx <= endX + cellSize - 1; lx++) {
          updates.push({ x: lx, y: lineY, z: z + 1, block: lineBlock }); // Front
          updates.push({ x: lx, y: lineY, z: z - 1, block: lineBlock }); // Back
        }
      } else if (line.type === "col") {
        const { x: startX, y: startY } = getCellPosition(0, line.index);
        const { y: endY } = getCellPosition(2, line.index);
        const lineX = startX + centerOffset;

        // Draw continuous line down all three cells plus spacing (both sides)
        for (let ly = startY; ly <= endY + cellSize - 1; ly++) {
          updates.push({ x: lineX, y: ly, z: z + 1, block: lineBlock }); // Front
          updates.push({ x: lineX, y: ly, z: z - 1, block: lineBlock }); // Back
        }
      } else if (line.type === "diag") {
        if (line.index === 0) {
          // Top-left to bottom-right - continuous diagonal (both sides)
          const { x: startX, y: startY } = getCellPosition(0, 0);
          const { x: endX, y: endY } = getCellPosition(2, 2);

          const totalDistance = Math.max(
            endX + cellSize - startX,
            endY + cellSize - startY,
          );

          for (let i = 0; i <= totalDistance; i++) {
            const progress = i / totalDistance;
            const lx = Math.round(
              startX + progress * (endX + cellSize - 1 - startX),
            );
            const ly = Math.round(
              startY + progress * (endY + cellSize - 1 - startY),
            );

            updates.push({ x: lx, y: ly, z: z + 1, block: lineBlock }); // Front
            updates.push({ x: lx, y: ly, z: z - 1, block: lineBlock }); // Back
          }
        } else {
          // Top-right to bottom-left - continuous diagonal (both sides)
          const { x: startX, y: startY } = getCellPosition(0, 2);
          const { x: endX, y: endY } = getCellPosition(2, 0);

          const totalDistance = Math.max(
            Math.abs(endX + cellSize - startX),
            endY + cellSize - startY,
          );

          for (let i = 0; i <= totalDistance; i++) {
            const progress = i / totalDistance;
            const lx = Math.round(
              startX + progress * (endX + cellSize - 1 - startX),
            );
            const ly = Math.round(
              startY + progress * (endY + cellSize - 1 - startY),
            );

            updates.push({ x: lx, y: ly, z: z + 1, block: lineBlock }); // Front
            updates.push({ x: lx, y: ly, z: z - 1, block: lineBlock }); // Back
          }
        }
      }

      this.batchSetBlocks(updates);
    };

    // Clear winning line (both sides)
    const clearWinLine = (line) => {
      if (!line) {
        return;
      }

      const updates = [];
      const centerOffset = Math.floor(cellSize / 2);

      if (line.type === "row") {
        const { x: startX, y: startY } = getCellPosition(line.index, 0);
        const { x: endX } = getCellPosition(line.index, 2);
        const lineY = startY + centerOffset;

        for (let lx = startX; lx <= endX + cellSize - 1; lx++) {
          updates.push({ x: lx, y: lineY, z: z + 1, block: 0 }); // Clear front
          updates.push({ x: lx, y: lineY, z: z - 1, block: 0 }); // Clear back
        }
      } else if (line.type === "col") {
        const { x: startX, y: startY } = getCellPosition(0, line.index);
        const { y: endY } = getCellPosition(2, line.index);
        const lineX = startX + centerOffset;

        for (let ly = startY; ly <= endY + cellSize - 1; ly++) {
          updates.push({ x: lineX, y: ly, z: z + 1, block: 0 }); // Clear front
          updates.push({ x: lineX, y: ly, z: z - 1, block: 0 }); // Clear back
        }
      } else if (line.type === "diag") {
        if (line.index === 0) {
          const { x: startX, y: startY } = getCellPosition(0, 0);
          const { x: endX, y: endY } = getCellPosition(2, 2);

          const totalDistance = Math.max(
            endX + cellSize - startX,
            endY + cellSize - startY,
          );

          for (let i = 0; i <= totalDistance; i++) {
            const progress = i / totalDistance;
            const lx = Math.round(
              startX + progress * (endX + cellSize - 1 - startX),
            );

            const ly = Math.round(
              startY + progress * (endY + cellSize - 1 - startY),
            );

            updates.push({ x: lx, y: ly, z: z + 1, block: 0 }); // Clear front
            updates.push({ x: lx, y: ly, z: z - 1, block: 0 }); // Clear back
          }
        } else {
          const { x: startX, y: startY } = getCellPosition(0, 2);
          const { x: endX, y: endY } = getCellPosition(2, 0);

          const totalDistance = Math.max(
            Math.abs(endX + cellSize - startX),
            endY + cellSize - startY,
          );

          for (let i = 0; i <= totalDistance; i++) {
            const progress = i / totalDistance;
            const lx = Math.round(
              startX + progress * (endX + cellSize - 1 - startX),
            );

            const ly = Math.round(
              startY + progress * (endY + cellSize - 1 - startY),
            );

            updates.push({ x: lx, y: ly, z: z + 1, block: 0 }); // Clear front
            updates.push({ x: lx, y: ly, z: z - 1, block: 0 }); // Clear back
          }
        }
      }

      this.batchSetBlocks(updates);
    };

    // Handle block break (cell click)
    const onBlockBreak = (wx, wy, wz) => {
      // Check if reset button was clicked
      if (
        wz === z &&
        wx >= resetButtonX &&
        wx < resetButtonX + resetButtonSize &&
        wy >= resetButtonY &&
        wy < resetButtonY + resetButtonSize
      ) {
        console.log("🔄 Reset button clicked!");

        reset();

        return;
      }

      if (gameOver) {
        console.log("🏁 Game over! Click the reset button to play again");

        return;
      }

      const cell = getCellFromPosition(wx, wy, wz);
      if (!cell) {
        return;
      }

      const { row, col } = cell;

      // Cycle through states: empty -> X -> O -> empty
      if (board[row][col] === 0) {
        board[row][col] = currentPlayer;
        console.log(
          `${currentPlayer === 1 ? "❌" : "⭕"} placed at (${row}, ${col})`,
        );

        drawCell(row, col);

        // Check for winner
        const result = checkWinner();
        if (result) {
          gameOver = true;
          winLine = result.line;

          if (result.winner === 0) {
            console.log("🤝 It's a draw!");
          } else {
            console.log(`🎉 ${result.winner === 1 ? "X" : "O"} wins!`);
            drawWinLine(result.line);
          }
        } else {
          // Switch player
          currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
      } else {
        // Cycle: X -> O -> empty
        board[row][col] =
          board[row][col] === 1 ? 2 : board[row][col] === 2 ? 0 : 1;

        console.log(
          `🔄 Cell (${row}, ${col}) changed to ${board[row][col] === 0 ? "empty" : board[row][col] === 1 ? "X" : "O"}`,
        );

        drawCell(row, col);
      }
    };

    // Reset function
    const reset = () => {
      // Clear win line if it exists
      if (winLine) {
        clearWinLine(winLine);
      }

      board = Array(3)
        .fill(0)
        .map(() => Array(3).fill(0));

      currentPlayer = 1;
      gameOver = false;
      winLine = null;

      drawBoard();
      drawBorder();
      drawResetButton();

      console.log("🔄 Game reset!");
    };

    // Initialize
    drawBorder();
    drawBoard();
    drawResetButton();
    drawDirectionIndicators();

    console.log("✅ Tic-Tac-Toe ready!");
    console.log("🎮 Break blocks to place X or O");
    console.log("🔄 Break again to cycle between states");
    console.log("🔘 Break the Iron button above to reset");
    console.log("➡️ Grass arrows point toward the FRONT of the game");

    return {
      onBlockBreak,
      reset: () => {
        // Clear win line if it exists
        if (winLine) {
          clearWinLine(winLine);
        }

        board = Array(3)
          .fill(0)
          .map(() => Array(3).fill(0));

        currentPlayer = 1;
        gameOver = false;
        winLine = null;

        drawBoard();
        drawBorder();
        drawResetButton();
        drawDirectionIndicators();

        console.log("🔄 Game reset!");
      },
      getBoard: () => board,
      getCurrentPlayer: () => (currentPlayer === 1 ? "X" : "O"),
      isGameOver: () => gameOver,
    };
  }
}

export async function demo() {
  const api = new TicTacToe();
  await api.setFullscreen();

  console.log("🎮 BlockGarden Demo: Tic-Tac-Toe");

  // Position game to face the player (negative Z direction)
  // Player typically spawns around the center, facing negative Z
  const worldWidth = api.config.WORLD_WIDTH?.get() ?? 64;
  const centerX = Math.floor(worldWidth / 2);

  api.game = api.createTicTacToe({
    x: centerX - 8, // Center horizontally
    y: 58,
    z: 25, // Place in front of player
    cellSize: 5,
    spacing: 2,
    xBlock: api.getBlockIdByName("Coal"),
    oBlock: api.getBlockIdByName("Snow"),
    emptyBlock: api.getBlockIdByName("Ice"),
    borderBlock: api.getBlockIdByName("Bedrock"),
    lineBlock: api.getBlockIdByName("Gold"),
    showBorder: true,
  });

  const apiText = "blockGarden.demo.ticTacToe.game";

  console.log("🎯 Game started!");
  console.log(`💡 Break blocks on the board to play`);
  console.log(`💡 Use ${apiText}.reset() to start a new game`);
  console.log(`💡 Use ${apiText}.getCurrentPlayer() to see whose turn it is`);
  console.log(`💡 Use ${apiText}.getBoard() to see the board state`);

  // Set up block break listener
  api.onBlockBreak((x, y, z) => {
    api.game.onBlockBreak(x, y, z);
  });

  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    ticTacToe: api,
  };
}
