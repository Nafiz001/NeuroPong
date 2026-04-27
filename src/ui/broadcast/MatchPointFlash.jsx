// Full-screen match-point overlay. Drives the red-hot pulse border and shows
// a minimal title. Auto-dismisses after a short window.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSceneEvent } from '../../scene/sceneBus.js';

export default function MatchPointFlash() {
  const [state, setState] = useState(null);   // { kind: 'point'|'won', winnerName }

  useEffect(() => {
    return onSceneEvent(ev => {
      if (ev.type === 'matchWon') {
        setState({ kind: 'won', winnerSide: ev.payload.winner });
        setTimeout(() => setState(null), 2800);
      } else if (ev.type === 'miss' && ev.payload.isMatchPoint) {
        setState({ kind: 'point', winnerSide: ev.payload.winner });
        setTimeout(() => setState(null), 1600);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key={state.kind + state.winnerSide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center match-point-pulse"
        >
          <div className="broadcast-slab px-10 py-4 rounded-2xl border-2 border-red-500/70">
            <div className="text-xs tracking-[0.3em] uppercase text-red-400 font-semibold text-center">
              {state.kind === 'won' ? 'Match Won' : 'Match Point'}
            </div>
            <div className="font-display text-3xl font-black text-white text-center mt-1">
              {state.winnerSide === 'left' ? 'VOLTARI' : 'EMBER LYNX'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
