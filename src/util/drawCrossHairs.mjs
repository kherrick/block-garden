/**
 * Draw crosshairs in screen center.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {HTMLCanvasElement} cnvs
 */
export function drawCrosshairs(gl, cnvs) {
  // Switch to 2D overlay mode
  gl.disable(gl.DEPTH_TEST);

  // Use simple 2D rendering with WebGL
  const cx = cnvs.width / 2;
  const cy = cnvs.height / 2;
  const size = 10;
  const thickness = 2;

  // Create a simple 2D crosshair using scissor test and clear
  gl.enable(gl.SCISSOR_TEST);

  // Set crosshair color (white with some transparency)
  gl.clearColor(1.0, 1.0, 1.0, 0.8);

  // Horizontal line
  gl.scissor(cx - size, cy - thickness / 2, size * 2, thickness);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertical line
  gl.scissor(cx - thickness / 2, cy - size, thickness, size * 2);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.disable(gl.SCISSOR_TEST);

  // Reset for next frame
  gl.enable(gl.DEPTH_TEST);
}
