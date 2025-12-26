/* ================= Math ================= */
export const I = () =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export const persp = (o, f, a, n, fa) => {
  const t = 1 / Math.tan(f / 2),
    nf = 1 / (n - fa);

  o.set([
    t / a,
    0,
    0,
    0,
    0,
    t,
    0,
    0,
    0,
    0,
    (fa + n) * nf,
    -1,
    0,
    0,
    2 * fa * n * nf,
    0,
  ]);

  return o;
};

export const look = (o, e, c, u) => {
  let zx = e[0] - c[0],
    zy = e[1] - c[1],
    zz = e[2] - c[2];

  let l = Math.hypot(zx, zy, zz);

  zx /= l;
  zy /= l;
  zz /= l;

  let xx = u[1] * zz - u[2] * zy,
    xy = u[2] * zx - u[0] * zz,
    xz = u[0] * zy - u[1] * zx;

  l = Math.hypot(xx, xy, xz);

  xx /= l;
  xy /= l;
  xz /= l;

  let yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx;

  o.set([
    xx,
    yx,
    zx,
    0,
    xy,
    yy,
    zy,
    0,
    xz,
    yz,
    zz,
    0,
    -(xx * e[0] + xy * e[1] + xz * e[2]),
    -(yx * e[0] + yy * e[1] + yz * e[2]),
    -(zx * e[0] + zy * e[1] + zz * e[2]),
    1,
  ]);

  return o;
};

export const mul = (o, a, b) => {
  for (let i = 0; i < 16; i++) {
    const r = (i >> 2) << 2,
      c = i & 3;

    o[i] =
      b[r] * a[c] +
      b[r + 1] * a[c + 4] +
      b[r + 2] * a[c + 8] +
      b[r + 3] * a[c + 12];
  }

  return o;
};

export const trans = (o, a, v) => {
  o.set(a);

  o[12] += v[0];
  o[13] += v[1];
  o[14] += v[2];

  return o;
};
