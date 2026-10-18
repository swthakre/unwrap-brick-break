// Shape library. Each shape is a signed distance function in "picture units":
// u runs across (about -0.92..0.92), v runs down (about -1.1..1.1). Negative = inside.
export type F = (u: number, v: number) => number;

export const circ = (r: number, cx = 0, cy = 0): F => (u, v) => Math.hypot(u - cx, v - cy) - r;
export const ell = (a: number, b: number, cx = 0, cy = 0): F => (u, v) =>
  (Math.hypot((u - cx) / a, (v - cy) / b) - 1) * Math.min(a, b);
export const rell = (a: number, b: number, cx: number, cy: number, ang: number): F => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return (u, v) => {
    const x = (u - cx) * c + (v - cy) * s;
    const y = -(u - cx) * s + (v - cy) * c;
    return (Math.hypot(x / a, y / b) - 1) * Math.min(a, b);
  };
};
export const poly = (pts: number[][]): F => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    let nx = q[1] - p[1], ny = -(q[0] - p[0]);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    if ((cx - p[0]) * nx + (cy - p[1]) * ny > 0) { nx = -nx; ny = -ny; }
    return { px: p[0], py: p[1], nx, ny };
  });
  return (u, v) => {
    let m = -1e9;
    for (const e of edges) m = Math.max(m, (u - e.px) * e.nx + (v - e.py) * e.ny);
    return m;
  };
};
export const rect = (w: number, h: number, cx = 0, cy = 0): F =>
  poly([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]);
export const bar = (x0: number, y0: number, x1: number, y1: number, w: number): F => {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  return poly([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]);
};
export const ring = (r: number, t: number, cx = 0, cy = 0): F => (u, v) => Math.abs(Math.hypot(u - cx, v - cy) - r) - t;
export const rring = (a: number, b: number, t: number, ang: number, cx = 0, cy = 0): F => {
  const e = rell(a, b, cx, cy, ang);
  return (u, v) => Math.abs(e(u, v)) - t;
};
export const flower = (cx: number, cy: number, n: number, r: number, k: number, ph = 0): F => (u, v) =>
  Math.hypot(u - cx, v - cy) - (r + k * Math.cos(n * (Math.atan2(v - cy, u - cx) + ph)));
export const uni = (...fs: F[]): F => (u, v) => {
  let m = 1e9;
  for (const f of fs) m = Math.min(m, f(u, v));
  return m;
};
export const sub = (a: F, b: F): F => (u, v) => Math.max(a(u, v), -b(u, v));
