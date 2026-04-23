# NeuroPong Arena

A 3D AI vs AI Pong study comparing **Minimax (planning)** against **Fuzzy Logic (rule-based)**.
Two agents, no human input, fully deterministic physics.

## Team

| Module | Owner | File |
|---|---|---|
| Minimax AI | **Nafiz** | [src/ai/MinimaxAgent.js](src/ai/MinimaxAgent.js) |
| Fuzzy Logic AI | **Dewan** | [src/ai/FuzzyAgent.js](src/ai/FuzzyAgent.js) |

The two AI files are independent — neither imports the other. Both implement the
contract documented in [src/ai/AgentInterface.js](src/ai/AgentInterface.js).

## Stack

- React + Vite
- Three.js + @react-three/fiber
- @react-three/rapier (physics colliders, room for future RigidBody work)
- Tailwind CSS (HUD)
- Zustand (HUD-only React store)

## Run

```bash
npm install
npm run dev
```

## Project layout

```
neuropong/
├─ index.html
├─ package.json
├─ tailwind.config.js
├─ postcss.config.js
├─ vite.config.js
└─ src/
   ├─ main.jsx               # React entry
   ├─ App.jsx                # Canvas + HUD + agent wiring
   ├─ index.css              # Tailwind base
   │
   ├─ ai/                    # ← AI MODULES (independent)
   │  ├─ AgentInterface.js   #   Frozen contract for both AIs
   │  ├─ MinimaxAgent.js     #   Nafiz — planning-based
   │  └─ FuzzyAgent.js       #   Dewan — rule-based
   │
   ├─ game/                  # ← Pure simulation (no React, no Three)
   │  ├─ constants.js        #   All tuning numbers in one place
   │  ├─ store.js            #   Authoritative state + HUD store
   │  ├─ physics.js          #   Deterministic ball/paddle physics
   │  ├─ powerups.js         #   Energy + power-up effects
   │  └─ loop.js             #   Fixed-timestep loop, calls AIs
   │
   ├─ scene/                 # ← Three / R3F rendering only
   │  ├─ Arena.jsx
   │  ├─ Paddle.jsx
   │  ├─ Ball.jsx
   │  └─ GameLoopDriver.jsx  #   Bridges useFrame → loop.step()
   │
   └─ ui/                    # ← React HUD
      ├─ Hud.jsx
      └─ Controls.jsx
```

## Game loop architecture

```
        ┌───────────────────────────────────────────────┐
        │              R3F render frame                 │
        │  useFrame(dt) ──► GameLoopDriver.step(dtMs)   │
        └────────────────────────┬──────────────────────┘
                                 ▼
        ┌───────────────────────────────────────────────┐
        │              FIXED-STEP LOOP                  │
        │                                               │
        │  while accumulator >= 16.6ms:                 │
        │     if it's time for a decision (15 Hz):      │
        │        runDecisions()  ──► agent.decide(obs)  │
        │     physicsStep(1/60)                         │
        │       • move paddles by last decision         │
        │       • stepBall (deterministic)              │
        │       • resolve hit / miss / score            │
        │       • regen energy, tick cooldowns          │
        │                                               │
        │  every 100ms: publishHud() → React            │
        └───────────────────────────────────────────────┘
```

Why fixed-step? Minimax simulates the same physics function — must be
reproducible. Frame rate independence falls out for free.

## Agent contract

```js
agent = {
  name: string,
  reset?: () => void,
  decide(observation) -> { action: -1|0|1, powerup?: 'boost'|'shield'|'slow'|null }
}
```

Both agents see identical observations (see [AgentInterface.js](src/ai/AgentInterface.js)).
The loop validates power-up requests — failed activations are silently dropped,
so agents can always request optimistically.

## Minimax (Nafiz)

- Depth-limited (default depth=3) with alpha-beta pruning
- Each ply = 6 sub-steps × 1/60s ≈ 100ms of simulated game time
- Branching factor of 3 (UP / STAY / DOWN) keeps cost bounded:
  worst-case `3^depth` = 27 leaves per decision before pruning
- Reuses `simulateBall()` from [physics.js](src/game/physics.js) so the rollout
  is identical to live play

### Evaluation features

| Feature | Direction |
|---|---|
| Distance to predicted impact | minimize |
| Scoring chance (gap on opponent side) | maximize |
| Paddle alignment / center bias | minimize displacement when idle |
| Risk of missing (close + fast + offset) | minimize |
| Energy usage | factored into power-up gating |

Power-up choice is a separate cheap rule (boost when catchable-but-far,
shield on near-certain miss, slow when ball is fast and offset is large).

## Fuzzy Logic (Dewan)

Mamdani controller. No search.

### Inputs (linguistic vars)

| Crisp input | Linguistic values |
|---|---|
| Ball distance (X) | near / medium / far |
| Ball speed | slow / fast |
| Alignment error | good / bad |
| Energy | low / medium / high |
| Danger | low / high |

### Output

Paddle-intensity buckets `{STRONG_NEG, NEG, ZERO, POS, STRONG_POS}`,
defuzzified by centroid to `[-1, +1]`, then snapped to UP / STAY / DOWN.

### Rule table (excerpt)

| IF | THEN |
|---|---|
| incoming AND alignment=bad AND danger=high | move STRONG toward target |
| incoming AND alignment=bad AND speed=fast | move STRONG toward target |
| incoming AND alignment=bad AND distance=med | move MODERATE toward target |
| incoming AND alignment=good | STAY |
| outgoing AND distance=far | STAY |
| outgoing AND distance=near | drift toward center |
| energy=low AND alignment=bad AND incoming | STRONG (still chase) |
| danger.high ∧ align.bad ∧ energy≥med | use SHIELD |
| dist.med ∧ align.bad ∧ speed.fast | use BOOST |
| speed.fast ∧ align.bad | use SLOW |

Full rule list: `FUZZY_RULES` export in [FuzzyAgent.js](src/ai/FuzzyAgent.js).

## Power-up & energy system

| Power-up | Cost | Cooldown | Duration | Effect |
|---|---|---|---|---|
| Boost | 25 | 4s | 1.5s | paddle moves at `boostSpeed` |
| Shield | 35 | 6s | 6s window | absorbs the next would-be point |
| Slow | 30 | 5s | 2s | scales ball displacement (clean & deterministic) |

Energy regenerates at 5/s up to 100. All timers tick inside the fixed step,
so two identical runs produce identical games.

## Metrics tracked

For each agent:

- **Score** — points won
- **Hits / Misses** — per-rally
- **Rally length** — list, plus average
- **Energy used** — total cost spent on power-ups
- **Power-up uses** — counts per type
- **AI efficiency** — `hits / (hits + misses)`
- **Decision time** — average ms per `decide()` call (lets you compare
  Minimax depth vs. Fuzzy controller cost)

## Suggested visualizations (optional)

- **Predicted-Z line**: draw a thin line from the ball to `predictZAtX(myX)`
  for each side — instantly shows what each AI thinks the impact point is.
- **Search-tree depth meter**: track and display Minimax's actual node count
  per decision (add a counter inside `minimax()`).
- **Active membership chart**: small bar chart on the Fuzzy side showing
  current dist/speed/align/danger memberships — great for explaining the
  rule firings live.

## How to extend

- New power-up → add it to `ENERGY.costs/cooldowns/durations` in
  [constants.js](src/game/constants.js), wire the effect in
  [powerups.js](src/game/powerups.js), and let agents request it.
- New AI → drop a file in `src/ai/`, implement `decide(obs)`, register it in
  [App.jsx](src/App.jsx).
- Headless benchmark → `setAgents(...)` then loop `step(SIM.fixedDtMs)` N
  times in a Node script. The simulation has no Three.js dependencies.
