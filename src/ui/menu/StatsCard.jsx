// Head-to-head + recent-matches widget for the main menu aside panel.

import { useStats } from '../../persistence/statsStore.js';

export default function StatsCard({ leftAgentId, rightAgentId }) {
  const headToHeadFor = useStats(s => s.headToHeadFor);
  const recentMatches = useStats(s => s.recentMatches);
  const h2h = headToHeadFor(leftAgentId, rightAgentId);
  const recent = recentMatches(10);

  const leftWins  = h2h?.winsByAgent?.[leftAgentId]  ?? 0;
  const rightWins = h2h?.winsByAgent?.[rightAgentId] ?? 0;

  const lastMeeting = h2h?.lastMeeting ? formatRelative(h2h.lastMeeting) : 'No meetings yet';

  return (
    <div className="arena-glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-accent font-semibold">
        Head to Head
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm font-display">
          <div className="text-voltari-300 font-bold uppercase tracking-wider">{leftAgentId}</div>
          <div className="text-3xl font-black tabular-nums text-white mt-1">{leftWins}</div>
        </div>
        <div className="text-slate-500 text-xs">vs</div>
        <div className="text-sm font-display text-right">
          <div className="text-emberlynx-300 font-bold uppercase tracking-wider">{rightAgentId}</div>
          <div className="text-3xl font-black tabular-nums text-white mt-1">{rightWins}</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
        Last meeting: <span className="text-slate-200">{lastMeeting}</span>
      </div>

      {recent.length > 0 && <RecentSparkline recent={recent} />}
    </div>
  );
}

function RecentSparkline({ recent }) {
  const last10 = recent.slice(0, 10);
  const width = 200;
  const barWidth = width / Math.max(10, last10.length);

  return (
    <div className="mt-3">
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Recent 10</div>
      <svg width={width} height={22} className="mt-1">
        {last10.map((m, i) => {
          const winnerLeft = m.winner === 'left';
          return (
            <rect
              key={m.id ?? i}
              x={i * barWidth}
              y={winnerLeft ? 0 : 11}
              width={barWidth - 2}
              height={11}
              fill={winnerLeft ? '#A855F7' : '#F97316'}
              rx="1"
            />
          );
        })}
      </svg>
    </div>
  );
}

function formatRelative(iso) {
  try {
    const ts = new Date(iso).getTime();
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch {
    return '—';
  }
}
