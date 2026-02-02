import { I, mul } from "../../utils/math.mjs";

/**
 * Draw a selection highlight on the currently targeted block.
 * Shows a subtle lightening effect to indicate which block will be affected.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Object} gameState
 * @param {Object} gameConfig
 * @param {Float32Array} VP
 * @param {WebGLUniformLocation} uMVP
 * @param {WebGLUniformLocation} uM
 * @param {WebGLUniformLocation} uUT
 * @param {WebGLBuffer} pbuf
 * @param {WebGLBuffer} nbuf
 * @param {WebGLBuffer} breakCbuf
 * @param {WebGLBuffer} breakUvbuf
 * @param {Object} cube
 *
 * @returns {void}
 */
export function drawSelectionHighlight(
  gl,
  gameState,
  gameConfig,
  VP,
  uMVP,
  uM,
  uUT,
  pbuf,
  nbuf,
  breakCbuf,
  breakUvbuf,
  cube,
) {
  // Priority for highlighting:
  // 1. Active breaking position (cursor is held on a block)
  // 2. Cursor target (hovering/touching a block but not yet breaking)
  // 3. Center raycast hit (split controls / keyboard mode)
  const { hit, breaking, cursorTarget } = gameState;

  let targetPos = null;
  if (breaking.active && breaking.blockPos) {
    targetPos = breaking.blockPos;
  } else if (cursorTarget) {
    targetPos = cursorTarget;
  } else if (hit) {
    targetPos = hit;
  }

  if (!targetPos) {
    return;
  }

  // Hide highlight once breaking animation is visible (>2% progress)
  if (breaking.active && breaking.breakPercentage > 0.02) {
    return;
  }

  const { x, y, z } = targetPos;
  const vertexCount = cube.cnt;

  // Bind geometry buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // Light color for additive brightening
  const highlightColor = new Float32Array(vertexCount * 4);
  const brightness = 0.15;
  for (let i = 0; i < vertexCount; i++) {
    highlightColor[i * 4] = brightness;
    highlightColor[i * 4 + 1] = brightness;
    highlightColor[i * 4 + 2] = brightness;
    highlightColor[i * 4 + 3] = 1.0;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, breakCbuf);
  gl.bufferData(gl.ARRAY_BUFFER, highlightColor, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  // Disable other attributes
  gl.disableVertexAttribArray(3);
  gl.vertexAttrib2f(3, 0.0, 0.0);
  gl.disableVertexAttribArray(4);
  gl.vertexAttrib1f(4, 1.0);
  gl.disableVertexAttribArray(5);
  gl.vertexAttrib2f(5, 0.0, 0.0);
  gl.disableVertexAttribArray(6);
  gl.vertexAttrib4f(6, 1.0, 1.0, 1.0, 1.0);

  // Model matrix - slightly oversized (less than breaking overlay)
  const scale = 1.001;
  const M = I();
  M[0] = M[5] = M[10] = scale;
  M[12] = x + 0.5;
  M[13] = y + 0.5;
  M[14] = z + 0.5;

  gl.uniformMatrix4fv(uM, false, M);
  gl.uniformMatrix4fv(uMVP, false, mul(I(), VP, M));

  // Disable texture sampling for highlight overlay (use pure color)
  gl.uniform1f(uUT, 0.0);

  // Additive blending for lightening
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.depthMask(false);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

  gl.depthMask(true);
  gl.disable(gl.BLEND);

  // Restore texture setting
  gl.uniform1f(uUT, gameConfig.useTextureAtlas.get() ? 1.0 : 0.0);
}
