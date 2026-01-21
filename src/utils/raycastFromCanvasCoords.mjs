import { ray } from "./ray.mjs";

/**
 * Converts canvas coordinates to a raycast result
 *
 * @param {HTMLCanvasElement} canvas - The game canvas
 * @param {number} clientX - Mouse/touch X coordinate relative to viewport
 * @param {number} clientY - Mouse/touch Y coordinate relative to viewport
 * @param {Object} world - The world/chunk manager
 * @param {Object} cameraPos - Camera position {x, y, z}
 * @param {Object} cameraRot - Camera rotation {yaw, pitch}
 * @param {number} fov - Field of view in radians (default Math.PI/3)
 *
 * @returns {Object} Ray result with hit information
 */
export function raycastFromCanvasCoords(
  canvas,
  clientX,
  clientY,
  world,
  cameraPos,
  cameraRot,
  fov = Math.PI / 3,
) {
  // Get canvas client dimensions (accounting for CSS scaling)
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // Convert client coordinates to normalized device coordinates (-1 to 1)
  const x = ((clientX - rect.left) / width) * 2 - 1;
  const y = (-(clientY - rect.top) / height) * 2 + 1;

  // Aspect ratio from client dimensions
  const aspect = width / height;

  // Field of view is vertical, so height determines the angle
  const vFOV = fov;
  const height_tan = Math.tan(vFOV / 2);
  const width_tan = height_tan * aspect;

  // Direction in camera space (before rotation)
  // Logic: +Z is forward for our rotation math to work with 0 yaw = +Z
  // Note: We negate X because in this engine's world space, "Right" is -X (Yaw -90).
  // Standard NDCS X is +Right. So we map +Right to -X Local.
  const dirCameraX = -x * width_tan;
  const dirCameraY = y * height_tan;
  const dirCameraZ = 1;

  // Normalize
  const len = Math.sqrt(
    dirCameraX * dirCameraX + dirCameraY * dirCameraY + dirCameraZ * dirCameraZ,
  );
  const normDirCamX = dirCameraX / len;
  const normDirCamY = dirCameraY / len;
  const normDirCamZ = dirCameraZ / len;

  // Rotate direction from camera space to world space
  const { yaw, pitch } = cameraRot;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  // 1. Rotate around X (Pitch)
  // We use Rx(-pitch) logic to make +Pitch look Up
  // vx = x
  // vy = y*cos - z*sin
  // vz = y*sin + z*cos
  // Wait, standard Rx(theta):
  // [1 0 0]
  // [0 c -s]
  // [0 s c]
  // y' = c*y - s*z
  // z' = s*y + c*z
  // If we want +Pitch to look UP, and we look down +Z (0,0,1).
  // y' (UP) should increase.
  // If z=1, y' = -s. If s>0, y' < 0 (DOWN).
  // So standard pos pitch = Down.
  // We want Up. So we rotate by -Pitch.
  // Rx(-p) -> sin(-p) = -sin(p). cos(-p) = cos(p).
  // y' = c*y - (-s)*z = c*y + s*z.
  // z' = (-s)*y + c*z = -s*y + c*z.
  // Test z=1. y'=s (UP). z'=c. Correct.

  const dx1 = normDirCamX;
  const dy1 = normDirCamY * cosP + normDirCamZ * sinP;
  const dz1 = -normDirCamY * sinP + normDirCamZ * cosP;

  // 2. Rotate around Y (Yaw)
  // Standard Ry(theta):
  // [c 0 s]
  // [0 1 0]
  // [-s 0 c]
  // x' = c*x + s*z
  // z' = -s*x + c*z
  // Test z=1 (Forward). x'=s. z'=c.
  // If yaw=90, x'=1 (Right), z'=0. Correct.

  const dirWorldX = dx1 * cosY + dz1 * sinY;
  const dirWorldY = dy1;
  const dirWorldZ = -dx1 * sinY + dz1 * cosY;

  // Convert direction angles to yaw/pitch for the ray function
  // We need to reverse-engineer yaw and pitch from the world direction
  const calculatedYaw = Math.atan2(dirWorldX, dirWorldZ);
  const calculatedPitch = Math.asin(dirWorldY);

  // Use ray function with calculated angles
  const hit = ray(world, cameraPos, {
    yaw: calculatedYaw,
    pitch: calculatedPitch,
  });

  return {
    hit,
    yaw: calculatedYaw,
    pitch: calculatedPitch,
  };
}
