// ============================================================================
// FUZZY LOGIC AGENT  —  owner: Dewan
// ----------------------------------------------------------------------------
// Mamdani-style fuzzy controller. No search, no rollout — purely reactive.
//
// Pipeline:
//   1. Fuzzify crisp inputs (distance, ball speed, alignment, energy, danger)
//      into linguistic membership values (near / medium / far, etc.)
//   2. Evaluate fuzzy rules. Each rule outputs a degree-of-truth for an
//      output linguistic value (move-up-strong, stay, etc.)
//   3. Defuzzify (centroid) to a crisp [-1, +1] paddle intensity, then
//      discretize back to {UP, STAY, DOWN}.
//
// See FUZZY_RULES below for the human-readable rule table.
// Dewan note: keep the control loop readable before tuning any thresholds.
// ============================================================================

import { ACTION, BALL, ENERGY, PADDLE, POWERUP, SIDE } from '../game/constants.js';
import { predictAtX, predictZAtX } from '../game/physics.js';

export function createFuzzyAgent() {
  let lastAction = ACTION.STAY;
  let hesitationTicks = 0;
  let trackingBias = 0;

  return {
    name: 'Fuzzy Logic',
    reset() {
      lastAction = ACTION.STAY;
      hesitationTicks = 0;
      trackingBias = 0;
    },
    decide(obs) {
      const self = obs.selfSide;
      const baseX = self === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
      const p = obs.paddles[self];
      const myX = p.x, myY = p.y, myZ = p.z;
      const ball = obs.ball;

      // ---- Crisp inputs ---------------------------------------------------
      const heading = self === SIDE.LEFT ? ball.vx < 0 : ball.vx > 0;
      const ballSpeed = Math.hypot(ball.vx, ball.vz);
      // Speed-scaled aim bias so matches complete. Faster balls are harder
      // to track perfectly — a realistic fatigue model.
      if (Math.random() < 0.3) {
        const speedFactor = Math.min(1.6, ballSpeed / BALL.startSpeed);
        trackingBias = randomRange(-0.38, 0.38) * speedFactor;
      }

      // 3D target prediction at the paddle's CURRENT x — tracks the actual
      // impact point including any forward lunge. This matches ball arrival.
      const pred = heading ? predictAtX(ball, myX) : null;
      const targetZ = pred ? pred.z + trackingBias : -myZ * 0.2;

      // Smash opportunity: if the ball arrives high on our side, aim paddle
      // slightly BELOW ball center so contact lands above paddle (yOff > 0),
      // driving the return downward. Small offset keeps contact reliable.
      const canSmash = pred && pred.y > 1.8;
      const targetY = pred
        ? clamp(canSmash ? pred.y - 0.3 : pred.y, PADDLE.yMin, PADDLE.yMax)
        : PADDLE.homeY;
      const alignDelta = targetZ - myZ;            // signed: positive = move +Z
      const distToBallX = Math.abs(ball.x - myX);
      const energy = obs.energy[self];
      const danger = computeDanger(distToBallX, ballSpeed, Math.abs(alignDelta));
      const urgency = computeUrgency(distToBallX, ballSpeed);

      // ---- Fuzzification --------------------------------------------------
      const dist  = fuzzifyDistance(distToBallX);          // {near, medium, far}
      const speed = fuzzifySpeed(ballSpeed);               // {slow, fast}
      const align = fuzzifyAlignment(Math.abs(alignDelta));// {good, bad}
      const eng   = fuzzifyEnergy(energy);                 // {low, medium, high}
      const dang  = fuzzifyDanger(danger);                 // {low, high}

      // ---- Rule evaluation: outputs are paddle-intensity buckets ---------
      // Output linguistic vars: STRONG_NEG, NEG, ZERO, POS, STRONG_POS
      // mapped to crisp centers: -1.0, -0.5, 0, +0.5, +1.0
      // The rule table stays small on purpose so the controller remains legible.
      const out = { sNeg: 0, neg: 0, zero: 0, pos: 0, sPos: 0 };

      const dir = alignDelta >= 0 ? 'pos' : 'neg';
      const sDir = dir === 'pos' ? 'sPos' : 'sNeg';
      const mDir = dir === 'pos' ? 'pos'  : 'neg';

      // R1: ball coming, alignment bad, danger high -> move strongly toward target
      out[sDir] = max(out[sDir], min(headingT(heading), align.bad, dang.high));
      // R2: ball coming, alignment bad, ball fast    -> move strongly
      out[sDir] = max(out[sDir], min(headingT(heading), align.bad, speed.fast));
      // R3: ball coming, alignment slightly off      -> move moderately
      out[mDir] = max(out[mDir], min(headingT(heading), align.bad, dist.medium));
      // R4: ball coming + already aligned            -> stay
      out.zero  = max(out.zero,  min(headingT(heading), align.good));
      // R5: ball going away, far                     -> drift toward center (zero)
      out.zero  = max(out.zero,  min(headingT(!heading), dist.far));
      // R6: ball going away, near                    -> small recovery toward center
      const centerDir = myZ > 0 ? 'neg' : 'pos';
      out[centerDir] = max(out[centerDir], min(headingT(!heading), dist.near));
      // R7: low energy + ball coming + bad alignment -> still chase (output strong)
      out[sDir] = max(out[sDir], min(eng.low, align.bad, headingT(heading)));

      // ---- Defuzzification (centroid) ------------------------------------
      // Aggregation stays weighted-average based so rule strengths blend smoothly.
      const num = out.sNeg * -1.0 + out.neg * -0.5 + out.zero * 0 + out.pos * 0.5 + out.sPos * 1.0;
      const den = out.sNeg + out.neg + out.zero + out.pos + out.sPos;
      const intensity = den > 0 ? num / den : 0;

      // Proportional Z control — tight tracking with no bang-bang shake.
      const zSlow = 0.18;
      let dz = clamp(alignDelta / zSlow, -1, 1);
      dz = clamp(dz * 0.8 + intensity * 0.4, -1, 1);
      hesitationTicks = 0;
      lastAction = Math.sign(dz);

      // ---- Y axis: fast proportional tracking of predicted ball height ---
      const dyDelta = targetY - myY;
      const ySlow = 0.12;
      const dy = clamp(dyDelta / ySlow, -1, 1);

      // ---- X axis: lunge only AFTER the ball has legally bounced on our
      // side. The rally state tells us definitively; no volley risk. We stay
      // at home during opponent's flight and after we've struck the ball.
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

      // ---- Power-up selection (also fuzzy-rule driven) -------------------
      const powerup = pickPowerupFuzzy({ obs, self, dist, speed, align, eng, dang, heading, urgency });

      return { action: { dz, dy, dx }, powerup };
    }
  };
}

// ---------------------------------------------------------------------------
// Membership functions (triangular / trapezoidal)
// ---------------------------------------------------------------------------
const tri = (x, a, b, c) => {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
};
const trapL = (x, b, c) => x <= b ? 1 : x >= c ? 0 : (c - x) / (c - b);
const trapR = (x, a, b) => x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
const min = Math.min;
const max = Math.max;

function fuzzifyDistance(d) {
  // d is in world units along X axis; arena width ~20.
  // Distance bands stay wide enough to avoid jitter on short rallies.
  return {
    near:   trapL(d, 2, 6),
    medium: tri(d, 4, 8, 12),
    far:    trapR(d, 10, 16)
  };
}
function fuzzifySpeed(s) {
  // Fast balls should lean toward aggressive tracking rather than hard turns.
  return {
    slow: trapL(s, BALL.startSpeed * 0.8, BALL.startSpeed * 1.3),
    fast: trapR(s, BALL.startSpeed * 1.1, BALL.startSpeed * 1.6)
  };
}
function fuzzifyAlignment(absDelta) {
  // 0 = perfectly aligned, PADDLE.depth = badly off.
  return {
    good: trapL(absDelta, 0.2, PADDLE.depth * 0.45),
    bad:  trapR(absDelta, PADDLE.depth * 0.25, PADDLE.depth * 0.9)
  };
}
function fuzzifyEnergy(e) {
  // Energy state should stay broad so low-resource behavior still looks smooth.
  return {
    low:    trapL(e, 20, 40),
    medium: tri(e, 30, 55, 80),
    high:   trapR(e, 65, 90)
  };
}
function fuzzifyDanger(d) {
  // Danger only spikes when several weak signals line up at once.
  return {
    low:  trapL(d, 0.3, 0.6),
    high: trapR(d, 0.5, 0.85)
  };
}

function computeDanger(distX, ballSpeed, absDelta) {
  // 0..1: closer ball + faster + worse alignment => more danger.
  const proximity = 1 - Math.min(1, distX / 14);
  const speedTerm = Math.min(1, ballSpeed / (BALL.startSpeed * 1.8));
  const alignTerm = Math.min(1, absDelta / PADDLE.depth);
  return Math.min(1, 0.45 * proximity + 0.30 * speedTerm + 0.25 * alignTerm);
}

function computeUrgency(distX, ballSpeed) {
  const proximity = 1 - Math.min(1, distX / 11.5);
  const speedTerm = Math.min(1, ballSpeed / (BALL.startSpeed * 1.7));
  return Math.min(1, 0.62 * proximity + 0.38 * speedTerm);
}

const headingT = (b) => (b ? 1 : 0);

// ---------------------------------------------------------------------------
// Fuzzy power-up selection
// ---------------------------------------------------------------------------
function pickPowerupFuzzy({ obs, self, dist, speed, align, eng, dang, heading, urgency }) {
  const e   = obs.energy[self];
  const cd  = obs.cooldowns[self];
  const act = obs.active[self];

  // Shield desirability: high danger AND alignment is bad AND we have energy.
  const shieldDesire = min(dang.high, align.bad, eng.medium + eng.high);
  if (
    heading &&
    shieldDesire > 0.68 &&
    e >= ENERGY.costs.shield &&
    cd.shield === 0 && act.shield === 0 &&
    urgency > 0.7
  ) return POWERUP.SHIELD;

  // Boost: medium distance, bad alignment, ball coming.
  const boostDesire = min(dist.medium, align.bad, speed.fast);
  if (
    heading &&
    boostDesire > 0.6 &&
    e >= ENERGY.costs.boost &&
    cd.boost === 0 && act.boost === 0 &&
    urgency > 0.52
  ) return POWERUP.BOOST;

  // Slow: ball is fast and we're poorly aligned.
  const slowDesire = min(speed.fast, align.bad);
  if (
    heading &&
    slowDesire > 0.66 &&
    e >= ENERGY.costs.slow &&
    cd.slow === 0 && act.slow === 0 &&
    urgency > 0.45
  ) return POWERUP.SLOW;

  return null;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// Documented rule table (for reports / docs)
// ---------------------------------------------------------------------------
export const FUZZY_RULES = [
  // [IF antecedents..., THEN output]
  ['heading=incoming AND alignment=bad AND danger=high',  'move STRONG toward target'],
  ['heading=incoming AND alignment=bad AND speed=fast',   'move STRONG toward target'],
  ['heading=incoming AND alignment=bad AND distance=med', 'move MODERATE toward target'],
  ['heading=incoming AND alignment=good',                  'STAY'],
  ['heading=outgoing AND distance=far',                    'STAY'],
  ['heading=outgoing AND distance=near',                   'drift toward center'],
  ['energy=low AND alignment=bad AND incoming',            'move STRONG (still chase)'],
  ['SHIELD desire = danger.high ∧ align.bad ∧ energy≥med', 'use SHIELD'],
  ['BOOST  desire = dist.med ∧ align.bad ∧ speed.fast',    'use BOOST'],
  ['SLOW   desire = speed.fast ∧ align.bad',               'use SLOW']
];
