// Ball mesh + its lighting + trail. Reads the ball position from the sim
// state and interpolates toward it so slow-motion renders smoothly without
// changing sim determinism.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BALL } from '../game/constants.js';
import { state } from '../game/store.js';
import { useSlowMo, visualAlpha } from './camera/useSlowMo.js';
import BallTrail from './vfx/BallTrail.jsx';

export default function Ball() {
  const ref = useRef();
  const visual = useRef({ x: 0, y: BALL.radius, z: 0 });

  useFrame((_, dt) => {
    if (!ref.current) return;
    const intensity = useSlowMo.getState().intensity;
    const alpha = visualAlpha(intensity);
    // Exponential-smoothed lerp factor for frame-rate independence.
    const factor = 1 - Math.pow(1 - alpha, dt * 60);

    visual.current.x += (state.ball.x - visual.current.x) * factor;
    visual.current.y += (state.ball.y - visual.current.y) * factor;
    visual.current.z += (state.ball.z - visual.current.z) * factor;

    ref.current.position.set(visual.current.x, visual.current.y, visual.current.z);
  });

  return (
    <>
      <mesh ref={ref} castShadow>
        <sphereGeometry args={[BALL.radius, 28, 28]} />
        <meshStandardMaterial
          color="#FEF3C7"
          emissive="#FBBF24"
          emissiveIntensity={1.4}
          roughness={0.25}
          metalness={0.02}
          toneMapped={false}
        />
        <pointLight color="#FBBF24" intensity={1.4} distance={5} />
      </mesh>
      <BallTrail />
    </>
  );
}
