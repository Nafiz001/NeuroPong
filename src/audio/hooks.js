// Render-side audio plumbing. Subscribes to the sceneBus (populated by
// EventBusDriver inside the Canvas) and plays the mapped sounds through
// AudioEngine. No-ops gracefully if the audio sprite is not loaded.

import { useEffect, useRef } from 'react';
import { AudioEngine } from './AudioEngine.js';
import { eventToSounds, MUSIC, SFX_ASSET } from './soundMap.js';
import { onSceneEvent } from '../scene/sceneBus.js';

export async function initAudio() {
  AudioEngine.unlock();
  await AudioEngine.load(SFX_ASSET);
}

export function useMenuMusic(active = true) {
  useEffect(() => {
    if (!active) return;
    AudioEngine.playMusic(MUSIC.menu.key, { src: MUSIC.menu.src, volume: MUSIC.menu.volume });
  }, [active]);
}

export function useMatchMusic(active = true) {
  useEffect(() => {
    if (!active) return;
    AudioEngine.playMusic(MUSIC.match.key, { src: MUSIC.match.src, volume: MUSIC.match.volume });
  }, [active]);
}

// Subscribe to sceneBus and play the mapped sound for each game event.
export function useGameEventAudio(onEvent) {
  const cbRef = useRef(onEvent);
  useEffect(() => { cbRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    return onSceneEvent(ev => {
      for (const { key, opts } of eventToSounds(ev)) {
        AudioEngine.play(key, opts);
      }
      try { cbRef.current?.(ev); } catch { /* ignore */ }
    });
  }, []);
}
