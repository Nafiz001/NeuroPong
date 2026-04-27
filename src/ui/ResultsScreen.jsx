// End-of-match results — winner flourish, faction comparison, head-to-head
// delta sourced from the persistent stats store.

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import FactionMark from '../branding/logos/FactionMark.jsx';
import { factionForSide } from '../branding/palette.js';
import { useStats } from '../persistence/statsStore.js';

export default function ResultsScreen({
  leftAgentId,
  rightAgentId,
  leftAgentName,
  rightAgentName,
  winner,
  scoreL,
  scoreR,
  metricsL,
  metricsR,
  winScore,
  onPlayAgain,
  onMainMenu
}) {
  const leftFaction  = factionForSide('left');
  const rightFaction = factionForSide('right');
  const winnerFaction = winner === 'left' ? leftFaction : rightFaction;
  const winnerAgent   = winner === 'left' ? leftAgentName : rightAgentName;

  const recordMatch = useStats(s => s.recordMatch);

  const record = useMemo(() => ({
    leftAgent: leftAgentId,
    rightAgent: rightAgentId,
    leftFaction: leftFaction.id,
    rightFaction: rightFaction.id,
    winner,
    scoreL,
    scoreR,
    metricsL: plainMetrics(metricsL),
    metricsR: plainMetrics(metricsR),
    durationSec: estimateDuration(metricsL, metricsR),
    rallyAvg: average([...(metricsL.rallyLengths ?? []), ...(metricsR.rallyLengths ?? [])])
  }), [leftAgentId, rightAgentId, winner, scoreL, scoreR, metricsL, metricsR]);

  useEffect(() => { recordMatch(record); }, []);

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 menu-backdrop" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-4xl arena-glass rounded-2xl p-7 md:p-9"
      >
        <div className="flex items-center gap-4">
          <FactionMark faction={winnerFaction} size={86} />
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-brand-accent font-semibold">Match Complete</div>
            <h2 className="mt-1 font-display text-4xl md:text-5xl font-black text-white">{winnerFaction.name}</h2>
            <div className="mt-1 text-sm italic text-slate-300">{winnerFaction.tagline}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Final</div>
            <div className="font-display text-3xl font-black tabular-nums mt-1">
              <span className="text-voltari-300">{scoreL}</span>
              <span className="mx-2 text-slate-500">:</span>
              <span className="text-emberlynx-300">{scoreR}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mt-1">
              first to {winScore} · won by {winnerAgent}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <ResultCard faction={leftFaction}  agentName={leftAgentName}  metrics={metricsL} score={scoreL} />
          <ResultCard faction={rightFaction} agentName={rightAgentName} metrics={metricsR} score={scoreR} />
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={onPlayAgain}
            className="px-5 py-3 rounded-xl text-sm font-black tracking-wide uppercase text-bg-0 bg-brand-accent hover:bg-amber-200 transition"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="px-5 py-3 rounded-xl text-sm font-semibold tracking-wide text-slate-100 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Main Menu
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function ResultCard({ faction, agentName, metrics, score }) {
  const efficiency = metrics.hits + metrics.misses > 0
    ? `${Math.round((metrics.hits / (metrics.hits + metrics.misses)) * 100)}%`
    : '0%';
  const avgRally = metrics.rallyLengths?.length > 0
    ? (metrics.rallyLengths.reduce((a, b) => a + b, 0) / metrics.rallyLengths.length).toFixed(1)
    : '0.0';
  const avgDecision = metrics.decisionCount > 0
    ? `${(metrics.decisionTimeMs / metrics.decisionCount).toFixed(2)}ms`
    : '0ms';

  return (
    <div className="rounded-xl border border-white/8 bg-bg-1/60 p-4">
      <div className="flex items-center gap-3">
        <FactionMark faction={faction} size={40} />
        <div className="flex-1">
          <div className="font-display text-lg font-bold text-white tracking-wider">{faction.name}</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{agentName}</div>
        </div>
        <div className="font-display text-2xl font-black tabular-nums">{score}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono text-slate-200">
        <div className="text-slate-400">Hits</div>        <div className="text-right tabular-nums">{metrics.hits}</div>
        <div className="text-slate-400">Misses</div>      <div className="text-right tabular-nums">{metrics.misses}</div>
        <div className="text-slate-400">Efficiency</div>  <div className="text-right tabular-nums">{efficiency}</div>
        <div className="text-slate-400">Avg rally</div>   <div className="text-right tabular-nums">{avgRally}</div>
        <div className="text-slate-400">Energy used</div> <div className="text-right tabular-nums">{Math.round(metrics.energyUsed)}</div>
        <div className="text-slate-400">Decision avg</div><div className="text-right tabular-nums">{avgDecision}</div>
      </div>
    </div>
  );
}

function plainMetrics(m) {
  return {
    hits: m.hits,
    misses: m.misses,
    energyUsed: m.energyUsed,
    rallyLengths: m.rallyLengths?.slice() ?? [],
    decisionCount: m.decisionCount,
    decisionTimeMs: m.decisionTimeMs,
    powerupUses: { ...m.powerupUses }
  };
}

function estimateDuration(l, r) {
  const total = (l.rallyLengths?.length ?? 0) + (r.rallyLengths?.length ?? 0);
  return total * 6; // rough — each point ~6 seconds
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
