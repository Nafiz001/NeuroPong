// Custom deterministic physics for the ball + paddle interaction.
//
// We deliberately do NOT delegate ball/paddle physics to Rapier — Rapier is used
// only for the visible table/walls colliders and to allow either AI to swap in
// kinematic-body movement later if desired. The simulation here is a pure
// function of (state, dt), which is what the Minimax search needs to roll
// future ball positions forward without touching the renderer.

import { ARENA, BALL, PADDLE, SIDE } from './constants.js';

// Step the ball forward by dt seconds. Mutates `ball` in place.
// Returns one of:
//   { hit: 'left' | 'right' }  — paddle struck
//   { miss: 'left' | 'right' } — ball passed paddle (point against that side)
//   null                        — nothing notable happened
export function stepBall(ball, paddles, dt, options = {}) {
  const allowPaddleHits = options.allowPaddleHits ?? true;
  const prevX = ball.x;
  const wx = ball.wx ?? 0;
  const wy = ball.wy ?? 0;
  const wz = ball.wz ?? 0;

  // Simplified Magnus acceleration: spin x velocity.
  const ax = BALL.magnus * (wy * ball.vz - wz * ball.vy);
  const ay = BALL.magnus * (wz * ball.vx - wx * ball.vz);
  const az = BALL.magnus * (wx * ball.vy - wy * ball.vx);

  ball.vx += ax * dt;
  ball.vz += az * dt;
  ball.vy += ay * dt;
  ball.vy += BALL.gravity * dt;
  ball.wx = wx * BALL.spinDecayAir;
  ball.wy = wy * BALL.spinDecayAir;
  ball.wz = wz * BALL.spinDecayAir;

  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  ball.y += ball.vy * dt;

  const tableHalfDepth = ARENA.depth / 2 - ARENA.wallThickness / 2;
  const crossedNet = (prevX < 0 && ball.x >= 0) || (prevX > 0 && ball.x <= 0);

  // ---- Net contact (X axis center) ---------------------------------------
  if (crossedNet && Math.abs(ball.z) <= tableHalfDepth && ball.y <= BALL.netHeight + BALL.radius) {
    const fromLeft = prevX < 0;
    ball.x = fromLeft
      ? -(BALL.netThickness / 2 + BALL.radius)
      : +(BALL.netThickness / 2 + BALL.radius);
    ball.vx = -ball.vx * BALL.netBounceX;
    ball.vz *= BALL.netBounceZ;
    ball.vy = Math.max(0.8, Math.abs(ball.vy) * BALL.netBounceY);
    ball.wy *= 0.65;
    ball.wx *= 0.85;
    ball.wz *= 0.85;
    return { net: true };
  }

  // ---- Table bounce (Y axis) ---------------------------------------------
  if (ball.y <= BALL.radius) {
    ball.y = BALL.radius;
    if (ball.vy < 0) {
      ball.vy = Math.max(BALL.minBounceVy, -ball.vy * BALL.tableBounce);
      ball.vx = ball.vx * BALL.tableFriction + (ball.wz ?? 0) * BALL.spinBounceCoupling;
      ball.vz = ball.vz * BALL.tableFriction - (ball.wx ?? 0) * BALL.spinBounceCoupling;
      ball.wx = (ball.wx ?? 0) * BALL.spinDecayBounce;
      ball.wy = (ball.wy ?? 0) * BALL.spinDecayBounce;
      ball.wz = (ball.wz ?? 0) * BALL.spinDecayBounce;
      return { bounce: ball.x < 0 ? SIDE.LEFT : SIDE.RIGHT };
    }
  }

  // ---- Side-out miss (no side-wall bounce in table tennis) ---------------
  if (Math.abs(ball.z) > tableHalfDepth + BALL.radius + 0.16) {
    return { out: true, side: ball.x < 0 ? SIDE.LEFT : SIDE.RIGHT };
  }

  if (allowPaddleHits) {
    // ---- Paddle collision: circular blade in the paddle's YZ plane -------
    const contactR = PADDLE.bladeRadius + BALL.radius;
    const contactR2 = contactR * contactR;

    // LEFT paddle (ball moving toward -X)
    const pL = paddles[SIDE.LEFT];
    if (ball.vx < 0 && ball.x <= pL.x + PADDLE.width / 2 + BALL.radius) {
      const dy = ball.y - pL.y;
      const dz = ball.z - pL.z;
      if (dy * dy + dz * dz <= contactR2) {
        ball.x = pL.x + PADDLE.width / 2 + BALL.radius;
        reflectOffPaddle(ball, pL, +1);
        return { hit: SIDE.LEFT };
      }
      if (ball.x < pL.x - 0.65) return { miss: SIDE.LEFT };
    }

    // RIGHT paddle (ball moving toward +X)
    const pR = paddles[SIDE.RIGHT];
    if (ball.vx > 0 && ball.x >= pR.x - PADDLE.width / 2 - BALL.radius) {
      const dy = ball.y - pR.y;
      const dz = ball.z - pR.z;
      if (dy * dy + dz * dz <= contactR2) {
        ball.x = pR.x - PADDLE.width / 2 - BALL.radius;
        reflectOffPaddle(ball, pR, -1);
        return { hit: SIDE.RIGHT };
      }
      if (ball.x > pR.x + 0.65) return { miss: SIDE.RIGHT };
    }
  }

  return null;
}

// Reflect ball off paddle. dirX is +1 if bouncing right (off left paddle),
// -1 if bouncing left. Impact offsets (ball.z - paddle.z) and (ball.y - paddle.y)
// control bounce angle and lift respectively.
function reflectOffPaddle(ball, paddle, dirX) {
  const r = PADDLE.bladeRadius;
  const zOff = clamp((ball.z - paddle.z) / r, -1, 1);
  const yOff = clamp((ball.y - paddle.y) / r, -1, 1);
  const angle = zOff * BALL.maxBounceAngleRad;

  const speed = Math.min(
    BALL.maxSpeed,
    Math.hypot(ball.vx, ball.vz) * BALL.speedupOnHit
  );

  const rawVx = Math.cos(angle) * speed;
  // Guarantee enough horizontal speed to clear the net on the outbound arc.
  const outVx = Math.max(rawVx, BALL.minOutVx);
  ball.vx = outVx * dirX;
  // Damp lateral velocity when the vx floor inflated the outgoing speed —
  // a straight return shouldn't also slice sideways off the table.
  const vxBoost = outVx / Math.max(0.01, rawVx);
  ball.vz = Math.sin(angle) * speed / Math.max(1, vxBoost);

  // Vertical bias: contact above paddle center lowers the return arc; contact
  // below lofts it. A genuine SMASH pose (paddle above ball AND stroking
  // downward) drives vy negative for a hard downward drive.
  const pvy = paddle.vy ?? 0;
  const isSmash = yOff > 0.3 && pvy < -3.0;
  const lift =
    BALL.liftOnHit
    - yOff * 0.9
    + Math.abs(paddle.vz) * 0.05
    + Math.max(0, pvy) * 0.35
    + (isSmash ? pvy * 0.45 : 0)
    + Math.abs(zOff) * 0.6;
  ball.vy = isSmash
    ? Math.min(BALL.maxVy, Math.max(-3.0, lift))
    : Math.min(BALL.maxVy, Math.max(BALL.minBounceVy, lift));

  const lungeBoost = Math.max(0, -dirX * (paddle.vx ?? 0)) * 0.15;
  ball.vx *= 1 + lungeBoost;

  // Paddle movement and contact point induce spin.
  const spinFromSlice = (paddle.vz ?? 0) * 0.55 + zOff * 6.2;
  ball.wy = clamp((ball.wy ?? 0) * 0.55 + spinFromSlice * 4.0, -34, 34);
  ball.wx = clamp((ball.wx ?? 0) * 0.55 - zOff * 8.0 - (paddle.vy ?? 0) * 0.6, -26, 26);
  ball.wz = clamp((ball.wz ?? 0) * 0.6 + dirX * 4.0, -20, 20);
}

// Pure simulation rollout used by Minimax. Returns a NEW ball state.
// Does not mutate inputs. Caller controls the paddle positions per step.
export function simulateBall(ball, paddles, dt, steps) {
  const b = { ...ball };
  const p = {
    [SIDE.LEFT]:  { ...paddles[SIDE.LEFT] },
    [SIDE.RIGHT]: { ...paddles[SIDE.RIGHT] }
  };
  let outcome = null;
  for (let i = 0; i < steps; i++) {
    const ev = stepBall(b, p, dt, { allowPaddleHits: true });
    if (!ev) continue;
    if (ev.bounce || ev.net) continue;
    if (ev.out) {
      outcome = { miss: ev.side };
      break;
    }
    outcome = ev;
    break;
  }
  return { ball: b, outcome };
}

// Predict the Z coord where the ball will arrive at targetX, given current
// velocity. Cheap utility used by both AIs as a fallback heuristic.
export function predictZAtX(ball, targetX) {
  if (Math.abs(ball.vx) < 0.001) return ball.z;
  const t = (targetX - ball.x) / ball.vx;
  if (t < 0) return ball.z;
  return ball.z + ball.vz * t;
}

// Predict (y, z, arrivalTime) at targetX including gravity + table bounces.
// Returns null if the ball isn't heading toward targetX.
export function predictAtX(ball, targetX) {
  const dirToTarget = targetX - ball.x;
  if (Math.abs(ball.vx) < 0.001) return null;
  if (Math.sign(dirToTarget) !== Math.sign(ball.vx)) return null;

  let x = ball.x, y = ball.y, z = ball.z;
  let vx = ball.vx, vy = ball.vy, vz = ball.vz;
  const dt = 1 / 120;
  const startDir = Math.sign(dirToTarget);
  for (let i = 0; i < 360; i++) {
    const nx = x + vx * dt;
    if (Math.sign(targetX - nx) !== startDir) {
      // Crossed — interpolate to exact targetX.
      const frac = (targetX - x) / (nx - x);
      return {
        y: y + (vy * dt) * frac,
        z: z + vz * dt * frac,
        t: (i + frac) * dt
      };
    }
    x = nx;
    y += vy * dt;
    z += vz * dt;
    vy += BALL.gravity * dt;
    if (y <= BALL.radius) {
      y = BALL.radius;
      if (vy < 0) {
        vy = Math.max(BALL.minBounceVy * 0.4, -vy * BALL.tableBounce);
        vx *= BALL.tableFriction;
        vz *= BALL.tableFriction;
      }
    }
  }
  return { y, z, t: 360 * dt };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
