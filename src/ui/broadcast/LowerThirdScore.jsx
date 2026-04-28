// Broadcast lower-third — always-on match banner at the bottom center.
// Score + rally clock + small brand mark.

import { motion } from 'framer-motion';
import FactionMark from '../../branding/logos/FactionMark.jsx';

export default function LowerThirdScore({
  leftFaction,
  rightFaction,
  scoreL,
  scoreR,
  rallyHits,
  status
}) {
  return (
    <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2">
    <motion.div
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="broadcast-slab rounded-xl px-6 py-3 flex items-center gap-5 min-w-[420px]"
    >
      <div className="flex items-center gap-2">
        <FactionMark faction={leftFaction} size={34} />
        <div className="font-display text-3xl font-black tabular-nums text-voltari-300">{scoreL}</div>
      </div>

      <div className="h-10 w-px bg-white/12" />

      <div className="flex flex-col items-center">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {status === 'playing' ? 'Live Rally' : status === 'countdown' ? 'Serving' : status === 'pointPending' ? 'Point Resolving' : 'Paused'}
        </div>
        <div className="font-mono text-xs text-slate-200 mt-0.5 tabular-nums">
          RALLY <span className="text-brand-accent">{String(rallyHits).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="h-10 w-px bg-white/12" />

      <div className="flex items-center gap-2">
        <div className="font-display text-3xl font-black tabular-nums text-emberlynx-300">{scoreR}</div>
        <FactionMark faction={rightFaction} size={34} />
      </div>
    </motion.div>
    </div>
  );
}
