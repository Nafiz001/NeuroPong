// Audio engine: procedural Web Audio synthesizer with emulated buses.
//
// Sound design:
//   The core SFX (paddle hit, table bounce, net tick) are short transient
//   sounds that approximate real ping-pong: a tight bandpass-filtered noise
//   burst plus a brief low body resonance. No sustained sweeps, no synth
//   pads — the previous design read as a "howl" because it leaned on long
//   sawtooth sweeps and bandpass noise swells. Those are now either silent
//   or replaced with very short percussive blips.
//
// Mute:
//   toggleMute also suspend/resume the AudioContext, so any in-flight sound
//   stops immediately and nothing reaches the speakers while muted.
//
// Public API is unchanged: load / play / playMusic / stopMusic / duckMusic /
// unduckMusic / playCommentary / setBusGain / toggleMute / unlock.

const BUS = ['sfx', 'music', 'commentary', 'ui', 'ambient'];

const state = {
  ready: false,
  ctx: null,
  master: null,
  buses: {},                                 // bus name -> GainNode
  busGain: {
    sfx: 1.0, music: 0.55, commentary: 1.0, ui: 0.8, ambient: 0.5
  },
  muted: false
};

const listeners = new Set();
function emit() { for (const fn of listeners) fn(snapshot()); }
function snapshot() {
  return { ready: state.ready, muted: state.muted, busGain: { ...state.busGain } };
}

function ensureCtx() {
  if (state.ctx) return state.ctx;
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  state.ctx = ctx;
  state.master = ctx.createGain();
  state.master.gain.value = state.muted ? 0 : 1;
  state.master.connect(ctx.destination);
  for (const bus of BUS) {
    const g = ctx.createGain();
    g.gain.value = state.busGain[bus] ?? 1;
    g.connect(state.master);
    state.buses[bus] = g;
  }
  return ctx;
}

function makeNoiseBuffer(ctx, durationSec) {
  const sr = ctx.sampleRate;
  const len = Math.max(1, Math.ceil(sr * durationSec));
  const buf = ctx.createBuffer(1, len, sr);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  return buf;
}

function noiseSource(ctx, durationSec) {
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, durationSec);
  return src;
}

function autoDisconnect(node, afterSec) {
  setTimeout(() => { try { node.disconnect(); } catch { /* ignore */ } },
    Math.ceil(afterSec * 1000) + 60);
}

// ---------------------------------------------------------------------------
// Synth voices
// ---------------------------------------------------------------------------
// Each "voice" is shaped to sound like a real ping-pong impact:
//   1. Tight bandpass-filtered noise burst (the sharp click of celluloid)
//   2. A brief low sine "body" component (the resonance of the paddle/table)
//   3. Very fast attack (1-3 ms), exponential decay (~30-50 ms total)
//
// Anything that previously rang or swept (powerup sweeps, crowd swells, the
// match-point siren) is intentionally short and percussive now, so the user
// doesn't hear any sustained "howl" tones.

function synth(key, opts) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const busName = opts.bus ?? 'sfx';
  const bus = state.buses[busName] ?? state.buses.sfx;
  const rate = Math.max(0.5, Math.min(2.0, opts.rate ?? 1.0));
  const volume = Math.max(0, opts.volume ?? 1.0);
  const t0 = ctx.currentTime;

  switch (key) {
    case 'paddle_hit_1':
    case 'paddle_hit_2':
    case 'paddle_hit_3':
      pingPongImpact(ctx, bus, t0, {
        clickFreq: (key === 'paddle_hit_2' ? 3400 : key === 'paddle_hit_3' ? 4400 : 3800) * Math.sqrt(rate),
        clickQ:    9,
        bodyFreq:  (key === 'paddle_hit_3' ? 130 : 100) * rate,
        duration:  key === 'paddle_hit_3' ? 0.045 : 0.032,
        volume:    volume * (key === 'paddle_hit_3' ? 1.0 : 0.85),
        clickMix:  0.85,
        bodyMix:   0.40
      });
      break;

    case 'table_bounce_1':
    case 'table_bounce_2':
    case 'table_bounce_3':
      pingPongImpact(ctx, bus, t0, {
        clickFreq: (key === 'table_bounce_2' ? 1500 : key === 'table_bounce_3' ? 1300 : 1700) * Math.sqrt(rate),
        clickQ:    6,
        bodyFreq:  (key === 'table_bounce_2' ? 260 : key === 'table_bounce_3' ? 220 : 300) * rate,
        bodyDecay: 0.06,
        duration:  0.055,
        volume:    volume * 0.8,
        clickMix:  0.55,
        bodyMix:   0.55
      });
      break;

    case 'net_tick': {
      const dur = 0.035;
      const env = ctx.createGain();
      env.gain.value = 0;
      env.connect(bus);
      const noise = noiseSource(ctx, dur);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4200 * rate;
      bp.Q.value = 12;
      noise.connect(bp).connect(env);
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(volume * 0.55, t0 + 0.001);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      noise.start(t0);
      autoDisconnect(env, dur);
      break;
    }

    case 'score_jingle': {
      // Two short percussive blips — pleasant but no sustained tone.
      shortBlip(ctx, bus, t0,         { freq: 880, dur: 0.09, volume: volume * 0.35 });
      shortBlip(ctx, bus, t0 + 0.08, { freq: 1320, dur: 0.11, volume: volume * 0.35 });
      break;
    }

    case 'win_flourish': {
      // Three short ascending blips. Total ~0.28s, no sustained notes.
      shortBlip(ctx, bus, t0,         { freq: 880,  dur: 0.09, volume: volume * 0.3 });
      shortBlip(ctx, bus, t0 + 0.09, { freq: 1175, dur: 0.09, volume: volume * 0.3 });
      shortBlip(ctx, bus, t0 + 0.18, { freq: 1568, dur: 0.12, volume: volume * 0.32 });
      break;
    }

    case 'powerup_boost':
    case 'powerup_shield':
    case 'powerup_slow': {
      // Short percussive "blip" instead of the previous long sweep — a brief
      // 60 ms pluck so the activation registers without sounding howl-like.
      const freq = key === 'powerup_boost'  ? 1200
                 : key === 'powerup_shield' ?  900
                 :                              700;
      shortBlip(ctx, bus, t0, { freq, dur: 0.06, volume: volume * 0.4 });
      break;
    }

    case 'shield_zap': {
      // Short noise zap — keeps a slight "electric" character but stays
      // percussive, no sweep tail.
      const dur = 0.08;
      const env = ctx.createGain();
      env.gain.value = 0;
      env.connect(bus);
      const noise = noiseSource(ctx, dur);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 4;
      noise.connect(bp).connect(env);
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(volume * 0.5, t0 + 0.002);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      noise.start(t0);
      autoDisconnect(env, dur);
      break;
    }

    case 'ui_hover':
    case 'ui_click':
      shortBlip(ctx, bus, t0, {
        freq:   key === 'ui_click' ? 720 : 1280,
        dur:    key === 'ui_click' ? 0.06 : 0.035,
        volume: volume * (key === 'ui_click' ? 0.28 : 0.22)
      });
      break;

    // Howl-like sounds intentionally silenced. The crowd swells were 1+ second
    // bandpass-noise drones (the "howl" the user heard); the match-point
    // stinger was a 1.3s siren-style sawtooth ramp. Both removed entirely.
    case 'crowd_cheer_1':
    case 'crowd_cheer_2':
    case 'crowd_ooh':
    case 'match_point_stinger':
      break;

    default:
      break;
  }
}

// Real ping-pong impact: bandpassed noise click + brief body resonance,
// both wrapped in a fast attack / exponential decay envelope.
function pingPongImpact(ctx, bus, t0, p) {
  const env = ctx.createGain();
  env.gain.value = 0;
  env.connect(bus);

  // Click (noise burst through tight bandpass).
  const click = noiseSource(ctx, p.duration);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = p.clickFreq;
  bp.Q.value = p.clickQ;
  const clickGain = ctx.createGain();
  clickGain.gain.value = p.clickMix;
  click.connect(bp).connect(clickGain).connect(env);

  // Body (short sine thud).
  const body = ctx.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(p.bodyFreq, t0);
  body.frequency.exponentialRampToValueAtTime(p.bodyFreq * 0.55, t0 + (p.bodyDecay ?? p.duration));
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0, t0);
  bodyGain.gain.linearRampToValueAtTime(p.bodyMix, t0 + 0.002);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (p.bodyDecay ?? p.duration));
  body.connect(bodyGain).connect(env);

  // Master envelope.
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(p.volume, t0 + 0.0015);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + p.duration);

  click.start(t0);
  body.start(t0);
  body.stop(t0 + p.duration + 0.02);
  autoDisconnect(env, p.duration);
}

// Short sine pluck. Used for UI ticks, score blips, powerup confirmation.
function shortBlip(ctx, bus, t0, { freq, dur, volume }) {
  const env = ctx.createGain();
  env.gain.value = 0;
  env.connect(bus);
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  o.connect(env);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(volume, t0 + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
  autoDisconnect(env, dur);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const AudioEngine = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  get ready() { return state.ready; },
  get muted() { return state.muted; },

  async load(_opts) {
    const ctx = ensureCtx();
    if (!ctx) {
      state.ready = false;
      emit();
      return false;
    }
    state.ready = true;
    emit();
    return true;
  },

  play(spriteKey, opts = {}) {
    if (state.muted) return null;
    if (!state.ctx) ensureCtx();
    if (!state.ctx) return null;
    try {
      synth(spriteKey, opts);
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('AudioEngine.play failed', spriteKey, err);
    }
    return null;
  },

  // Music intentionally disabled — no procedural pad. Kept as no-ops so all
  // existing callers (hooks, commentary director ducking) stay happy.
  async playMusic(_key, _opts) { /* no-op */ },
  stopMusic(_fadeMs) { /* no-op */ },
  duckMusic(_fadeMs) { /* no-op */ },
  unduckMusic(_fadeMs) { /* no-op */ },

  // No commentary audio assets ship; CommentaryDirector currently never calls
  // this path (variant.audio is null in lines.json). Kept as a graceful no-op
  // so any future audio-bearing line still triggers onEnd cleanly.
  playCommentary(_src, { onEnd } = {}) {
    if (state.muted) { onEnd?.(); return () => {}; }
    const fallbackMs = 1500;
    const handle = setTimeout(() => onEnd?.(), fallbackMs);
    return () => clearTimeout(handle);
  },

  setBusGain(bus, value) {
    if (!BUS.includes(bus)) return;
    state.busGain[bus] = value;
    if (state.buses[bus]) {
      try { state.buses[bus].gain.value = value; } catch { /* ignore */ }
    }
    emit();
  },

  // Toggle mute. Belt-and-braces: master gain → 0 AND suspend the audio
  // context so any in-flight sound stops immediately. This is what makes the
  // mute button actually silence everything (previously, sounds in flight
  // when the user clicked mute kept playing through the still-running ctx).
  toggleMute() {
    state.muted = !state.muted;
    if (state.master) {
      try { state.master.gain.value = state.muted ? 0 : 1; } catch { /* ignore */ }
    }
    if (state.ctx) {
      try {
        if (state.muted) state.ctx.suspend();
        else             state.ctx.resume();
      } catch { /* ignore */ }
    }
    emit();
  },

  // Resume on first user gesture (autoplay policy). No-op while muted so the
  // mute state survives an "unlock" gesture.
  unlock() {
    const ctx = ensureCtx();
    if (!ctx || state.muted) return;
    try {
      if (ctx.state !== 'running') ctx.resume();
    } catch { /* ignore */ }
  }
};
