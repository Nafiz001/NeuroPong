// Event → sound mapping. The render-side audio hook drains game events each
// frame and looks up the matching sound (and computed rate / volume) here.

import { BALL } from '../game/constants.js';

// Sprite keys that would live inside the SFX atlas when/if the asset is shipped.
// Until then, playback is silent (AudioEngine no-ops without a loaded sprite).
export const SFX = {
  paddleHit1: 'paddle_hit_1',
  paddleHit2: 'paddle_hit_2',
  paddleHit3: 'paddle_hit_3',
  netTick:    'net_tick',
  tableBounce1: 'table_bounce_1',
  tableBounce2: 'table_bounce_2',
  tableBounce3: 'table_bounce_3',
  scoreJingle: 'score_jingle',
  matchPointStinger: 'match_point_stinger',
  winFlourish: 'win_flourish',
  powerupBoost: 'powerup_boost',
  powerupShield: 'powerup_shield',
  powerupSlow: 'powerup_slow',
  shieldZap: 'shield_zap',
  uiHover: 'ui_hover',
  uiClick: 'ui_click',
  crowdCheer1: 'crowd_cheer_1',
  crowdCheer2: 'crowd_cheer_2',
  crowdOoh:    'crowd_ooh'
};

const PADDLE_VARIANTS = [SFX.paddleHit1, SFX.paddleHit2, SFX.paddleHit3];
const TABLE_VARIANTS  = [SFX.tableBounce1, SFX.tableBounce2, SFX.tableBounce3];

function pick(arr, seed) {
  const idx = Math.abs(seed | 0) % arr.length;
  return arr[idx];
}

// Returns array of { key, opts } to play, OR empty array to skip.
export function eventToSounds(ev) {
  switch (ev.type) {
    case 'hit': {
      const speed = ev.payload.ballSpeed ?? BALL.startSpeed;
      const norm = Math.max(0, Math.min(1.2, speed / BALL.maxSpeed));
      const rate = ev.payload.smash ? 1.25 : 0.85 + norm * 0.5;
      const key = ev.payload.smash ? SFX.paddleHit3 : pick(PADDLE_VARIANTS, ev.id);
      return [{ key, opts: { bus: 'sfx', rate, volume: 1.0 } }];
    }
    case 'bounce': {
      const rate = 0.9 + ((ev.id * 0.173) % 0.2);
      const key = pick(TABLE_VARIANTS, ev.id);
      return [{ key, opts: { bus: 'sfx', rate, volume: 0.7 } }];
    }
    case 'net':
      return [{ key: SFX.netTick, opts: { bus: 'sfx', volume: 0.9 } }];
    case 'score':
      return [
        { key: SFX.scoreJingle, opts: { bus: 'sfx', volume: 0.9 } },
        { key: pick([SFX.crowdCheer1, SFX.crowdCheer2], ev.id), opts: { bus: 'ambient', volume: 0.8 } }
      ];
    case 'matchWon':
      return [
        { key: SFX.winFlourish, opts: { bus: 'sfx', volume: 1.0 } },
        { key: SFX.crowdCheer1, opts: { bus: 'ambient', volume: 1.0 } }
      ];
    case 'powerup': {
      const kind = ev.payload.kind;
      const key = kind === 'boost' ? SFX.powerupBoost
                : kind === 'shield' ? SFX.powerupShield
                : SFX.powerupSlow;
      return [{ key, opts: { bus: 'sfx', volume: 0.9 } }];
    }
    case 'shieldAbsorb':
      return [{ key: SFX.shieldZap, opts: { bus: 'sfx', volume: 1.0 } }];
    default:
      return [];
  }
}

// Location of the SFX sprite when provided. Path is stable; when the asset is
// not present, AudioEngine.load() falls back to silent mode without error.
export const SFX_ASSET = {
  src: ['/audio/sfx.webm', '/audio/sfx.mp3'],
  // Sprite map is a placeholder — real offsets would come from the audio
  // team's exported JSON. Until then, keys resolve to 0-duration slices and
  // play() silently no-ops (which is the desired graceful fallback).
  sprite: {
    [SFX.paddleHit1]:       [0, 180],
    [SFX.paddleHit2]:       [200, 180],
    [SFX.paddleHit3]:       [400, 200],
    [SFX.netTick]:          [620, 120],
    [SFX.tableBounce1]:     [760, 150],
    [SFX.tableBounce2]:     [930, 150],
    [SFX.tableBounce3]:     [1100, 150],
    [SFX.scoreJingle]:      [1280, 900],
    [SFX.matchPointStinger]: [2200, 1500],
    [SFX.winFlourish]:      [3750, 2400],
    [SFX.powerupBoost]:     [6200, 500],
    [SFX.powerupShield]:    [6750, 520],
    [SFX.powerupSlow]:      [7300, 520],
    [SFX.shieldZap]:        [7850, 600],
    [SFX.uiHover]:          [8500, 140],
    [SFX.uiClick]:          [8680, 180],
    [SFX.crowdCheer1]:      [8900, 2000],
    [SFX.crowdCheer2]:      [10950, 2000],
    [SFX.crowdOoh]:         [13000, 1200]
  }
};

export const MUSIC = {
  menu:  { key: 'menu',  src: ['/audio/music/menu-loop.webm',  '/audio/music/menu-loop.mp3'],  volume: 0.45 },
  match: { key: 'match', src: ['/audio/music/match-loop.webm', '/audio/music/match-loop.mp3'], volume: 0.40 }
};
