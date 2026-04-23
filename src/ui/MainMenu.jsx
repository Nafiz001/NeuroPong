import { useState } from 'react';

const CAMERA_CHOICES = [
  { value: 'classic', label: 'Classic' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'topdown', label: 'Top Down' }
];

const SPEED_CHOICES = [
  { value: 0.8, label: '0.8x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.2, label: '1.2x' }
];

const UI_SCALE_CHOICES = [
  { value: 0.9, label: '90%' },
  { value: 1.0, label: '100%' },
  { value: 1.1, label: '110%' }
];

export default function MainMenu({
  leftName,
  rightName,
  swapped,
  onSwap,
  onPlay,
  onResume,
  canResume,
  settings,
  onSettingsChange,
  winScore
}) {
  const [view, setView] = useState('main');

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 menu-backdrop" />

      <div className="relative w-full max-w-5xl grid gap-4 lg:grid-cols-[1.35fr_0.9fr] menu-shell">
        <section className="rounded-2xl border border-cyan-200/30 bg-slate-950/70 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-cyan-500/10">
          <div className="text-cyan-200 text-xs tracking-[0.26em] uppercase font-semibold">
            NeuroPong Arena
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-black leading-tight text-slate-50">
            Neural Match Lobby
          </h1>
          <p className="mt-4 text-slate-200 max-w-2xl text-sm md:text-base leading-relaxed">
            Two AI brains enter the arena: Minimax vs Fuzzy Logic. Launch a fresh match,
            review the rules, and choose who starts from each side.
          </p>

          {view === 'main' && (
            <div className="mt-8 grid gap-3 sm:max-w-sm menu-section-in">
              {canResume && (
                <button
                  onClick={onResume}
                  className="px-5 py-3 rounded-xl text-sm font-bold tracking-wide text-slate-900 bg-emerald-300 hover:bg-emerald-200 transition-colors"
                >
                  Resume Match
                </button>
              )}
              <button
                onClick={onPlay}
                className="px-5 py-3 rounded-xl text-sm font-bold tracking-wide text-slate-900 bg-cyan-300 hover:bg-cyan-200 transition-colors"
              >
                {canResume ? 'Start New Match' : 'Play Game'}
              </button>
              <button
                onClick={() => setView('rules')}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-50 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-500/60 transition-colors"
              >
                Rules
              </button>
              <button
                onClick={() => setView('settings')}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-50 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-500/60 transition-colors"
              >
                Settings
              </button>
              <button
                onClick={onSwap}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-50 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-500/60 transition-colors"
              >
                Swap AI Sides
              </button>
            </div>
          )}

          {view === 'rules' && (
            <div className="mt-8 rounded-xl border border-slate-500/50 bg-slate-900/65 p-4 md:p-5 menu-section-in">
              <h2 className="text-lg font-bold text-slate-50">Rules</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-200 leading-relaxed">
                <li>1. First to {winScore} points wins the match pace race.</li>
                <li>2. Ball speed increases after each paddle hit.</li>
                <li>3. Each side regenerates energy over time and can spend it on powerups.</li>
                <li>4. Boost increases paddle speed, Shield blocks one scoring miss, Slow reduces ball displacement.</li>
                <li>5. Both agents act with the same observation schema for fair comparison.</li>
              </ul>
              <button
                onClick={() => setView('main')}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-cyan-300 hover:bg-cyan-200 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          )}

          {view === 'settings' && (
            <div className="mt-8 rounded-xl border border-slate-500/50 bg-slate-900/65 p-4 md:p-5 menu-section-in">
              <h2 className="text-lg font-bold text-slate-50">Settings</h2>

              <SettingRow label="Camera Angle">
                {CAMERA_CHOICES.map(choice => (
                  <ChoiceButton
                    key={choice.value}
                    active={settings.camera === choice.value}
                    onClick={() => onSettingsChange({ camera: choice.value })}
                    label={choice.label}
                  />
                ))}
              </SettingRow>

              <SettingRow label="Game Speed">
                {SPEED_CHOICES.map(choice => (
                  <ChoiceButton
                    key={choice.value}
                    active={settings.gameSpeed === choice.value}
                    onClick={() => onSettingsChange({ gameSpeed: choice.value })}
                    label={choice.label}
                  />
                ))}
              </SettingRow>

              <SettingRow label="UI Scale">
                {UI_SCALE_CHOICES.map(choice => (
                  <ChoiceButton
                    key={choice.value}
                    active={settings.uiScale === choice.value}
                    onClick={() => onSettingsChange({ uiScale: choice.value })}
                    label={choice.label}
                  />
                ))}
              </SettingRow>

              <button
                onClick={() => setView('main')}
                className="mt-5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-cyan-300 hover:bg-cyan-200 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-amber-200/25 bg-slate-900/75 backdrop-blur-xl p-6 md:p-7 shadow-xl shadow-amber-500/10 menu-side-in">
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-200">Match Setup</h3>

          <div className="mt-4 space-y-3 text-sm text-slate-100">
            <div className="rounded-xl border border-purple-300/25 bg-purple-950/35 p-3">
              <div className="text-[11px] uppercase tracking-wider text-purple-200/90">Left Side</div>
              <div className="mt-1 font-semibold">{leftName}</div>
            </div>
            <div className="rounded-xl border border-orange-300/25 bg-orange-950/30 p-3">
              <div className="text-[11px] uppercase tracking-wider text-orange-200/90">Right Side</div>
              <div className="mt-1 font-semibold">{rightName}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-500/40 bg-slate-950/50 p-3 text-xs text-slate-200 leading-relaxed">
            Current orientation: {swapped ? 'swapped' : 'default'}. You can swap before starting or during a match.
          </div>

          <div className="mt-5">
            <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200 font-semibold">In-Game Controls</h4>
            <div className="mt-2 grid gap-2 text-xs text-slate-200">
              <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-600/50">Pause / Resume</div>
              <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-600/50">Reset Match</div>
              <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-600/50">Swap AIs</div>
              <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-600/50">Main Menu</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="mt-4">
      <div className="text-xs uppercase tracking-[0.16em] text-cyan-200 font-semibold">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function ChoiceButton({ active, onClick, label }) {
  const cls = active
    ? 'bg-cyan-300 text-slate-900 border-cyan-200'
    : 'bg-slate-800/80 text-slate-100 border-slate-500/60 hover:bg-slate-700/90';
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}
