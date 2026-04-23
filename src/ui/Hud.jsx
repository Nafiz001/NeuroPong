// Compact HUD overlay: scores, energy bars, power-up cooldowns, and metrics.
// Subscribes to the lightweight zustand store fed by publishHud().

import { ENERGY, POWERUP } from '../game/constants.js';
import { useHud } from '../game/store.js';

export default function Hud({ leftName, rightName }) {
  const s = useHud();
  return (
    <div className="pointer-events-none absolute inset-0 p-4 flex flex-col gap-2 text-slate-100">
      <div className="flex justify-between items-start gap-4">
        <SidePanel side="left" name={leftName} score={s.scoreL} energy={s.energyL}
                   cooldowns={s.cooldownsL} active={s.activeL} metrics={s.metricsL} />
        <div className="flex flex-col items-center mt-2">
          <div className="text-xs uppercase tracking-widest text-cyan-300">NeuroPong Arena</div>
          <div className="text-3xl font-bold tabular-nums">
            <span className="text-purple-400">{s.scoreL}</span>
            <span className="mx-2 text-slate-500">:</span>
            <span className="text-orange-400">{s.scoreR}</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            {s.status} · rally {s.rallyHits}
          </div>
        </div>
        <SidePanel side="right" name={rightName} score={s.scoreR} energy={s.energyR}
                   cooldowns={s.cooldownsR} active={s.activeR} metrics={s.metricsR} />
      </div>
    </div>
  );
}

function SidePanel({ side, name, energy, cooldowns, active, metrics }) {
  const align = side === 'left' ? 'items-start' : 'items-end';
  const accent = side === 'left' ? 'text-purple-300' : 'text-orange-300';
  const bar    = side === 'left' ? 'bg-purple-500'   : 'bg-orange-500';

  const avgRally = metrics.rallyLengths.length
    ? (metrics.rallyLengths.reduce((a, b) => a + b, 0) / metrics.rallyLengths.length).toFixed(1)
    : '0.0';
  const efficiency = metrics.hits + metrics.misses > 0
    ? ((metrics.hits / (metrics.hits + metrics.misses)) * 100).toFixed(0) + '%'
    : '—';
  const avgDecisionMs = metrics.decisionCount > 0
    ? (metrics.decisionTimeMs / metrics.decisionCount).toFixed(2) + 'ms'
    : '—';

  return (
    <div className={`flex flex-col gap-1 ${align} bg-slate-900/60 backdrop-blur px-3 py-2 rounded-lg w-56`}>
      <div className={`text-xs font-bold tracking-wide ${accent}`}>{name}</div>
      <div className="w-full h-2 bg-slate-700 rounded overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${(energy / ENERGY.max) * 100}%` }} />
      </div>
      <div className="text-[10px] text-slate-300 tabular-nums">
        ENERGY {Math.round(energy)} / {ENERGY.max}
      </div>
      <div className="flex gap-1 mt-1">
        {[POWERUP.BOOST, POWERUP.SHIELD, POWERUP.SLOW].map(k => (
          <PowerupChip key={k} kind={k} cooldown={cooldowns[k]} active={active[k]} />
        ))}
      </div>
      <div className="mt-2 text-[10px] text-slate-400 grid grid-cols-2 gap-x-2 w-full">
        <div>Hits</div><div className="text-right tabular-nums">{metrics.hits}</div>
        <div>Misses</div><div className="text-right tabular-nums">{metrics.misses}</div>
        <div>Avg rally</div><div className="text-right tabular-nums">{avgRally}</div>
        <div>Efficiency</div><div className="text-right tabular-nums">{efficiency}</div>
        <div>Energy used</div><div className="text-right tabular-nums">{Math.round(metrics.energyUsed)}</div>
        <div>Decide t̄</div><div className="text-right tabular-nums">{avgDecisionMs}</div>
      </div>
    </div>
  );
}

const POWERUP_STYLE = {
  [POWERUP.BOOST]:  { label: 'BOOST',  icon: '⚡', active: 'bg-emerald-500 text-slate-900 shadow-emerald-500/70', ready: 'bg-emerald-900/50 text-emerald-300 border-emerald-400/50' },
  [POWERUP.SHIELD]: { label: 'SHIELD', icon: '🛡', active: 'bg-cyan-400 text-slate-900 shadow-cyan-400/70',       ready: 'bg-cyan-900/50 text-cyan-300 border-cyan-400/50' },
  [POWERUP.SLOW]:   { label: 'SLOW',   icon: '⏳', active: 'bg-amber-400 text-slate-900 shadow-amber-400/70',     ready: 'bg-amber-900/50 text-amber-300 border-amber-400/50' }
};

function PowerupChip({ kind, cooldown, active }) {
  const st = POWERUP_STYLE[kind];
  const isActive = active > 0;
  const ready = cooldown <= 0;
  const base = 'text-[11px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 transition-all';
  const cls = isActive
    ? `${base} ${st.active} border-transparent shadow-md animate-pulse scale-110`
    : ready
    ? `${base} ${st.ready}`
    : `${base} bg-slate-800/60 text-slate-500 border-slate-700`;
  return (
    <div className={cls}>
      <span>{st.icon}</span>
      <span>{st.label}</span>
      {isActive ? <span className="ml-1 tabular-nums">{active.toFixed(1)}s</span> : null}
      {!isActive && !ready ? <span className="ml-1 tabular-nums opacity-70">{cooldown.toFixed(1)}s</span> : null}
    </div>
  );
}
