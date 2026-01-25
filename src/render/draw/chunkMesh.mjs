import { I } from "../../utils/math.mjs";

/** @typedef {import("../../world/meshing/chunk.mjs").Chunk} Chunk */

/**
 * Draw a chunk mesh.
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Chunk} chunk
 * @param {Float32Array} VP - View-projection matrix
 * @param {WebGLUniformLocation} uMVP
 * @param {WebGLUniformLocation} uM
 *
 * @returns {void}
 */
export function drawChunkMesh(gl, chunk, VP, uMVP, uM) {
  const mesh = chunk.mesh;
  if (!mesh || mesh.vertexCount === 0) {
    return;
  }

  // Bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // Bind color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorBuffer);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

  // Bind UV buffer
  if (mesh.uvBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);
  } else {
    gl.disableVertexAttribArray(3);
  }

  // Bind AO buffer
  if (mesh.aoBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.aoBuffer);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);
  } else {
    // Default to 1.0 (no occlusion) if buffer missing
    gl.disableVertexAttribArray(4);
    gl.vertexAttrib1f(4, 1.0);
  }

  // Bind local UV buffer for Radial AO
  if (mesh.localUVBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.localUVBuffer);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 2, gl.FLOAT, false, 0, 0);
  } else {
    gl.disableVertexAttribArray(5);
  }

  // Bind corner AO buffer for Radial AO bilinear interpolation
  if (mesh.cornerAOBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cornerAOBuffer);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 0, 0);
  } else {
    gl.disableVertexAttribArray(6);
  }

  // Bind light level buffer (emissive)
  if (mesh.lightBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.lightBuffer);
    gl.enableVertexAttribArray(7);
    gl.vertexAttribPointer(7, 1, gl.FLOAT, false, 0, 0);
  } else {
    gl.disableVertexAttribArray(7);
    gl.vertexAttrib1f(7, 0.0);
  }

  // Set uniforms - identity model matrix since positions are in world space
  const M = I();
  gl.uniformMatrix4fv(uMVP, false, VP);
  gl.uniformMatrix4fv(uM, false, M);

  // Draw geometry - use indexed if available, otherwise non-indexed
  if (mesh.indexBuffer && mesh.indexCount > 0) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }
}
