// ============================================================================
// AI AGENT INTERFACE — single contract both Minimax and Fuzzy implementations
// must satisfy. Keep this file frozen; if it changes, both AIs must update.
// ============================================================================
//
// An agent is any object with shape:
//
//   {
//     name: string,                // displayed in the HUD
//     reset?: () => void,          // optional: clear caches at round start
//     decide(observation): Decision
//   }
//
// Observation (read-only — DO NOT mutate):
//   {
//     selfSide: 'left' | 'right',
//     ball: { x, y, z, vx, vy, vz },
//     paddles: {
//       left:  { x, z, vz },
//       right: { x, z, vz }
//     },
//     energy:    { left, right },
//     cooldowns: { left: {boost, shield, slow}, right: {...} },
//     active:    { left: {boost, shield, slow}, right: {...} },
//     constants: { ARENA_WIDTH, BALL, PADDLE, ENERGY }
//   }
//
// Decision:
//   {
//     action: -1 | 0 | 1,          // ACTION.DOWN | STAY | UP
//     powerup?: 'boost' | 'shield' | 'slow' | null
//   }
//
// Notes:
//   * Both agents see the same observation shape — fair comparative study.
//   * The game loop calls decide() at SIM.decisionDtMs (15Hz by default).
//   * Power-up requests are validated by the loop; failed activations are
//     silently ignored, so it's safe to always request what you'd like.
// ============================================================================

import { ACTION } from '../game/constants.js';

export const NULL_AGENT = {
  name: 'idle',
  decide: () => ({ action: ACTION.STAY })
};
