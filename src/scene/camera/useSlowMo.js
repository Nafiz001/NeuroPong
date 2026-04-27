// Zustand atom controlling render-side slow-motion. The simulation always
// runs at 60Hz — slow-mo is purely visual and is applied as a lerp factor
// in Ball.jsx / Paddle.jsx. Triggered by the commentary director on match
// point and on the final winning point.

import { create } from 'zustand';

export const useSlowMo = create((set, get) => ({
  active: false,
  intensity: 0,            // 0..1; 0.7 = 30% visible speed
  endsAt: 0,               // performance.now() at which slow-mo auto-ends
  kick(intensity = 0.7, durationMs = 900) {
    const now = performance.now();
    set({ active: true, intensity, endsAt: now + durationMs });
  },
  stop() { set({ active: false, intensity: 0, endsAt: 0 }); },
  // Called every frame from a driver so the atom self-expires.
  tick() {
    const { active, endsAt } = get();
    if (!active) return;
    if (performance.now() >= endsAt) set({ active: false, intensity: 0, endsAt: 0 });
  }
}));

// Visual-lerp factor given slow-mo intensity. Clamped so motion never stalls.
export function visualAlpha(intensity) {
  const factor = 1 - intensity;
  return Math.max(0.15, factor);
}
