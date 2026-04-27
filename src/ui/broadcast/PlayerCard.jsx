// Player card — corner card with faction logo, agent + faction name, energy
// bar, decision time, active power-ups.

import { motion } from 'framer-motion';
import FactionMark from '../../branding/logos/FactionMark.jsx';
import { ENERGY } from '../../game/constants.js';

export default function PlayerCard({
  side,
  faction,
  agentName,
  score,
  energy,
  cooldowns,
  active,
  metrics,
  isServing
}) {
  const align = side === 'left' ? 'items-start text-left' : 'items-end text-right';
  const cornerPos = side === 'left' ? 'left-4 top-4' : 'right-4 top-4';
  const edge = side === 'left' ? 'rounded-r-2xl' : 'rounded-l-2xl';
  const flag = side === 'left'
    ? 'border-l-4 border-l-voltari-500'
    : 'border-r-4 border-r-emberlynx-500';

  const avgDecisionMs = metrics.decisionCount > 0
    ? `${(metrics.decisionTimeMs / metrics.decisionCount).toFixed(2)}ms`
    : '—';

  const energyPct = Math.max(0, Math.min(100, (energy / ENERGY.max) * 100));
  const energyColor = side === 'left' ? 'from-voltari-400 to-voltari-600' : 'from-emberlynx-400 to-emberlynx-600';

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-auto absolute ${cornerPos} ${align} broadcast-slab ${edge} ${flag} px-4 py-3 flex gap-3 min-w-[270px]`}
    >
      {side === 'left' && <FactionMark faction={faction} size={54} />}

      <div className={`flex flex-col ${align} gap-0.5 flex-1`}>
        <div className="flex items-center gap-2 w-full">
          <div className="font-display text-xl font-bold tracking-wider text-white flex-1">
            {faction.name}
          </div>
          {isServing && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-accent bg-brand-accent/15 border border-brand-accent/40 px-1.5 py-0.5 rounded">
              SERVE
            </span>
          )}
        </div>

        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {agentName}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="font-display text-4xl font-black tabular-nums leading-none">
            {score}
          </div>
          <div className="flex flex-col flex-1 gap-0.5">
            <div className="h-1.5 w-full bg-bg-1 rounded overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${energyColor}`}
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 tabular-nums">
              <span>ENERGY {Math.round(energy)}</span>
              <span>{avgDecisionMs}</span>
            </div>
          </div>
        </div>
      </div>

      {side === 'right' && <FactionMark faction={faction} size={54} />}
    </motion.div>
  );
}
