// Power-up tray — replaces the old chip row. Each power-up gets a larger
// button-style tile with a sweeping cooldown arc and an active glow.

import { POWERUP } from '../../game/constants.js';

const ITEMS = [
  { kind: POWERUP.BOOST,  label: 'BOOST',  icon: '⚡', hue: '#34D399' },
  { kind: POWERUP.SHIELD, label: 'SHIELD', icon: '🛡', hue: '#22D3EE' },
  { kind: POWERUP.SLOW,   label: 'SLOW',   icon: '⏳', hue: '#FBBF24' }
];

const COOLDOWN_MAX = { boost: 4, shield: 6, slow: 5 };

export default function PowerupTray({ side, cooldowns, active }) {
  const dir = side === 'left' ? 'left-4' : 'right-4';
  const rowClass = side === 'left' ? 'flex-row' : 'flex-row-reverse';

  return (
    <div className={`pointer-events-none absolute bottom-24 ${dir} flex ${rowClass} gap-2`}>
      {ITEMS.map(item => {
        const isActive = active[item.kind] > 0;
        const cd = cooldowns[item.kind] ?? 0;
        const ready = cd <= 0 && !isActive;
        const cdPct = Math.min(1, cd / COOLDOWN_MAX[item.kind]);

        return (
          <div
            key={item.kind}
            className={`broadcast-slab w-20 h-20 rounded-xl flex flex-col items-center justify-center relative overflow-hidden
              ${isActive ? 'ring-2 ring-offset-0' : ''}`}
            style={{
              boxShadow: isActive ? `0 0 18px ${item.hue}` : undefined,
              borderColor: isActive ? item.hue : undefined
            }}
          >
            <div className="text-xl leading-none" style={{ color: ready || isActive ? item.hue : 'rgba(148, 163, 184, 0.55)' }}>
              {item.icon}
            </div>
            <div className="text-[10px] font-semibold tracking-wider mt-1"
                 style={{ color: ready || isActive ? '#F8FAFC' : '#64748B' }}>
              {item.label}
            </div>
            {isActive && (
              <div className="text-[9px] font-mono tabular-nums mt-0.5" style={{ color: item.hue }}>
                {active[item.kind].toFixed(1)}s
              </div>
            )}
            {!ready && !isActive && (
              <>
                <div className="text-[9px] font-mono tabular-nums mt-0.5 text-slate-400">
                  {cd.toFixed(1)}s
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-slate-500/80"
                  style={{ width: `${(1 - cdPct) * 100}%` }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
