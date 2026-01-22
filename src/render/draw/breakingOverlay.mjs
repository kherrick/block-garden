import { I, mul } from "../../utils/math.mjs";

/**
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Object} gameState
 * @param {Object} gameConfig
 * @param {Float32Array} VP
 * @param {WebGLUniformLocation} uMVP
 * @param {WebGLUniformLocation} uM
 * @param {WebGLBuffer} pbuf
 * @param {WebGLBuffer} nbuf
 * @param {WebGLBuffer} breakCbuf
 * @param {WebGLBuffer} breakUvbuf
 * @param {Object} cube
 *
 * @returns {void}
 */
export function drawBreakingOverlay(
  gl,
  gameState,
  gameConfig,
  VP,
  uMVP,
  uM,
  pbuf,
  nbuf,
  breakCbuf,
  breakUvbuf,
  cube,
) {
  const { active, blockPos, breakPercentage } = gameState.breaking;
  if (!active || !blockPos) {
    return;
  }

  // Calculate crack stage (ID 240-249)
  const stage = Math.floor(breakPercentage * 9.99); // 0 to 9
  const crackId = 240 + stage;
  const tileSize = 1 / 16;
  const uBase = (crackId % 16) * tileSize;
  const vBase = Math.floor(crackId / 16) * tileSize;

  // createCube() returns p and n with 36 vertices (non-indexed)
  const vertexCount = cube.cnt;

  // Setup UVs for the crack stage (6 faces * 6 vertices = 36 UVs)
  const crackUVs = new Float32Array(vertexCount * 2);
  // Pattern for each face (square)
  const faceUVs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      crackUVs[(i * 6 + j) * 2] = uBase + faceUVs[j * 2] * tileSize;
      crackUVs[(i * 6 + j) * 2 + 1] = vBase + faceUVs[j * 2 + 1] * tileSize;
    }
  }

  // Check if textures are enabled
  const useTextures = gameConfig.useTextureAtlas.get();

  // Setup colors based on texture mode
  const crackColors = new Float32Array(vertexCount * 4);

  if (useTextures) {
    // Textured mode: white color to show crack texture
    crackColors.fill(1.0);
  } else {
    // Non-textured mode: darken based on break percentage
    // darkness factor: 1.0 (no darkening) -> 0.4 (60% darker)
    const darkness = 1.0 - breakPercentage * 0.6;
    for (let i = 0; i < vertexCount; i++) {
      crackColors[i * 4] = darkness; // R
      crackColors[i * 4 + 1] = darkness; // G
      crackColors[i * 4 + 2] = darkness; // B
      crackColors[i * 4 + 3] = 1.0; // A
    }
  }

  // Bind attribute buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // Use dedicated break overlay buffers to avoid corrupting shared chunk buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, breakCbuf);
  gl.bufferData(gl.ARRAY_BUFFER, crackColors, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, breakUvbuf);
  gl.bufferData(gl.ARRAY_BUFFER, crackUVs, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);

  // Disable AO and other effects for the overlay
  gl.disableVertexAttribArray(4); // ao
  gl.vertexAttrib1f(4, 1.0);

  gl.disableVertexAttribArray(5); // localUV
  gl.vertexAttrib2f(5, 0.0, 0.0);

  gl.disableVertexAttribArray(6); // cornerAO
  gl.vertexAttrib4f(6, 1.0, 1.0, 1.0, 1.0);

  // Set Model Matrix (M) - slightly oversized to prevent Z-fighting
  // Note: createCube() makes a cube centered at origin (-0.5 to 0.5), so we add 0.5 to position it correctly
  const scale = 1.002;
  const M = I();

  M[0] = scale;
  M[5] = scale;
  M[10] = scale;
  M[12] = blockPos.x + 0.5; // Center at block center
  M[13] = blockPos.y + 0.5;
  M[14] = blockPos.z + 0.5;

  gl.uniformMatrix4fv(uM, false, M);
  gl.uniformMatrix4fv(uMVP, false, mul(I(), VP, M));

  // Enable blending
  gl.enable(gl.BLEND);

  if (useTextures) {
    // Textured mode: alpha blending for transparent crack overlay
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  } else {
    // Non-textured mode: multiplicative blending to darken the block
    gl.blendFunc(gl.DST_COLOR, gl.ZERO);
  }

  // Disable depth writing to avoid artifacts, but keep depth testing
  gl.depthMask(false);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

  gl.depthMask(true);
  gl.disable(gl.BLEND);
}
