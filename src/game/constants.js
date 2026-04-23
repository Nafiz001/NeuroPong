// Central tuning knobs. Keep deterministic — no Math.random anywhere downstream.

export const ARENA = {
  width: 20,        // X axis (length, paddle-to-paddle)
  depth: 12,        // Z axis (side wall to side wall)
  height: 6,        // Y axis (visual ceiling, not used for physics)
  wallThickness: 0.4
};

export const PADDLE = {
  width: 0.4,       // X thickness (blade)
  height: 1.2,      // legacy Y reference
  depth: 1.9,       // Z — blade diameter (round blade)
  bladeRadius: 0.95,// circular blade used for YZ-plane contact
  reachY: 2.35,     // legacy: max reachable contact height (kept for predict)
  baseSpeed: 13.0,  // Z movement speed (units / second)
  boostSpeed: 18.0,
  speedY: 10.0,     // Y (up/down) movement speed
  speedX: 5.0,      // X (forward/back lunge) movement speed
  // X positions of left/right paddles (home)
  leftX: -ARENA.width / 2 + 1.0,
  rightX:  ARENA.width / 2 - 1.0,
  // Clamp range on Z — paddle center can approach the table edge so the blade
  // reaches every z the ball can legally be at.
  zMin: -ARENA.depth / 2 + 1.0,
  zMax:  ARENA.depth / 2 - 1.0,
  // Y range — paddle can crouch low or reach high, but the blade+handle must
  // stay clear of the table surface (table top is at y≈0).
  homeY: 1.5,
  yMin: 1.4,
  yMax: 3.0,
  // X lunge range (how far paddle can move from home toward/away from net).
  // Modest forward lunge keeps the paddle well back when the ball is still
  // in the air; the rally-bounce gate in the AI prevents volleys.
  xForward: 1.6,
  xBack: 1.2
};

export const BALL = {
  radius: 0.25,
  startSpeed: 8.0,
  maxSpeed: 16.0,
  speedupOnHit: 1.025,       // multiplied each paddle hit
  slowdownFactor: 0.55,      // ball slowdown power-up
  maxBounceAngleRad: Math.PI / 8, // ~22.5 deg — ball stays catchable on Z
  gravity: -18.0,
  tableBounce: 0.9,
  tableFriction: 0.992,
  minBounceVy: 3.2,
  liftOnHit: 7.8,            // must clear the net and still land past it
  minOutVx: 12.0,            // paddle return must have enough horizontal speed
  maxVy: 11.5,
  netHeight: 0.42,
  netThickness: 0.08,
  netBounceX: 0.25,
  netBounceZ: 0.75,
  netBounceY: 0.45,
  magnus: 0.0032,           // stronger Magnus — spin visibly curves the ball
  spinDecayAir: 0.994,
  spinDecayBounce: 0.75,
  spinBounceCoupling: 0.0012  // spin alters post-bounce direction noticeably
};

export const ENERGY = {
  max: 100,
  start: 50,
  regenPerSecond: 5,
  costs: {
    boost: 25,
    shield: 35,
    slow: 30
  },
  cooldowns: {            // seconds between activations of the same power-up
    boost: 4,
    shield: 6,
    slow: 5
  },
  durations: {            // how long the effect lasts
    boost: 1.5,
    shield: 6.0,          // shield is one-shot; this is its expiry window
    slow: 2.0
  }
};

// Fixed simulation step. Decisions are made every DECISION_STEP_MS.
export const SIM = {
  fixedDtMs: 1000 / 60,            // 60Hz physics
  decisionDtMs: 1000 / 30,         // 30Hz AI decisions (discrete updates)
  startCountdownMs: 800,
  // How long the ball keeps flying after a miss before the point resolves —
  // lets the camera follow the event to its natural end.
  pointPendingMs: 900
};

export const SIDE = { LEFT: 'left', RIGHT: 'right' };

// Paddle action discretization (matches the prompt: Up / Down / Stay).
export const ACTION = { UP: 1, DOWN: -1, STAY: 0 };

export const POWERUP = {
  BOOST: 'boost',
  SHIELD: 'shield',
  SLOW: 'slow'
};

export const MATCH = {
  winScore: 7
};
