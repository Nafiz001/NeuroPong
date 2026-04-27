// Telemetry drawer. Toggle with Alt+T. Shows the minimax/fuzzy introspection
// for the selected side.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHud } from '../../game/store.js';
import MinimaxTreeView from './MinimaxTreeView.jsx';
import FuzzyRuleStrip from './FuzzyRuleStrip.jsx';

export default function TelemetryPanel() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState('left');
  const debugL = useHud(s => s.debugL);
  const debugR = useHud(s => s.debugR);
  const debug = side === 'left' ? debugL : debugR;

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="pointer-events-auto absolute top-4 right-1/2 translate-x-1/2 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] uppercase text-slate-300 hover:text-white border border-white/10 rounded-full bg-bg-1/60"
      >
        Telemetry (alt+T)
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 360, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto absolute top-28 right-4 w-[360px] broadcast-slab rounded-xl p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs uppercase tracking-[0.22em] text-brand-accent font-semibold">
                AI Telemetry
              </div>
              <div className="flex gap-1">
                <TabButton active={side === 'left'}  onClick={() => setSide('left')}  label="Voltari" />
                <TabButton active={side === 'right'} onClick={() => setSide('right')} label="Ember Lynx" />
              </div>
            </div>
            {!debug && (
              <div className="text-xs text-slate-400 italic">
                No decision data yet — start a match and open again.
              </div>
            )}
            {debug?.kind === 'minimax' && <MinimaxTreeView debug={debug} />}
            {debug?.kind === 'fuzzy'   && <FuzzyRuleStrip  debug={debug} />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({ active, onClick, label }) {
  const cls = active
    ? 'bg-white/10 text-white border-white/30'
    : 'text-slate-400 border-white/10 hover:text-slate-200';
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${cls}`}
    >
      {label}
    </button>
  );
}
