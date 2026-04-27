// Single owner of drainEvents(). Runs inside the R3F Canvas so it ticks
// every frame in sync with the scene. Fans events out through sceneBus
// so audio, VFX, commentary, and stats can all subscribe.

import { useFrame } from '@react-three/fiber';
import { drainEvents } from '../game/store.js';
import { dispatchSceneEvents } from './sceneBus.js';

export default function EventBusDriver() {
  useFrame(() => {
    const events = drainEvents();
    if (events.length) dispatchSceneEvents(events);
  });
  return null;
}
