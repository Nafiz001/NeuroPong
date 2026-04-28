// Headless balance simulator. Runs N matches between Minimax and Fuzzy
// alternating sides, prints win counts and total points scored.
//
// Usage: node scripts/simulate-balance.mjs [N]

import { setAgents, step, resetLoop } from '../src/game/loop.js';
import { resetMatch, state } from '../src/game/store.js';
import { createMinimaxAgent } from '../src/ai/MinimaxAgent.js';
import { createFuzzyAgent } from '../src/ai/FuzzyAgent.js';
import { SIDE } from '../src/game/constants.js';

function runMatch(minimaxLeft) {
  const minimax = createMinimaxAgent();
  const fuzzy   = createFuzzyAgent();
  if (minimaxLeft) setAgents(minimax, fuzzy);
  else             setAgents(fuzzy,   minimax);

  resetLoop();
  resetMatch();
  state.status = 'countdown';

  const stepMs = 1000 / 60;
  const maxIters = 60 * 60 * 8; // 8 sim-minute hard cap
  let i = 0;
  while (!state.matchOver && i++ < maxIters) {
    step(stepMs);
  }

  const sL = state.score[SIDE.LEFT];
  const sR = state.score[SIDE.RIGHT];
  const minimaxScore = minimaxLeft ? sL : sR;
  const fuzzyScore   = minimaxLeft ? sR : sL;
  const minimaxWon   = minimaxLeft ? state.winner === SIDE.LEFT
                                   : state.winner === SIDE.RIGHT;
  const minimaxSide = minimaxLeft ? SIDE.LEFT : SIDE.RIGHT;
  const fuzzySide   = minimaxLeft ? SIDE.RIGHT : SIDE.LEFT;
  const mMet = state.metrics[minimaxSide];
  const fMet = state.metrics[fuzzySide];
  return {
    minimaxScore, fuzzyScore, minimaxWon, matchOver: state.matchOver,
    mHits: mMet.hits, fHits: fMet.hits,
    mPow: { ...mMet.powerupUses }, fPow: { ...fMet.powerupUses }
  };
}

const N = parseInt(process.argv[2] ?? '20', 10);
let mWins = 0, fWins = 0, mPts = 0, fPts = 0, incomplete = 0;
let mHits = 0, fHits = 0;
let mPow = { boost:0, shield:0, slow:0 }, fPow = { boost:0, shield:0, slow:0 };

const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const r = runMatch(i % 2 === 0);
  if (!r.matchOver) incomplete++;
  if (r.minimaxWon) mWins++; else fWins++;
  mPts += r.minimaxScore;
  fPts += r.fuzzyScore;
  mHits += r.mHits; fHits += r.fHits;
  for (const k of ['boost','shield','slow']) { mPow[k]+=r.mPow[k]||0; fPow[k]+=r.fPow[k]||0; }
  process.stdout.write(
    `Match ${String(i+1).padStart(3)}: M=${r.minimaxScore} F=${r.fuzzyScore} ` +
    `${r.minimaxWon ? 'MINIMAX' : 'FUZZY'} ` +
    `${r.matchOver ? '' : '(timeout)'}\n`
  );
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

const winRate = (mWins / N * 100).toFixed(1);
console.log(`\n--- ${N} matches in ${elapsed}s ---`);
console.log(`Wins:    minimax ${mWins}  fuzzy ${fWins}   (minimax win-rate ${winRate}%)`);
console.log(`Points:  minimax ${mPts}  fuzzy ${fPts}   (avg ${(mPts/N).toFixed(2)} vs ${(fPts/N).toFixed(2)})`);
console.log(`Hits:    minimax ${mHits}  fuzzy ${fHits}`);
console.log(`Powerup: minimax ${JSON.stringify(mPow)}  fuzzy ${JSON.stringify(fPow)}`);
if (incomplete) console.log(`Incomplete (timeout): ${incomplete}`);
