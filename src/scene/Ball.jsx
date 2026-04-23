// Visual ball. Same pattern as Paddle — reads from `state` each frame.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BALL } from '../game/constants.js';
import { state } from '../game/store.js';

export default function Ball() {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(state.ball.x, state.ball.y, state.ball.z);
  });
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[BALL.radius, 24, 24]} />
      <meshStandardMaterial
        color="#fef3c7"
        emissive="#facc15"
        emissiveIntensity={0.8}
        roughness={0.2}
      />
      <pointLight color="#facc15" intensity={1.2} distance={4} />
    </mesh>
  );
}
