// ============================================================================
// MINIMAX AGENT  —  owner: Nafiz
// ----------------------------------------------------------------------------
// Depth-limited minimax with alpha-beta pruning over the discrete paddle
// action space {UP, DOWN, STAY}. The "self" player maximises, the opponent
// minimises. Future ball positions come from simulateBall() — the same
// physics function the live game uses, which is why the rollout is faithful.
//
// Search depth is intentionally small (default 3 plies). Each ply rolls the
// world forward by N physics sub-steps so a few plies cover ~0.3-0.5s of game
// time — enough to plan a "where will the ball be when it reaches me" answer
// without blowing the 15Hz decision budget.
//
// Evaluation features (see evaluate()):
//   * Distance to ball                  — be where the ball will be
//   * Scoring chance                    — angled returns toward gaps
//   * Paddle alignment                  — center bias, recovery readiness
//   * Energy usage                      — don't waste on no-threat states
//   * Risk of missing                   — penalize being far from impact
// ============================================================================

import { ACTION, BALL, PADDLE, POWERUP, SIDE, ENERGY } from '../game/constants.js';
import { simulateBall, predictZAtX, predictAtX } from '../game/physics.js';

const ACTIONS = [ACTION.UP, ACTION.STAY, ACTION.DOWN];

// Tunables.
const SEARCH_DEPTH = 4;
const PLY_PHYSICS_STEPS = 6;        // each ply = ~0.1s of simulated game
const PLY_DT = 1 / 60;              // matches SIM.fixedDtMs

export function createMinimaxAgent({ depth = SEARCH_DEPTH } = {}) {
  let lastAction = ACTION.STAY;
  let actionHoldTicks = 0;
  let trackingBias = 0;

  return {
    name: `Minimax (d=${depth})`,
    reset() {
      lastAction = ACTION.STAY;
      actionHoldTicks = 0;
      trackingBias = 0;
    },

    decide(obs) {
      const self = obs.selfSide;
      const opp  = self === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
      const baseX = self === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
      const p = obs.paddles[self];
      const myX = p.x, myY = p.y;
      const ballToMyX = Math.abs(obs.ball.x - myX);
      const urgency = clamp01(1 - ballToMyX / 10);
      const effectiveDepth = urgency > 0.72 ? depth : Math.max(2, depth - 1);
      const heading = self === SIDE.LEFT ? obs.ball.vx < 0 : obs.ball.vx > 0;

      // Speed-scaled aim bias so matches complete. Smaller than Fuzzy's bias —
      // the search isn't there to absorb noise, so we keep tracking tighter.
      if (Math.random() < 0.18) {
        const speedFactor = Math.min(1.4, Math.hypot(obs.ball.vx, obs.ball.vz) / BALL.startSpeed);
        trackingBias = randomRange(-0.22, 0.22) * speedFactor * (1 - urgency * 0.5);
      }

      // 1) Pick best paddle action via minimax.
      const root = snapshot(obs);
      let bestAction = ACTION.STAY;
      let bestScore  = -Infinity;
      let alpha = -Infinity;
      const beta  =  Infinity;
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      const debugChildren = [];

      for (const a of ACTIONS) {
        const child = applyAction(root, self, opp, a, ACTION.STAY);
        const s = minimax(child, effectiveDepth - 1, alpha, beta, false, self, opp);
        debugChildren.push({ action: a, value: s });
        if (s > bestScore) { bestScore = s; bestAction = a; }
        alpha = Math.max(alpha, s);
      }
      const elapsedMs = typeof performance !== 'undefined' ? performance.now() - t0 : 0;

      // Predict at paddle's current x so tracking matches the impact point.
      // When ball is going away, recover toward center — the next return won't
      // arrive at wherever the ball happens to be on the opponent's side.
      const pred = heading ? predictAtX(obs.ball, myX) : null;
      const predictedZ = pred ? pred.z + trackingBias : -p.z * 0.2;
      const canSmash = pred && pred.y > 1.8;
      const predictedY = pred
        ? clamp(canSmash ? pred.y - 0.3 : pred.y, PADDLE.yMin, PADDLE.yMax)
        : PADDLE.homeY;

      const alignDelta = predictedZ - p.z;
      // Proportional Z control blended with the search recommendation. The
      // search picks a direction over ~0.4s of lookahead; we use it as an
      // intensity boost on top of the proportional term, mirroring how Fuzzy
      // blends its rule output. Without this blend the search was decorative.
      const zSlow = 0.18;
      let dz = clamp(alignDelta / zSlow, -1, 1);
      const searchInformative = heading && Math.abs(alignDelta) > 0.05;
      if (searchInformative && bestAction !== ACTION.STAY) {
        dz = clamp(dz * 0.8 + bestAction * 0.4, -1, 1);
      }
      actionHoldTicks = 0;
      lastAction = Math.sign(dz);

      // Y axis: fast proportional tracking of predicted ball height.
      const yDelta = predictedY - myY;
      const ySlow = 0.12;
      const dy = clamp(yDelta / ySlow, -1, 1);

      // X axis: lunge only when the rally state says the ball has legally
      // bounced on our side and we are the next hitter. Eliminates volleys.
      const forwardDir = self === SIDE.LEFT ? 1 : -1;
      const isOurTurn = heading &&
        obs.rally.serveStage === 0 &&
        obs.rally.expectedBounceSide === self &&
        obs.rally.bounceCount >= 1;
      const targetX = isOurTurn
        ? baseX + forwardDir * Math.min(0.9, urgency * 1.0)
        : baseX;
      const xSlow = 0.28;
      const dx = clamp((targetX - myX) / xSlow, -1, 1);

      // 2) Pick a power-up by simple expected-utility rule.
      const powerup = pickPowerup(obs, self, myX, urgency);

      // 3) Optional introspection payload for the telemetry panel. Kept cheap.
      const debug = {
        kind: 'minimax',
        depth: effectiveDepth,
        rootValue: bestScore,
        bestAction,
        rootChildren: debugChildren,
        elapsedMs,
        predictedZ,
        predictedY,
        urgency
      };

      return { action: { dz, dy, dx }, powerup, debug };
    }
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function minimax(node, depth, alpha, beta, isMax, self, opp) {
  if (depth === 0 || node.terminal) {
    return evaluate(node, self);
  }
  if (isMax) {
    let best = -Infinity;
    for (const a of ACTIONS) {
      const child = applyAction(node, self, opp, a, ACTION.STAY);
      const v = minimax(child, depth - 1, alpha, beta, false, self, opp);
      if (v > best) best = v;
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const a of ACTIONS) {
      const child = applyAction(node, self, opp, ACTION.STAY, a);
      const v = minimax(child, depth - 1, alpha, beta, true, self, opp);
      if (v < best) best = v;
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ---------------------------------------------------------------------------
// Node snapshot + transition
// ---------------------------------------------------------------------------

function snapshot(obs) {
  return {
    ball: { ...obs.ball },
    paddles: {
      [SIDE.LEFT]:  { ...obs.paddles[SIDE.LEFT] },
      [SIDE.RIGHT]: { ...obs.paddles[SIDE.RIGHT] }
    },
    terminal: false,
    outcome: null
  };
}

// Move both paddles by their actions, then roll the ball forward one ply.
function applyAction(node, self, opp, selfAction, oppAction) {
  const next = {
    ball: { ...node.ball },
    paddles: {
      [SIDE.LEFT]:  { ...node.paddles[SIDE.LEFT] },
      [SIDE.RIGHT]: { ...node.paddles[SIDE.RIGHT] }
    },
    terminal: false,
    outcome: null
  };
  // Move paddles for the duration of one ply.
  const dz = PADDLE.baseSpeed * PLY_DT * PLY_PHYSICS_STEPS;
  next.paddles[self].z = clamp(next.paddles[self].z + selfAction * dz, PADDLE.zMin, PADDLE.zMax);
  next.paddles[opp].z  = clamp(next.paddles[opp].z  + oppAction  * dz, PADDLE.zMin, PADDLE.zMax);

  const sim = simulateBall(next.ball, next.paddles, PLY_DT, PLY_PHYSICS_STEPS);
  next.ball = sim.ball;
  if (sim.outcome) {
    next.outcome = sim.outcome;
    if (sim.outcome.miss) next.terminal = true;
  }
  return next;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

function evaluate(node, self) {
  const opp = self === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;

  // Terminal: huge reward for opponent miss, huge penalty for own miss.
  if (node.terminal && node.outcome) {
    if (node.outcome.miss === opp)  return  10_000;
    if (node.outcome.miss === self) return -10_000;
  }

  const myX = self === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
  const myZ = node.paddles[self].z;
  const oppZ = node.paddles[opp].z;
  const ball = node.ball;

  // Predicted impact Z at our paddle X.
  const predictedZ = ballHeadingTowardSelf(ball, self)
    ? predictZAtX(ball, myX)
    : 0;  // recover toward center when ball is going away

  // 1) Distance to predicted impact (lower = better).
  const distToImpact = Math.abs(myZ - predictedZ);
  const distScore = -distToImpact * 12;

  // 2) Scoring chance: aim for the gap on the opponent side.
  //    If ball is moving away from us, predict where it'll arrive at opponent
  //    and reward the offset from opponent paddle position.
  let scoreChance = 0;
  if (!ballHeadingTowardSelf(ball, self)) {
    const oppX = self === SIDE.LEFT ? PADDLE.rightX : PADDLE.leftX;
    const arriveZ = predictZAtX(ball, oppX);
    scoreChance = Math.abs(arriveZ - oppZ) * 4;
  }

  // 3) Paddle alignment: small center bias for faster recovery.
  const centerBias = -Math.abs(myZ) * 0.5;

  // 4) Risk: penalize being far from ball when ball is fast and close.
  const ballToMyX = Math.abs(ball.x - myX);
  const ballSpeed = Math.hypot(ball.vx, ball.vz);
  const urgency = Math.max(0, 1 - ballToMyX / 10);
  const risk = -distToImpact * urgency * (ballSpeed / BALL.startSpeed) * 6;

  return distScore + scoreChance + centerBias + risk;
}

function ballHeadingTowardSelf(ball, self) {
  return self === SIDE.LEFT ? ball.vx < 0 : ball.vx > 0;
}

// ---------------------------------------------------------------------------
// Power-up selection
// ---------------------------------------------------------------------------

function pickPowerup(obs, self, myX, urgency) {
  const ball = obs.ball;
  const myZ  = obs.paddles[self].z;
  const energy = obs.energy[self];

  if (!ballHeadingTowardSelf(ball, self)) {
    // Ball is moving away — only meaningful play is to bank energy.
    return null;
  }

  const predictedZ = predictZAtX(ball, myX);
  const distToImpact = Math.abs(myZ - predictedZ);
  const ballSpeed = Math.hypot(ball.vx, ball.vz);
  const ballToMyX = Math.abs(ball.x - myX);

  // SHIELD: high-confidence near-miss → shield up.
  if (
    energy >= ENERGY.costs.shield &&
    obs.cooldowns[self].shield === 0 &&
    obs.active[self].shield === 0 &&
    distToImpact > PADDLE.depth * 0.72 &&
    ballToMyX < 3.5 &&
    urgency > 0.68
  ) {
    return POWERUP.SHIELD;
  }

  // BOOST: catchable but only if I move faster.
  if (
    energy >= ENERGY.costs.boost &&
    obs.cooldowns[self].boost === 0 &&
    obs.active[self].boost === 0 &&
    distToImpact > PADDLE.depth * 0.42 &&
    distToImpact < PADDLE.depth * 0.9 &&
    ballToMyX < 5.5 &&
    urgency > 0.55
  ) {
    return POWERUP.BOOST;
  }

  // SLOW: far away from impact + ball moving fast → buy reaction time.
  if (
    energy >= ENERGY.costs.slow &&
    obs.cooldowns[self].slow === 0 &&
    obs.active[self].slow === 0 &&
    distToImpact > PADDLE.depth * 0.75 &&
    ballSpeed > BALL.startSpeed * 1.3 &&
    urgency > 0.45
  ) {
    return POWERUP.SLOW;
  }

  return null;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function clamp01(v) { return clamp(v, 0, 1); }

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
