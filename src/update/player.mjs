import { checkCollision } from "../util/checkCollision.mjs";
import { isKeyPressed } from "../util/isKeyPressed.mjs";

// Update player physics
export function updatePlayer(
  friction,
  gravity,
  maxFallSpeed,
  tileSize,
  worldHeight,
  worldWidth,
  world,
  camera,
  player,
  movementScale = 1,
  cnvs,
  shadow,
) {
  const currentPlayer = player.get();
  const currentCamera = camera.get();
  const currentWorld = world.get();

  currentPlayer.velocityY += gravity;
  if (currentPlayer.velocityY > maxFallSpeed) {
    currentPlayer.velocityY = maxFallSpeed;
  }

  // Handle horizontal movement and track direction
  let horizontalInput = 0;
  let verticalInput = 0;

  // Check for diagonal inputs first
  if (isKeyPressed(shadow, "upleft")) {
    horizontalInput = -1;
    verticalInput = -1;
    currentPlayer.lastDirection = -1;
  } else if (isKeyPressed(shadow, "upright")) {
    horizontalInput = 1;
    verticalInput = -1;
    currentPlayer.lastDirection = 1;
  } else if (isKeyPressed(shadow, "downleft")) {
    horizontalInput = -1;
    verticalInput = 1;
    currentPlayer.lastDirection = -1;
  } else if (isKeyPressed(shadow, "downright")) {
    horizontalInput = 1;
    verticalInput = 1;
    currentPlayer.lastDirection = 1;
  } else {
    // Check for individual directional inputs
    if (isKeyPressed(shadow, "a") || isKeyPressed(shadow, "arrowleft")) {
      horizontalInput = -1;
      currentPlayer.lastDirection = -1;
    } else if (
      isKeyPressed(shadow, "d") ||
      isKeyPressed(shadow, "arrowright")
    ) {
      horizontalInput = 1;
      currentPlayer.lastDirection = 1;
    }

    // Vertical input for diagonal movement (not jumping)
    if (isKeyPressed(shadow, "s")) {
      verticalInput = 1;
    }
  }

  // Apply horizontal movement with minimum movement threshold
  if (horizontalInput !== 0) {
    const targetVelocity =
      horizontalInput * currentPlayer.speed * movementScale;

    // If we're starting from zero velocity or changing direction, apply minimal acceleration
    if (
      Math.abs(currentPlayer.velocityX) < 0.5 ||
      Math.sign(currentPlayer.velocityX) !== Math.sign(targetVelocity)
    ) {
      currentPlayer.velocityX = targetVelocity * 0.3; // Much slower initial movement
    } else {
      currentPlayer.velocityX = targetVelocity;
    }
  } else {
    currentPlayer.velocityX *= friction;
    currentPlayer.lastDirection = 0;
  }

  // Handle jumping (including diagonal up movements)
  if (
    (isKeyPressed(shadow, "w") ||
      isKeyPressed(shadow, "arrowup") ||
      isKeyPressed(shadow, " ") ||
      isKeyPressed(shadow, "upleft") ||
      isKeyPressed(shadow, "upright")) &&
    currentPlayer.onGround
  ) {
    currentPlayer.velocityY = -currentPlayer.jumpPower;
    currentPlayer.onGround = false;
  }

  // For diagonal movement, apply a slight speed reduction to maintain balance
  if (horizontalInput !== 0 && verticalInput !== 0) {
    const diagonalSpeedMultiplier = 0.707; // 1/√2 for proper diagonal speed
    currentPlayer.velocityX *= diagonalSpeedMultiplier;
  }

  // Move horizontally
  const newX = currentPlayer.x + currentPlayer.velocityX;
  if (
    !checkCollision({
      height: currentPlayer.height,
      tileSize,
      width: currentPlayer.width,
      world: currentWorld,
      worldHeight,
      worldWidth,
      x: newX,
      y: currentPlayer.y,
    })
  ) {
    currentPlayer.x = newX;
  } else {
    currentPlayer.velocityX = 0;
  }

  // Move vertically
  const newY = currentPlayer.y + currentPlayer.velocityY;
  if (
    !checkCollision({
      height: currentPlayer.height,
      tileSize,
      width: currentPlayer.width,
      world: currentWorld,
      worldHeight,
      worldWidth,
      x: currentPlayer.x,
      y: newY,
    })
  ) {
    currentPlayer.y = newY;
    currentPlayer.onGround = false;
  } else {
    if (currentPlayer.velocityY > 0) {
      currentPlayer.onGround = true;
    }
    currentPlayer.velocityY = 0;
  }

  // Keep player in world bounds
  currentPlayer.x = Math.max(
    0,
    Math.min(currentPlayer.x, worldWidth * tileSize - currentPlayer.width),
  );
  currentPlayer.y = Math.max(
    0,
    Math.min(currentPlayer.y, worldHeight * tileSize - currentPlayer.height),
  );

  // Update camera to follow player
  const targetCameraX =
    currentPlayer.x + currentPlayer.width / 2 - cnvs.width / 2;
  const targetCameraY =
    currentPlayer.y + currentPlayer.height / 2 - cnvs.height / 2;

  currentCamera.x += (targetCameraX - currentCamera.x) * 0.1;
  currentCamera.y += (targetCameraY - currentCamera.y) * 0.1;

  // Keep camera in bounds
  currentCamera.x = Math.max(
    0,
    Math.min(currentCamera.x, worldWidth * tileSize - cnvs.width),
  );
  currentCamera.y = Math.max(
    0,
    Math.min(currentCamera.y, worldHeight * tileSize - cnvs.height),
  );
}
