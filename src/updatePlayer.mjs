import { checkCollision } from "./checkCollision.mjs";
import { gameState } from "./state.mjs";
import { isKeyPressed } from "./isKeyPressed.mjs";

// Update player physics
export function updatePlayer(
  gThis,
  friction,
  gravity,
  maxFallSpeed,
  tileSize,
  worldHeight,
  worldWidth,
) {
  const player = gameState.player.get();
  const camera = gameState.camera.get();

  const updatedPlayer = player;

  updatedPlayer.velocityY += gravity;
  if (updatedPlayer.velocityY > maxFallSpeed) {
    updatedPlayer.velocityY = maxFallSpeed;
  }

  // Handle horizontal movement and track direction
  let horizontalInput = 0;
  let verticalInput = 0;

  // Check for diagonal inputs first
  if (isKeyPressed(gThis, "upleft")) {
    horizontalInput = -1;
    verticalInput = -1;
    updatedPlayer.lastDirection = -1;
  } else if (isKeyPressed(gThis, "upright")) {
    horizontalInput = 1;
    verticalInput = -1;
    updatedPlayer.lastDirection = 1;
  } else if (isKeyPressed(gThis, "downleft")) {
    horizontalInput = -1;
    verticalInput = 1;
    updatedPlayer.lastDirection = -1;
  } else if (isKeyPressed(gThis, "downright")) {
    horizontalInput = 1;
    verticalInput = 1;
    updatedPlayer.lastDirection = 1;
  } else {
    // Check for individual directional inputs
    if (isKeyPressed(gThis, "a") || isKeyPressed(gThis, "arrowleft")) {
      horizontalInput = -1;
      updatedPlayer.lastDirection = -1;
    } else if (isKeyPressed(gThis, "d") || isKeyPressed(gThis, "arrowright")) {
      horizontalInput = 1;
      updatedPlayer.lastDirection = 1;
    }

    // Vertical input for diagonal movement (not jumping)
    if (isKeyPressed(gThis, "s")) {
      verticalInput = 1;
    }
  }

  // Apply horizontal movement with minimum movement threshold
  if (horizontalInput !== 0) {
    const targetVelocity = horizontalInput * updatedPlayer.speed;

    // If we're starting from zero velocity or changing direction, apply minimal acceleration
    if (
      Math.abs(updatedPlayer.velocityX) < 0.5 ||
      Math.sign(updatedPlayer.velocityX) !== Math.sign(targetVelocity)
    ) {
      updatedPlayer.velocityX = targetVelocity * 0.3; // Much slower initial movement
    } else {
      updatedPlayer.velocityX = targetVelocity;
    }
  } else {
    updatedPlayer.velocityX *= friction;
    updatedPlayer.lastDirection = 0;
  }

  // Handle jumping (including diagonal up movements)
  if (
    (isKeyPressed(gThis, "w") ||
      isKeyPressed(gThis, "arrowup") ||
      isKeyPressed(gThis, " ") ||
      isKeyPressed(gThis, "upleft") ||
      isKeyPressed(gThis, "upright")) &&
    updatedPlayer.onGround
  ) {
    updatedPlayer.velocityY = -updatedPlayer.jumpPower;
    updatedPlayer.onGround = false;
  }

  // For diagonal movement, apply a slight speed reduction to maintain balance
  if (horizontalInput !== 0 && verticalInput !== 0) {
    const diagonalSpeedMultiplier = 0.707; // 1/√2 for proper diagonal speed
    updatedPlayer.velocityX *= diagonalSpeedMultiplier;
  }

  // Move horizontally
  const newX = updatedPlayer.x + updatedPlayer.velocityX;
  if (
    !checkCollision(
      newX,
      updatedPlayer.y,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.x = newX;
  } else {
    updatedPlayer.velocityX = 0;
  }

  // Move vertically
  const newY = updatedPlayer.y + updatedPlayer.velocityY;
  if (
    !checkCollision(
      updatedPlayer.x,
      newY,
      updatedPlayer.width,
      updatedPlayer.height,
    )
  ) {
    updatedPlayer.y = newY;
    updatedPlayer.onGround = false;
  } else {
    if (updatedPlayer.velocityY > 0) {
      updatedPlayer.onGround = true;
    }
    updatedPlayer.velocityY = 0;
  }

  // Keep player in world bounds
  updatedPlayer.x = Math.max(
    0,
    Math.min(updatedPlayer.x, worldWidth * tileSize - updatedPlayer.width),
  );
  updatedPlayer.y = Math.max(
    0,
    Math.min(updatedPlayer.y, worldHeight * tileSize - updatedPlayer.height),
  );

  // Update camera to follow player
  const canvas = gThis.document?.getElementById("canvas");
  const targetCameraX =
    updatedPlayer.x + updatedPlayer.width / 2 - canvas.width / 2;
  const targetCameraY =
    updatedPlayer.y + updatedPlayer.height / 2 - canvas.height / 2;

  const updatedCamera = camera;

  updatedCamera.x += (targetCameraX - updatedCamera.x) * 0.1;
  updatedCamera.y += (targetCameraY - updatedCamera.y) * 0.1;

  // Keep camera in bounds
  updatedCamera.x = Math.max(
    0,
    Math.min(updatedCamera.x, worldWidth * tileSize - canvas.width),
  );
  updatedCamera.y = Math.max(
    0,
    Math.min(updatedCamera.y, worldHeight * tileSize - canvas.height),
  );

  // Set player and camera state
  gameState.player.set(updatedPlayer);
  gameState.camera.set(updatedCamera);
}
