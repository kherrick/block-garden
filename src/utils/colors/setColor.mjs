export function setColor(gThis, gl, cube, cbuf, { r, g, b, a = 1.0 }) {
  const aData = new gThis.Float32Array(cube.cnt * 4);

  for (let i = 0; i < aData.length; i += 4) {
    aData[i] = r;
    aData[i + 1] = g;
    aData[i + 2] = b;
    aData[i + 3] = a;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, cbuf);
  gl.bufferData(gl.ARRAY_BUFFER, aData, gl.STATIC_DRAW);
}
