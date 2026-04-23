// Floating bottom-bar: pause, reset, swap sides. Useful during the comparative
// study so you can flip which AI plays from which end and re-run.

import { resetMatch } from '../game/store.js';
import { state } from '../game/store.js';

export default function Controls({ onSwap, onMenu }) {
  function togglePause() {
    state.status = state.status === 'paused' ? 'playing' : 'paused';
  }
  function reset() {
    resetMatch();
  }
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
      <button onClick={togglePause}
        className="px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 rounded">
        Pause / Resume
      </button>
      <button onClick={reset}
        className="px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 rounded">
        Reset Match
      </button>
      <button onClick={onSwap}
        className="px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 rounded">
        Swap AIs
      </button>
      <button onClick={onMenu}
        className="px-3 py-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 rounded">
        Main Menu
      </button>
    </div>
  );
}
