// Broadcast-styled floating controls. Sits above the lower-third so the
// score banner stays unobstructed.

import { resetMatch, state } from '../game/store.js';
import AudioToggle from './AudioToggle.jsx';

export default function Controls({ onSwap, onMenu }) {
  function togglePause() {
    state.status = state.status === 'paused' ? 'playing' : 'paused';
  }
  function reset() {
    resetMatch();
  }

  return (
    <div className="pointer-events-auto absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2">
      <ControlBtn onClick={togglePause} label="Pause / Resume" />
      <ControlBtn onClick={reset}        label="Reset" />
      <ControlBtn onClick={onSwap}       label="Swap Agents" />
      <AudioToggle />
      <ControlBtn onClick={onMenu}       label="Main Menu" />
    </div>
  );
}

function ControlBtn({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-200 bg-bg-1/85 hover:bg-bg-2/95 border border-white/10 rounded transition"
    >
      {label}
    </button>
  );
}
