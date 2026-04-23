export default function ResultsScreen({
  leftName,
  rightName,
  winner,
  scoreL,
  scoreR,
  metricsL,
  metricsR,
  winScore,
  onPlayAgain,
  onMainMenu
}) {
  const winnerName = winner === 'left' ? leftName : rightName;

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 menu-backdrop" />

      <section className="relative w-full max-w-4xl rounded-2xl border border-emerald-200/30 bg-slate-950/75 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-emerald-500/10 menu-shell">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-200 font-semibold">Match Complete</div>
        <h2 className="mt-2 text-3xl md:text-4xl font-black text-slate-50">{winnerName} Wins</h2>
        <p className="mt-3 text-sm text-slate-200">
          Target score {winScore} reached. Final board: <span className="font-bold text-purple-300">{scoreL}</span>
          <span className="mx-2 text-slate-500">:</span>
          <span className="font-bold text-orange-300">{scoreR}</span>
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <ResultCard title={leftName} accent="purple" metrics={metricsL} score={scoreL} />
          <ResultCard title={rightName} accent="orange" metrics={metricsR} score={scoreR} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onPlayAgain}
            className="px-5 py-3 rounded-xl text-sm font-bold tracking-wide text-slate-900 bg-emerald-300 hover:bg-emerald-200 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-50 bg-slate-800/85 hover:bg-slate-700/95 border border-slate-500/60 transition-colors"
          >
            Main Menu
          </button>
        </div>
      </section>
    </div>
  );
}

function ResultCard({ title, accent, metrics, score }) {
  const accentBorder = accent === 'purple' ? 'border-purple-300/30 bg-purple-950/25' : 'border-orange-300/30 bg-orange-950/20';
  const efficiency = metrics.hits + metrics.misses > 0
    ? `${Math.round((metrics.hits / (metrics.hits + metrics.misses)) * 100)}%`
    : '0%';
  const avgRally = metrics.rallyLengths.length > 0
    ? (metrics.rallyLengths.reduce((sum, value) => sum + value, 0) / metrics.rallyLengths.length).toFixed(1)
    : '0.0';
  const avgDecision = metrics.decisionCount > 0
    ? `${(metrics.decisionTimeMs / metrics.decisionCount).toFixed(2)}ms`
    : '0ms';

  return (
    <div className={`rounded-xl border p-4 ${accentBorder}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-50">{title}</div>
        <div className="text-xs text-slate-300">Score {score}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-200">
        <div>Hits</div><div className="text-right tabular-nums">{metrics.hits}</div>
        <div>Misses</div><div className="text-right tabular-nums">{metrics.misses}</div>
        <div>Efficiency</div><div className="text-right tabular-nums">{efficiency}</div>
        <div>Avg rally</div><div className="text-right tabular-nums">{avgRally}</div>
        <div>Energy used</div><div className="text-right tabular-nums">{Math.round(metrics.energyUsed)}</div>
        <div>Decision avg</div><div className="text-right tabular-nums">{avgDecision}</div>
      </div>
    </div>
  );
}
