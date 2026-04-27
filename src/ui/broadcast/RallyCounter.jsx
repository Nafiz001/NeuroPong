// Top-center rally counter with tick pulses on every hit. Subscribes to
// the scene bus for real-time pulse rather than reading rally hits from HUD.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSceneEvent } from '../../scene/sceneBus.js';

export default function RallyCounter({ hits }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    return onSceneEvent(ev => {
      if (ev.type === 'hit') setPulse(p => p + 1);
    });
  }, []);

  return (
    <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Rally</div>
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          <motion.span
            key={pulse}
            initial={{ scale: 1.45, opacity: 0.7 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{    scale: 0.9,  opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-display text-2xl font-bold tabular-nums text-white"
          >
            {String(hits).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
