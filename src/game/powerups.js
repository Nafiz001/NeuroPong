// Power-up + energy system. Pure functions over the simulation state.
// Determinism is preserved: every effect resolves on the next sim tick.

import { ENERGY, POWERUP, SIDE } from './constants.js';

export function regenEnergy(state, dt) {
  for (const side of [SIDE.LEFT, SIDE.RIGHT]) {
    state.energy[side] = Math.min(
      ENERGY.max,
      state.energy[side] + ENERGY.regenPerSecond * dt
    );
  }
}

export function tickTimers(state, dt) {
  for (const side of [SIDE.LEFT, SIDE.RIGHT]) {
    const cd = state.cooldowns[side];
    const ac = state.active[side];
    for (const k of Object.keys(cd)) cd[k] = Math.max(0, cd[k] - dt);
    for (const k of Object.keys(ac)) ac[k] = Math.max(0, ac[k] - dt);
  }
}

// Returns true if the agent on `side` can activate `kind` right now.
export function canUse(state, side, kind) {
  if (state.cooldowns[side][kind] > 0) return false;
  if (state.active[side][kind] > 0) return false;
  if (state.energy[side] < ENERGY.costs[kind]) return false;
  return true;
}

// Activate a power-up. Caller must have verified canUse() — but we double-check.
// Returns true if activation succeeded.
export function activate(state, side, kind) {
  if (!canUse(state, side, kind)) return false;
  // Power-up costs are deducted immediately so the sim stays deterministic.
  state.energy[side] -= ENERGY.costs[kind];
  state.active[side][kind] = ENERGY.durations[kind];
  state.cooldowns[side][kind] = ENERGY.cooldowns[kind] + ENERGY.durations[kind];
  state.metrics[side].energyUsed += ENERGY.costs[kind];
  state.metrics[side].powerupUses[kind]++;
  return true;
}

// Consume the shield charge if active on `side`. Returns true if absorbed.
export function tryAbsorbWithShield(state, side) {
  if (state.active[side][POWERUP.SHIELD] > 0) {
    state.active[side][POWERUP.SHIELD] = 0;
    return true;
  }
  return false;
}

// Multiplier applied to ball speed when SLOW is active on EITHER side.
// (A slow cast by left also slows the ball heading toward right — symmetrical.)
export function ballSpeedMultiplier(state) {
  if (state.active[SIDE.LEFT].slow > 0 || state.active[SIDE.RIGHT].slow > 0) {
    return 0.55;
  }
  return 1.0;
}

// Multiplier applied to a side's paddle speed when its BOOST is active.
export function paddleSpeedMultiplier(state, side) {
  return state.active[side].boost > 0 ? 1.0 : 0.0; // returns delta multiplier
}
