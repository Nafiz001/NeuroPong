// Short motion trail behind the ball. Uses a small ring buffer of recent
// positions rendered as a TubeGeometry with a radial-fade fragment shader.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { state } from '../../game/store.js';

const SAMPLES = 18;

export default function BallTrail() {
  const mesh = useRef();
  const positions = useRef(
    Array.from({ length: SAMPLES }, () => new THREE.Vector3())
  );
  const filled = useRef(false);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(positions.current.slice(), false, 'catmullrom', 0.5),
    []
  );

  useFrame(() => {
    // Shift the buffer and sample the current ball position.
    const buf = positions.current;
    for (let i = buf.length - 1; i > 0; i--) buf[i].copy(buf[i - 1]);
    buf[0].set(state.ball.x, state.ball.y, state.ball.z);
    if (!filled.current) {
      for (let i = 1; i < buf.length; i++) buf[i].copy(buf[0]);
      filled.current = true;
    }

    curve.points = buf;
    const tube = new THREE.TubeGeometry(curve, SAMPLES - 1, 0.05, 6, false);
    if (mesh.current) {
      if (mesh.current.geometry) mesh.current.geometry.dispose();
      mesh.current.geometry = tube;
    }
  });

  return (
    <mesh ref={mesh}>
      <meshBasicMaterial
        color="#FBBF24"
        transparent
        opacity={0.55}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
