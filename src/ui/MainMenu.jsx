// Broadcast-grade main menu. Wordmark, match setup, faction cards, stats
// widget, settings and controls overview.

import { useState } from 'react';
import { motion } from 'framer-motion';
import NeuroPongWordmark from '../branding/logos/NeuroPongWordmark.jsx';
import FactionMark from '../branding/logos/FactionMark.jsx';
import { VOLTARI, EMBERLYNX } from '../branding/palette.js';
import StatsCard from './menu/StatsCard.jsx';
import AudioToggle from './AudioToggle.jsx';

const CAMERA_CHOICES = [
  { value: 'classic',   label: 'Classic' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'topdown',   label: 'Top Down' }
];

const SPEED_CHOICES = [
  { value: 0.8, label: '0.8×' },
  { value: 1.0, label: '1.0×' },
  { value: 1.2, label: '1.2×' }
];

const UI_SCALE_CHOICES = [
  { value: 0.9, label: '90%' },
  { value: 1.0, label: '100%' },
  { value: 1.1, label: '110%' }
];

export default function MainMenu({
  leftAgentId,
  rightAgentId,
  leftAgentName,
  rightAgentName,
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

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-6xl grid gap-4 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="absolute top-3 right-3 z-10">
          <AudioToggle />
        </div>
        {/* Main column */}
        <section className="arena-glass rounded-2xl p-7 md:p-9 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%)' }} />

          <NeuroPongWordmark className="max-w-sm" />

          <div className="mt-5 text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
            A broadcast-grade AI exhibition. Two faction agents — <span className="text-voltari-300 font-semibold">Voltari</span> and <span className="text-emberlynx-300 font-semibold">Ember Lynx</span> — share the same observation feed and decide at 30&nbsp;Hz. First to {winScore} takes the match.
          </div>

          {view === 'main' && (
            <div className="mt-7 grid gap-3 sm:max-w-sm menu-section-in">
              {canResume && (
                <MenuButton primary onClick={onResume}>Resume Match</MenuButton>
              )}
              <MenuButton primary onClick={onPlay}>
                {canResume ? 'Start New Match' : 'Play Match'}
              </MenuButton>
              <MenuButton onClick={() => setView('rules')}>Rules</MenuButton>
              <MenuButton onClick={() => setView('settings')}>Settings</MenuButton>
              <MenuButton onClick={onSwap}>Swap Agents Between Factions</MenuButton>
            </div>
          )}

          {view === 'rules' && (
            <RulesPanel winScore={winScore} onBack={() => setView('main')} />
          )}

          {view === 'settings' && (
            <SettingsPanel
              settings={settings}
              onChange={onSettingsChange}
              onBack={() => setView('main')}
            />
          )}
        </section>

        {/* Side column */}
        <aside className="grid gap-4 content-start menu-side-in">
          <div className="arena-glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-brand-accent font-semibold">Match Card</div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mt-3 items-center">
              <FactionBlock faction={VOLTARI} agentName={leftAgentName} />
              <div className="font-display text-slate-500 text-xl">vs</div>
              <FactionBlock faction={EMBERLYNX} agentName={rightAgentName} align="right" />
            </div>
            <div className="mt-4 text-[11px] text-slate-400">
              Orientation: <span className="text-slate-200 font-semibold">{swapped ? 'Swapped' : 'Default'}</span>. Swap before or during a match.
            </div>
          </div>

          <StatsCard leftAgentId={leftAgentId} rightAgentId={rightAgentId} />

          <div className="arena-glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-brand-accent font-semibold">In-Game Controls</div>
            <div className="grid gap-2 mt-3 text-xs text-slate-200">
              <ControlRow label="Pause / Resume"     kbd="space" />
              <ControlRow label="Reset Match"        kbd="" />
              <ControlRow label="Swap Agents"        kbd="" />
              <ControlRow label="AI Telemetry"       kbd="Alt+T" />
              <ControlRow label="Mute Audio"         kbd="" />
              <ControlRow label="Main Menu"          kbd="" />
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}

function MenuButton({ children, onClick, primary = false }) {
  const cls = primary
    ? 'bg-brand-accent text-bg-0 hover:bg-amber-200 font-black'
    : 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10 font-semibold';
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl text-sm tracking-wide ${cls} transition`}
    >
      {children}
    </button>
  );
}

function RulesPanel({ winScore, onBack }) {
  return (
    <div className="mt-7 rounded-xl border border-white/10 bg-bg-1/55 p-5 menu-section-in">
      <h2 className="font-display text-xl font-bold text-white">How a Match Plays</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-200 leading-relaxed">
        <li>1. First to <span className="text-brand-accent font-semibold">{winScore} points</span> wins.</li>
        <li>2. Ball speed rises <span className="font-mono text-voltari-300">×1.025</span> after every paddle hit.</li>
        <li>3. Energy regens at <span className="font-mono text-emberlynx-300">5/s</span> and is spent on power-ups.</li>
        <li>4. Boost = paddle speed. Shield = absorbs one miss. Slow = ball displacement × 0.55.</li>
        <li>5. Both agents see the same observation. Decisions land at 30&nbsp;Hz.</li>
      </ul>
      <button
        onClick={onBack}
        className="mt-5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase text-bg-0 bg-brand-accent hover:bg-amber-200 transition"
      >
        Back
      </button>
    </div>
  );
}

function SettingsPanel({ settings, onChange, onBack }) {
  return (
    <div className="mt-7 rounded-xl border border-white/10 bg-bg-1/55 p-5 menu-section-in">
      <h2 className="font-display text-xl font-bold text-white">Settings</h2>

      <SettingRow label="Camera Angle">
        {CAMERA_CHOICES.map(c => (
          <Choice key={c.value} active={settings.camera === c.value} onClick={() => onChange({ camera: c.value })} label={c.label} />
        ))}
      </SettingRow>
      <SettingRow label="Game Speed">
        {SPEED_CHOICES.map(c => (
          <Choice key={c.value} active={settings.gameSpeed === c.value} onClick={() => onChange({ gameSpeed: c.value })} label={c.label} />
        ))}
      </SettingRow>
      <SettingRow label="UI Scale">
        {UI_SCALE_CHOICES.map(c => (
          <Choice key={c.value} active={settings.uiScale === c.value} onClick={() => onChange({ uiScale: c.value })} label={c.label} />
        ))}
      </SettingRow>

      <button
        onClick={onBack}
        className="mt-5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase text-bg-0 bg-brand-accent hover:bg-amber-200 transition"
      >
        Back
      </button>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand-accent font-semibold">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({ active, onClick, label }) {
  const cls = active
    ? 'bg-brand-accent text-bg-0 border-brand-accent'
    : 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/10';
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase border ${cls} transition`}
    >
      {label}
    </button>
  );
}

function FactionBlock({ faction, agentName, align = 'left' }) {
  const textAlign = align === 'right' ? 'text-right' : 'text-left';
  return (
    <div className={`flex ${align === 'right' ? 'flex-row-reverse' : ''} items-center gap-3`}>
      <FactionMark faction={faction} size={54} />
      <div className={textAlign}>
        <div
          className="font-display font-black tracking-wider text-lg"
          style={{ color: faction.c300 }}
        >
          {faction.name}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {agentName}
        </div>
        <div className="text-[10px] italic text-slate-500 mt-0.5">
          {faction.tagline}
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, kbd }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-1/65 px-3 py-2 border border-white/5">
      <span>{label}</span>
      {kbd && <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-0 border border-white/10 text-slate-300">{kbd}</kbd>}
    </div>
  );
}
