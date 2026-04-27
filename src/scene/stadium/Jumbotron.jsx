// Four jumbotron panels at stadium corners. They show the live score drawn
// with drei's Text component. No render-target gymnastics needed — Text
// lives in the main scene, attached to the corner panels.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useHud } from '../../game/store.js';
import { SURFACE, VOLTARI, EMBERLYNX } from '../../branding/palette.js';

const CORNERS = [
  // [x, y, z, rotationY]
  [  9, 10,  9, -Math.PI / 4 ],
  [ -9, 10,  9,  Math.PI / 4 ],
  [  9, 10, -9, -3 * Math.PI / 4 ],
  [ -9, 10, -9,  3 * Math.PI / 4 ]
];

export default function Jumbotron() {
  return (
    <group>
      {CORNERS.map(([x, y, z, ry], i) => (
        <JumbotronPanel key={i} position={[x, y, z]} rotationY={ry} />
      ))}
    </group>
  );
}

function JumbotronPanel({ position, rotationY }) {
  const leftRef = useRef();
  const rightRef = useRef();
  const lastScoreL = useRef(-1);
  const lastScoreR = useRef(-1);

  useFrame(() => {
    const { scoreL, scoreR } = useHud.getState();
    if (lastScoreL.current !== scoreL && leftRef.current) {
      leftRef.current.text = String(scoreL);
      lastScoreL.current = scoreL;
    }
    if (lastScoreR.current !== scoreR && rightRef.current) {
      rightRef.current.text = String(scoreR);
      lastScoreR.current = scoreR;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[3.6, 2.1, 0.12]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Screen — dim blue-black panel */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[3.3, 1.8]} />
        <meshStandardMaterial
          color={SURFACE.bg2}
          emissive="#0EA5E9"
          emissiveIntensity={0.08}
          roughness={0.55}
        />
      </mesh>

      {/* Score numerals */}
      <Text
        ref={leftRef}
        position={[-0.72, 0, 0.09]}
        fontSize={1.1}
        color={VOLTARI.c300}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
      >
        0
      </Text>
      <Text
        position={[0, 0, 0.09]}
        fontSize={0.9}
        color="#64748B"
        anchorX="center"
        anchorY="middle"
      >
        :
      </Text>
      <Text
        ref={rightRef}
        position={[0.72, 0, 0.09]}
        fontSize={1.1}
        color={EMBERLYNX.c300}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
      >
        0
      </Text>

      {/* Brand strip */}
      <Text
        position={[0, -0.82, 0.09]}
        fontSize={0.14}
        color="#94A3B8"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.22}
      >
        NEUROPONG · ARENA
      </Text>
    </group>
  );
}
