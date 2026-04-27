// Render-side pub/sub for game events. One driver drains state.events on
// every frame and fan-outs to every subscriber. This keeps the simulation's
// events buffer empty (it's bounded) and lets audio, VFX, commentary, and
// telemetry all consume the same stream without racing each other on drain.

const subscribers = new Set();

export function onSceneEvent(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function dispatchSceneEvent(ev) {
  for (const fn of subscribers) {
    try { fn(ev); } catch { /* consumer errors must not break the bus */ }
  }
}

export function dispatchSceneEvents(events) {
  if (!events || !events.length) return;
  for (const ev of events) {
    for (const fn of subscribers) {
      try { fn(ev); } catch { /* ignore */ }
    }
  }
}
