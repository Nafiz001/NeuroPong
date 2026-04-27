// Cinematic camera controller. Normally does nothing — OrbitControls owns
// the view. When slow-mo is active (match point / match won), it arcs the
// camera behind the winning paddle in a slow sweeping shot, then eases back.

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSlowMo } from './useSlowMo.js';
import { onSceneEvent } from '../sceneBus.js';
import { state } from '../../game/store.js';

export default function CinematicRig({ orbitControlsRef, basePosition }) {
  const { camera } = useThree();
  const [cinematic, setCinematic] = useState(null);
  const startPos = useRef(new THREE.Vector3());
  const endPos   = useRef(new THREE.Vector3());
  const t0 = useRef(0);
  const tickSlowMo = useSlowMo(s => s.tick);

  useEffect(() => {
    return onSceneEvent(ev => {
      if (ev.type !== 'miss' && ev.type !== 'matchWon') return;
      const winnerSide = ev.payload.winner;
      if (!winnerSide) return;
      const isMatchPoint = ev.type === 'matchWon' || ev.payload.isMatchPoint || ev.payload.isMatchWon;
      if (!isMatchPoint) return;
      const duration = ev.type === 'matchWon' ? 2400 : 1200;
      useSlowMo.getState().kick(0.72, duration);

      const wp = state.paddles[winnerSide];
      const dirX = winnerSide === 'left' ? -1 : 1;
      startPos.current.copy(camera.position);
      endPos.current.set(wp.x + dirX * 6, wp.y + 3.8, wp.z + 4.2);
      t0.current = performance.now();
      setCinematic({ duration, ends: performance.now() + duration, winnerSide });

      if (orbitControlsRef?.current) {
        orbitControlsRef.current.enabled = false;
      }
    });
  }, [camera, orbitControlsRef]);

  useFrame(() => {
    tickSlowMo();
    if (!cinematic) return;
    const now = performance.now();
    const t = Math.min(1, (now - t0.current) / cinematic.duration);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos.current, endPos.current, ease);
    camera.lookAt(state.ball.x, state.ball.y, state.ball.z);

    if (now >= cinematic.ends) {
      // Restore orbit controls + gently lerp back toward the base preset.
      if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;
      if (basePosition) {
        startPos.current.copy(camera.position);
        endPos.current.fromArray(basePosition);
        t0.current = now;
        setCinematic({ duration: 600, ends: now + 600, winnerSide: cinematic.winnerSide, easing: true });
        return;
      }
      setCinematic(null);
    }
  });

  return null;
}
