// Damped spring, used for scroll-velocity aberration. Pure so it can be unit tested.

export interface Spring {
  x: number;
  v: number;
}

/**
 * Advance one step (semi-implicit Euler). `stiffness` in 1/s²; damping ratio 1 is critical.
 * dt is clamped so a backgrounded tab can't make the spring explode on return.
 */
export function step(s: Spring, target: number, dtMs: number, stiffness = 420, ratio = 1): Spring {
  const dt = Math.min(dtMs, 64) / 1000;
  const damping = 2 * ratio * Math.sqrt(stiffness);
  const a = stiffness * (target - s.x) - damping * s.v;
  const v = s.v + a * dt;
  return { x: s.x + v * dt, v };
}

export function atRest(s: Spring, target: number, eps = 0.001): boolean {
  return Math.abs(s.x - target) < eps && Math.abs(s.v) < eps;
}
