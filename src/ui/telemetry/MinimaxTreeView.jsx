// Minimax one-ply summary: three root-action bars showing the minimax value
// for each candidate action (UP / STAY / DOWN). A full tree visualization
// would be overkill — this is the clearest signal about what the agent
// judged best and by how much.

export default function MinimaxTreeView({ debug }) {
  if (!debug || debug.kind !== 'minimax') return null;
  const children = debug.rootChildren ?? [];
  if (!children.length) return null;

  const values = children.map(c => c.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1e-6, max - min);
  const label = (a) => (a === 1 ? 'UP' : a === -1 ? 'DOWN' : 'STAY');

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
        Minimax · depth {debug.depth} · {debug.elapsedMs?.toFixed(2)}ms
      </div>
      <div className="space-y-1">
        {children.map((c, i) => {
          const norm = (c.value - min) / range;
          const best = c.action === debug.bestAction;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-12 text-[10px] font-mono uppercase ${best ? 'text-brand-accent' : 'text-slate-400'}`}>
                {label(c.action)}
              </div>
              <div className="flex-1 h-3 bg-bg-1 rounded overflow-hidden">
                <div
                  className={`h-full ${best ? 'bg-brand-accent' : 'bg-slate-500'}`}
                  style={{ width: `${Math.max(4, norm * 100)}%` }}
                />
              </div>
              <div className="w-16 text-[10px] font-mono tabular-nums text-right text-slate-300">
                {c.value.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2">
        <div>Root value</div><div className="text-right tabular-nums text-slate-200">{debug.rootValue?.toFixed(1)}</div>
        <div>Urgency</div><div className="text-right tabular-nums text-slate-200">{debug.urgency?.toFixed(2)}</div>
        <div>Predicted Z</div><div className="text-right tabular-nums text-slate-200">{debug.predictedZ?.toFixed(2)}</div>
        <div>Predicted Y</div><div className="text-right tabular-nums text-slate-200">{debug.predictedY?.toFixed(2)}</div>
      </div>
    </div>
  );
}
