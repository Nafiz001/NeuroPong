// Authoritative game state. Held outside React render path to keep the
// simulation deterministic and decoupled from the 3D scene.
//
// React subscribes for HUD/UI only — the game loop mutates `state` directly
// and pushes immutable snapshots to zustand for the HUD at a low rate.

import { create } from 'zustand';
import { ARENA, BALL, ENERGY, PADDLE, SIDE } from './constants.js';
import { stepBall } from './physics.js';

// ---- Mutable simulation state (NOT part of React store) ---------------------

export const state = {
  ball: {
    x: 0, y: BALL.radius + 0.06, z: 0,
    vx: BALL.startSpeed, vy: 2.4, vz: BALL.startSpeed * 0.2,
    wx: 0, wy: 0, wz: 0
  },
  paddles: {
    [SIDE.LEFT]:  { x: PADDLE.leftX,  y: PADDLE.homeY, z: 0, vx: 0, vy: 0, vz: 0 },
    [SIDE.RIGHT]: { x: PADDLE.rightX, y: PADDLE.homeY, z: 0, vx: 0, vy: 0, vz: 0 }
  },
  energy: {
    [SIDE.LEFT]:  ENERGY.start,
    [SIDE.RIGHT]: ENERGY.start
  },
  // Per-side, per-powerup remaining cooldown (seconds) and active duration (s).
  cooldowns: {
    [SIDE.LEFT]:  { boost: 0, shield: 0, slow: 0 },
    [SIDE.RIGHT]: { boost: 0, shield: 0, slow: 0 }
  },
  active: {
    [SIDE.LEFT]:  { boost: 0, shield: 0, slow: 0 },
    [SIDE.RIGHT]: { boost: 0, shield: 0, slow: 0 }
  },
  score: { [SIDE.LEFT]: 0, [SIDE.RIGHT]: 0 },
  rally: {
    hits: 0,
    startTime: 0,
    serveStage: 1,          // 1: serve must first-bounce on receiver side, 0: normal rally
    expectedBounceSide: SIDE.LEFT,
    bounceCount: 0,
    lastHitter: SIDE.LEFT,
    netTouches: 0,
    // Point-pending bookkeeping: ball keeps flying for a short window after a
    // miss so the scoring event visibly completes before the serve resets.
    pendingLoser: null,
    pendingMs: 0
  },
  // Aggregate metrics for the comparative study.
  metrics: {
    [SIDE.LEFT]:  freshAgentMetrics(),
    [SIDE.RIGHT]: freshAgentMetrics()
  },
  matchOver: false,
  winner: null,
  server: SIDE.LEFT,
  // Status of the round.
  status: 'paused',        // 'countdown' | 'playing' | 'point' | 'paused'
  countdown: 0,
  serveTo: SIDE.RIGHT,     // retained for HUD/debug compatibility
  tick: 0,
  simTimeMs: 0
};

function freshAgentMetrics() {
  return {
    hits: 0,
    misses: 0,
    rallyLengths: [],
    energyUsed: 0,
    powerupUses: { boost: 0, shield: 0, slow: 0 },
    decisionCount: 0,
    decisionTimeMs: 0
  };
}

export function resetMatch() {
  state.score[SIDE.LEFT] = 0;
  state.score[SIDE.RIGHT] = 0;
  state.energy[SIDE.LEFT] = ENERGY.start;
  state.energy[SIDE.RIGHT] = ENERGY.start;
  state.metrics[SIDE.LEFT] = freshAgentMetrics();
  state.metrics[SIDE.RIGHT] = freshAgentMetrics();
  state.matchOver = false;
  state.winner = null;
  const initialServer = Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT;
  resetForServe(initialServer);
}

export function resetForServe(serverSide) {
  state.server = serverSide;
  state.serveTo = serverSide;

  const receiverSide = serverSide === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
  const serveZ = randRange(PADDLE.zMin * 0.65, PADDLE.zMax * 0.65);

  for (const s of [SIDE.LEFT, SIDE.RIGHT]) {
    state.paddles[s].z = 0;
    state.paddles[s].y = PADDLE.homeY;
    state.paddles[s].x = s === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
    state.paddles[s].vx = 0;
    state.paddles[s].vy = 0;
    state.paddles[s].vz = 0;
  }
  state.paddles[serverSide].z = serveZ;
  state.paddles[receiverSide].z = randRange(PADDLE.zMin * 0.35, PADDLE.zMax * 0.35);
  // Clear active effects so serve trajectory is not altered by previous point.
  state.active[SIDE.LEFT].boost = 0;
  state.active[SIDE.LEFT].shield = 0;
  state.active[SIDE.LEFT].slow = 0;
  state.active[SIDE.RIGHT].boost = 0;
  state.active[SIDE.RIGHT].shield = 0;
  state.active[SIDE.RIGHT].slow = 0;

  const serverX = serverSide === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
  const dirX = serverSide === SIDE.LEFT ? 1 : -1;

  state.ball.x = serverX + dirX * (PADDLE.width / 2 + BALL.radius + 0.1);
  state.ball.y = BALL.radius + 0.34;
  state.ball.z = state.paddles[serverSide].z + randRange(-0.15, 0.15);

  const serve = createLegalServe(serverSide, state.ball.x, state.ball.y, state.ball.z);
  state.ball.vx = serve.vx;
  state.ball.vy = serve.vy;
  state.ball.vz = serve.vz;
  state.ball.wx = serve.wx;
  state.ball.wy = serve.wy;
  state.ball.wz = serve.wz;

  state.rally.hits = 0;
  state.rally.startTime = state.simTimeMs;
  state.rally.serveStage = 1;
  state.rally.expectedBounceSide = receiverSide;
  state.rally.bounceCount = 0;
  state.rally.lastHitter = serverSide;
  state.rally.netTouches = 0;
  state.rally.pendingLoser = null;
  state.rally.pendingMs = 0;
  state.status = 'countdown';
  state.countdown = 0;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function createLegalServe(serverSide, x0, y0, z0) {
  const tableHalfDepth = ARENA.depth / 2 - ARENA.wallThickness / 2;
  const serveDir = dirFor(serverSide);
  const receiverSide = opposite(serverSide);

  for (let i = 0; i < 72; i++) {
    const firstBounceX = serveDir * randRange(0.9, 3.2);
    const firstBounceZ = randRange(-tableHalfDepth * 0.42, tableHalfDepth * 0.42);
    const t1 = randRange(0.54, 0.74);

    const vx = (firstBounceX - x0) / t1;
    const vz = (firstBounceZ - z0) / t1;
    const vy = (BALL.radius + 0.01 - y0 - 0.5 * BALL.gravity * t1 * t1) / t1;

    const candidate = {
      vx,
      vy,
      vz,
      // Keep serve spin low so it does not invalidate legal serve path.
      wx: randRange(-1.2, 1.2),
      wy: dirFor(serverSide) * randRange(1.5, 4.5),
      wz: randRange(-1.2, 1.2)
    };

    if (isLegalServeCandidate(serverSide, receiverSide, x0, y0, z0, candidate)) {
      return candidate;
    }
  }

  // Safe fallback serve.
  const fallback = {
    vx: serveDir * 8.8,
    vy: 5.5,
    vz: randRange(-0.9, 0.9),
    wx: 0,
    wy: serveDir * 1.8,
    wz: 0
  };
  if (isLegalServeCandidate(serverSide, receiverSide, x0, y0, z0, fallback)) {
    return fallback;
  }

  // Last-resort straight legal-ish serve.
  return {
    vx: serveDir * 9.3,
    vy: 6.0,
    vz: 0,
    wx: 0,
    wy: 0,
    wz: 0
  };
}

function dirFor(side) {
  return side === SIDE.LEFT ? 1 : -1;
}

function opposite(side) {
  return side === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
}

function isLegalServeCandidate(serverSide, receiverSide, x0, y0, z0, candidate) {
  const ball = {
    x: x0,
    y: y0,
    z: z0,
    vx: candidate.vx,
    vy: candidate.vy,
    vz: candidate.vz,
    wx: candidate.wx,
    wy: candidate.wy,
    wz: candidate.wz
  };

  // Keep paddles far from path to avoid accidental hit events in validation.
  const paddles = {
    [SIDE.LEFT]: { x: PADDLE.leftX, y: PADDLE.homeY, z: 999, vx: 0, vy: 0, vz: 0 },
    [SIDE.RIGHT]: { x: PADDLE.rightX, y: PADDLE.homeY, z: -999, vx: 0, vy: 0, vz: 0 }
  };

  let bounceCount = 0;

  for (let i = 0; i < 720; i++) {
    const ev = stepBall(ball, paddles, 1 / 240, { allowPaddleHits: false });
    if (!ev) continue;

    if (ev.net || ev.out || ev.hit || ev.miss) {
      return false;
    }

    if (!ev.bounce) continue;

    bounceCount += 1;
    if (bounceCount === 1) {
      return ev.bounce === receiverSide;
    }
  }

  return false;
}

// ---- React-visible store (HUD only) ----------------------------------------

export const useHud = create(() => ({
  scoreL: 0, scoreR: 0,
  energyL: ENERGY.start, energyR: ENERGY.start,
  status: 'paused',
  rallyHits: 0,
  cooldownsL: { boost: 0, shield: 0, slow: 0 },
  cooldownsR: { boost: 0, shield: 0, slow: 0 },
  activeL:    { boost: 0, shield: 0, slow: 0 },
  activeR:    { boost: 0, shield: 0, slow: 0 },
  matchOver: false,
  winner: null,
  metricsL: freshAgentMetrics(),
  metricsR: freshAgentMetrics()
}));

// Push a snapshot from `state` into the React HUD store. Called ~10x/sec.
export function publishHud() {
  useHud.setState({
    scoreL: state.score[SIDE.LEFT],
    scoreR: state.score[SIDE.RIGHT],
    energyL: state.energy[SIDE.LEFT],
    energyR: state.energy[SIDE.RIGHT],
    status: state.status,
    rallyHits: state.rally.hits,
    cooldownsL: { ...state.cooldowns[SIDE.LEFT] },
    cooldownsR: { ...state.cooldowns[SIDE.RIGHT] },
    activeL:    { ...state.active[SIDE.LEFT] },
    activeR:    { ...state.active[SIDE.RIGHT] },
    matchOver: state.matchOver,
    winner: state.winner,
    metricsL: { ...state.metrics[SIDE.LEFT] },
    metricsR: { ...state.metrics[SIDE.RIGHT] }
  });
}

// Useful for debug overlays.
export const ARENA_REF = ARENA;
