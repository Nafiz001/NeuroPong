// Commentary director. Subscribes to sceneBus, picks a line per priority,
// avoids repetition, exposes the current line through a zustand atom the
// CommentaryBanner subscribes to. When an audio asset is present it also
// ducks music via AudioEngine; the director works fine with text-only lines.

import { create } from 'zustand';
import { AudioEngine } from '../AudioEngine.js';
import { onSceneEvent } from '../../scene/sceneBus.js';
import linesRaw from './lines.json';

const RALLY_THRESHOLDS = [5, 10, 15];

export const useCommentary = create((set, get) => ({
  line: null,      // { id, speaker, text, priority, audio }
  history: [],     // last few keys played, to avoid repeats
  set(line) { set({ line }); },
  clear() { set({ line: null }); }
}));

const state = {
  subscribed: false,
  current: null,              // { line, priority, dispose, endsAt }
  queue: [],
  roundRobin: new Map(),
  lastRallyThreshold: -1,
  lineSeq: 0,
  speaker: 'COURTSIDE'
};

function resetRound() {
  state.lastRallyThreshold = -1;
}

function pickVariant(key) {
  const variants = linesRaw[key];
  if (!variants || variants.length === 0) return null;
  const idx = state.roundRobin.get(key) ?? Math.floor(Math.random() * variants.length);
  state.roundRobin.set(key, (idx + 1) % variants.length);
  return variants[idx];
}

function showLine(key, priority) {
  const variant = pickVariant(key);
  if (!variant) return;
  const id = ++state.lineSeq;
  const line = {
    id,
    speaker: state.speaker,
    text: variant.text,
    priority,
    key
  };

  // Swap if incoming is higher priority than current.
  if (state.current && priority < state.current.priority + 20) {
    // Queue if also above baseline (>= 60) — otherwise drop.
    if (priority >= 60) state.queue.push({ key, priority });
    return;
  }

  if (state.current?.dispose) state.current.dispose();
  state.current = {
    line,
    priority,
    dispose: () => {},
    endsAt: performance.now() + estimateDurationMs(line.text)
  };
  useCommentary.getState().set(line);

  if (variant.audio) {
    state.current.dispose = AudioEngine.playCommentary([variant.audio], {
      onEnd: () => finishLine(id)
    });
  } else {
    // Text-only fallback — duck music briefly so it still feels deliberate.
    AudioEngine.duckMusic(200);
    const delay = estimateDurationMs(line.text);
    setTimeout(() => {
      AudioEngine.unduckMusic(350);
      finishLine(id);
    }, delay);
    state.current.dispose = () => {};
  }
}

function finishLine(id) {
  if (!state.current || state.current.line.id !== id) return;
  state.current = null;
  useCommentary.getState().clear();
  // Drain queue (highest priority wins).
  if (state.queue.length) {
    state.queue.sort((a, b) => b.priority - a.priority);
    const next = state.queue.shift();
    showLine(next.key, next.priority);
  }
}

function estimateDurationMs(text) {
  return Math.max(1200, Math.min(4500, text.length * 55));
}

export function attachCommentaryDirector() {
  if (state.subscribed) return;
  state.subscribed = true;

  return onSceneEvent(ev => {
    if (ev.type === 'matchWon') {
      resetRound();
      showLine(`win_${ev.payload.winner}`, 100);
      return;
    }
    if (ev.type === 'miss') {
      if (ev.payload.isMatchPoint) {
        showLine(`match_point_${ev.payload.winner}`, 90);
      } else {
        showLine('point_scored', 20);
      }
      return;
    }
    if (ev.type === 'shieldAbsorb') {
      showLine('clutch_shield', 55);
      return;
    }
    if (ev.type === 'hit') {
      if (ev.payload.smash) {
        showLine('nice_smash', 40);
      }
      const hits = ev.payload.rallyHits;
      if (hits >= RALLY_THRESHOLDS[2] && state.lastRallyThreshold < 2) {
        state.lastRallyThreshold = 2;
        showLine('long_rally_long', 60);
      } else if (hits >= RALLY_THRESHOLDS[1] && state.lastRallyThreshold < 1) {
        state.lastRallyThreshold = 1;
        showLine('long_rally_mid', 60);
      } else if (hits >= RALLY_THRESHOLDS[0] && state.lastRallyThreshold < 0) {
        state.lastRallyThreshold = 0;
        showLine('long_rally_short', 60);
      }
      return;
    }
    if (ev.type === 'score') {
      // Reset thresholds on every new rally, not every score.
      state.lastRallyThreshold = -1;
    }
  });
}
