// Fixed-timestep deterministic game loop.
//
// Architecture:
//   render frame (R3F useFrame)  --->  step(realDt)
//     - accumulates time
//     - while accumulator >= fixedDt:
//         - tick AIs at decisionDt (subset of physics ticks)
//         - tick physics (paddles, ball, power-ups)
//         - resolve scoring
//
// Reasons for fixed-step:
//   * Minimax simulates the same physics function — must be reproducible.
//   * Decoupled from frame rate — looks identical at 30/60/144Hz.

import { ACTION, BALL, ENERGY, MATCH, PADDLE, POWERUP, SIDE, SIM } from './constants.js';
import { simulateBall, stepBall } from './physics.js';
import { state, resetForServe, publishHud, pushEvent } from './store.js';
import {
  activate, ballSpeedMultiplier, canUse, regenEnergy,
  tickTimers, tryAbsorbWithShield
} from './powerups.js';

// AI registry: { left: agentImpl, right: agentImpl }.
// Each agent must expose: decide(observation) -> { action, powerup? }
let agents = { [SIDE.LEFT]: null, [SIDE.RIGHT]: null };

export function setAgents(left, right) {
  agents[SIDE.LEFT] = left;
  agents[SIDE.RIGHT] = right;
}

// Per-side cached last decision so agents only re-decide every decisionDt.
const zeroVec = () => ({ dx: 0, dy: 0, dz: 0 });
const lastDecision = {
  [SIDE.LEFT]:  { action: zeroVec(), powerup: null },
  [SIDE.RIGHT]: { action: zeroVec(), powerup: null }
};

function normalizeAction(a) {
  if (a == null) return zeroVec();
  if (typeof a === 'number') return { dx: 0, dy: 0, dz: a };
  return {
    dx: Math.max(-1, Math.min(1, a.dx ?? 0)),
    dy: Math.max(-1, Math.min(1, a.dy ?? 0)),
    dz: Math.max(-1, Math.min(1, a.dz ?? 0))
  };
}
let decisionAccumMs = 0;
let physicsAccumMs = 0;
let hudAccumMs = 0;
let timeScale = 1;

export function setTimeScale(scale) {
  timeScale = Math.max(0.5, Math.min(1.5, scale));
}

// Build the observation handed to each AI. Both AIs see the same shape.
// `selfSide` lets the agent know which paddle is theirs.
function buildObservation(selfSide) {
  return {
    selfSide,
    ball: { ...state.ball },
    paddles: {
      [SIDE.LEFT]:  { ...state.paddles[SIDE.LEFT] },
      [SIDE.RIGHT]: { ...state.paddles[SIDE.RIGHT] }
    },
    energy: {
      [SIDE.LEFT]:  state.energy[SIDE.LEFT],
      [SIDE.RIGHT]: state.energy[SIDE.RIGHT]
    },
    cooldowns: {
      [SIDE.LEFT]:  { ...state.cooldowns[SIDE.LEFT] },
      [SIDE.RIGHT]: { ...state.cooldowns[SIDE.RIGHT] }
    },
    active: {
      [SIDE.LEFT]:  { ...state.active[SIDE.LEFT] },
      [SIDE.RIGHT]: { ...state.active[SIDE.RIGHT] }
    },
    rally: {
      serveStage: state.rally.serveStage,
      bounceCount: state.rally.bounceCount,
      expectedBounceSide: state.rally.expectedBounceSide,
      lastHitter: state.rally.lastHitter
    },
    constants: { ARENA_WIDTH: PADDLE.rightX - PADDLE.leftX, BALL, PADDLE, ENERGY }
  };
}

function applyDecision(side, decision) {
  if (!decision) return;
  if (state.rally.serveStage === 0 && decision.powerup && canUse(state, side, decision.powerup)) {
    activate(state, side, decision.powerup);
    pushEvent('powerup', { side, kind: decision.powerup });
  }
  if (decision.debug !== undefined) {
    // Freeze once to prevent UI mutation leaking into agent memory next turn.
    state.lastDebug[side] = decision.debug ? Object.freeze(decision.debug) : null;
  }
  lastDecision[side] = {
    action: normalizeAction(decision.action),
    powerup: decision.powerup ?? null
  };
}

function runDecisions() {
  for (const side of [SIDE.LEFT, SIDE.RIGHT]) {
    const agent = agents[side];
    if (!agent) continue;
    const obs = buildObservation(side);
    const t0 = performance.now();
    let decision;
    try {
      decision = agent.decide(obs);
    } catch (err) {
      console.error('Agent error', side, err);
      decision = { action: ACTION.STAY };
    }
    state.metrics[side].decisionTimeMs += performance.now() - t0;
    state.metrics[side].decisionCount++;
    applyDecision(side, decision);
  }
}

function moveOnePaddle(side, dt) {
  const dec = lastDecision[side];
  const act = dec.action;
  const speedZ = state.active[side].boost > 0 ? PADDLE.boostSpeed : PADDLE.baseSpeed;
  const speedY = PADDLE.speedY;
  const speedX = PADDLE.speedX;
  const p = state.paddles[side];
  const baseX = side === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
  const xMin = side === SIDE.LEFT ? baseX - PADDLE.xBack : baseX - PADDLE.xForward;
  const xMax = side === SIDE.LEFT ? baseX + PADDLE.xForward : baseX + PADDLE.xBack;

  // Slight velocity smoothing so single-tick command flips don't visibly jerk
  // the paddle. Fast time-constant keeps response tight.
  const targetVz = act.dz * speedZ;
  const targetVy = act.dy * speedY;
  const targetVx = act.dx * speedX;
  const alpha = 1 - Math.exp(-dt * 60);
  p.vz += (targetVz - p.vz) * alpha;
  p.vy += (targetVy - p.vy) * alpha;
  p.vx += (targetVx - p.vx) * alpha;

  p.z = Math.max(PADDLE.zMin, Math.min(PADDLE.zMax, p.z + p.vz * dt));
  p.y = Math.max(PADDLE.yMin, Math.min(PADDLE.yMax, p.y + p.vy * dt));
  p.x = Math.max(xMin, Math.min(xMax, p.x + p.vx * dt));
}

function physicsStep(dtSeconds) {
  state.simTimeMs += dtSeconds * 1000;
  state.tick++;

  if (state.status === 'countdown') {
    state.countdown += dtSeconds * 1000;
    if (state.countdown >= SIM.startCountdownMs) {
      state.status = 'playing';
      state.rally.startTime = state.simTimeMs;
    }
    regenEnergy(state, dtSeconds);
    tickTimers(state, dtSeconds);
    return;
  }

  if (state.status === 'pointPending') {
    // Keep the ball flying so the miss plays out visually, then resolve.
    moveOnePaddle(SIDE.LEFT, dtSeconds);
    moveOnePaddle(SIDE.RIGHT, dtSeconds);
    stepBall(state.ball, state.paddles, dtSeconds, { allowPaddleHits: false });
    state.rally.pendingMs -= dtSeconds * 1000;
    tickTimers(state, dtSeconds);
    if (state.rally.pendingMs <= 0) {
      resolvePoint();
    }
    return;
  }

  if (state.status !== 'playing') return;

  const inServePhase = state.rally.serveStage > 0;
  // Players can reposition during serve flight, but contact stays disabled.
  moveOnePaddle(SIDE.LEFT, dtSeconds);
  moveOnePaddle(SIDE.RIGHT, dtSeconds);

  // Slow power-up: shrink the effective time the ball moves this tick.
  // Velocity stays canonical, displacement is reduced — clean and reversible.
  const slowMul = inServePhase ? 1.0 : ballSpeedMultiplier(state);
  const ev = stepBall(
    state.ball,
    state.paddles,
    dtSeconds * slowMul,
    { allowPaddleHits: !inServePhase }
  );

  if (ev) {
    handleBallEvent(ev);
  }

  regenEnergy(state, dtSeconds);
  tickTimers(state, dtSeconds);
}

function handleBallEvent(ev) {
  if (ev.net) {
    handleNetTouch();
    return;
  }
  if (ev.bounce) {
    handleTableBounce(ev.bounce);
    return;
  }
  if (ev.hit) {
    handlePaddleHit(ev.hit);
    return;
  }
  if (ev.out) {
    handleSideOut(ev.side);
    return;
  }
  if (ev.miss) {
    handleEndMiss(ev.miss);
  }
}

function handleNetTouch() {
  state.rally.netTouches++;
  pushEvent('net', { ballVx: state.ball.vx, ballVz: state.ball.vz });
  // Official TT: serve net touch with otherwise valid path is a let (re-serve).
  if (state.rally.serveStage > 0) {
    resetForServe(state.server);
  }
}

function handleTableBounce(side) {
  pushEvent('bounce', { side, ballSpeed: Math.hypot(state.ball.vx, state.ball.vy, state.ball.vz) });

  const server = state.server;
  const receiver = opposite(server);

  if (state.rally.serveStage === 1) {
    if (side !== receiver) {
      handleMiss(server);
      return;
    }
    state.rally.serveStage = 0;
    state.rally.expectedBounceSide = receiver;
    state.rally.bounceCount = 1;
    return;
  }

  if (side !== state.rally.expectedBounceSide) {
    handleMiss(state.rally.lastHitter);
    return;
  }

  state.rally.bounceCount += 1;
  if (state.rally.bounceCount > 1) {
    handleMiss(side);
  }
}

function handlePaddleHit(side) {
  if (state.rally.serveStage > 0) {
    handleMiss(side);
    return;
  }

  if (side !== state.rally.expectedBounceSide) {
    handleMiss(side);
    return;
  }

  if (state.rally.bounceCount < 1) {
    // No-volley rule in table tennis: ball must bounce before return.
    handleMiss(side);
    return;
  }

  state.rally.hits++;
  state.metrics[side].hits++;
  state.rally.lastHitter = side;
  state.rally.expectedBounceSide = opposite(side);
  state.rally.bounceCount = 0;

  const ballSpeed = Math.hypot(state.ball.vx, state.ball.vy, state.ball.vz);
  const smash = state.ball.vy < -5 && state.ball.y > 1.7;
  pushEvent('hit', {
    side,
    ballSpeed,
    smash,
    rallyHits: state.rally.hits
  });
}

function handleSideOut(side) {
  if (state.rally.serveStage > 0) {
    handleMiss(state.server);
    return;
  }

  if (side !== state.rally.expectedBounceSide || state.rally.bounceCount === 0) {
    handleMiss(state.rally.lastHitter);
    return;
  }

  handleMiss(side);
}

function handleEndMiss(side) {
  if (state.rally.serveStage > 0) {
    handleMiss(state.server);
    return;
  }

  if (side !== state.rally.expectedBounceSide || state.rally.bounceCount === 0) {
    handleMiss(state.rally.lastHitter);
    return;
  }

  handleMiss(side);
}

function handleMiss(losingSide) {
  if (tryAbsorbWithShield(state, losingSide)) {
    // Shield absorbs the miss. No stats update, no point, quick reset.
    pushEvent('shieldAbsorb', { side: losingSide });
    resetForServe(nextServer(state.server));
    return;
  }

  // Defer the point: let the ball keep moving so the event resolves on screen.
  state.metrics[losingSide].misses++;
  state.metrics[losingSide].rallyLengths.push(state.rally.hits);
  state.rally.pendingLoser = losingSide;
  state.rally.pendingMs = SIM.pointPendingMs;
  state.status = 'pointPending';

  const winner = opposite(losingSide);
  const nextScore = state.score[winner] + 1;
  const isMatchPoint = nextScore + 1 >= MATCH.winScore && nextScore < MATCH.winScore;
  const isMatchWon   = nextScore >= MATCH.winScore;
  pushEvent('miss', {
    loser: losingSide,
    winner,
    rallyHits: state.rally.hits,
    isMatchPoint,
    isMatchWon
  });
}

function resolvePoint() {
  const losingSide = state.rally.pendingLoser;
  state.rally.pendingLoser = null;
  state.rally.pendingMs = 0;

  if (losingSide == null) {
    resetForServe(nextServer(state.server));
    return;
  }

  const winner = losingSide === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
  state.score[winner]++;
  pushEvent('score', { winner, scoreL: state.score[SIDE.LEFT], scoreR: state.score[SIDE.RIGHT] });

  if (state.score[winner] >= MATCH.winScore) {
    state.matchOver = true;
    state.winner = winner;
    state.status = 'paused';
    pushEvent('matchWon', {
      winner,
      scoreL: state.score[SIDE.LEFT],
      scoreR: state.score[SIDE.RIGHT]
    });
    return;
  }

  resetForServe(nextServer(state.server));
}

function nextServer(side) {
  return side === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
}

function opposite(side) {
  return side === SIDE.LEFT ? SIDE.RIGHT : SIDE.LEFT;
}

// Public: called every render frame from R3F. realDtMs is wall-clock delta.
export function step(realDtMs) {
  // Cap to avoid huge jumps after a tab pause (keeps determinism in spirit).
  const dt = Math.min(realDtMs, 100) * timeScale;
  physicsAccumMs += dt;
  decisionAccumMs += dt;
  hudAccumMs += dt;

  while (physicsAccumMs >= SIM.fixedDtMs) {
    if (decisionAccumMs >= SIM.decisionDtMs) {
      runDecisions();
      decisionAccumMs -= SIM.decisionDtMs;
    }
    physicsStep(SIM.fixedDtMs / 1000);
    physicsAccumMs -= SIM.fixedDtMs;
  }

  if (hudAccumMs >= 100) {
    publishHud();
    hudAccumMs = 0;
  }
}

export function resetLoop() {
  decisionAccumMs = 0;
  physicsAccumMs = 0;
  hudAccumMs = 0;
}
