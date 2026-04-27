// Crowd energy — rises during long rallies and spikes on scoring events.
// Consumed by the crowd sway shader and (optionally) by ambient audio.

import { create } from 'zustand';

export const useCrowdEnergy = create((set, get) => ({
  energy: 0.25,    // 0..1
  base: 0.25,
  lastSpike: 0,
  setBase(b) { set({ base: b }); },
  spike(amount = 0.8) {
    const now = performance.now();
    set({ energy: Math.min(1, get().energy + amount), lastSpike: now });
  },
  // Ambient drift based on rally length, called at ~10Hz from render side.
  setRallyHits(hits) {
    const base = Math.min(0.85, 0.25 + hits * 0.04);
    set({ base });
  },
  tick(dtMs) {
    const { energy, base } = get();
    const decay = 0.6 * (dtMs / 1000);
    const target = base;
    // Ease toward target, decaying faster when above it (spike relaxation).
    const next = energy > target
      ? Math.max(target, energy - decay)
      : energy + (target - energy) * 0.08;
    if (Math.abs(next - energy) > 0.001) set({ energy: next });
  }
}));
