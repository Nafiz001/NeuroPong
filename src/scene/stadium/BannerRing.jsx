// Sponsor banner ring surrounding the arena. Alternates faction accent colors
// around the circumference. Purely decorative — gives the venue a branded feel.

import { useMemo } from 'react';
import * as THREE from 'three';
import { VOLTARI, EMBERLYNX, BRAND } from '../../branding/palette.js';

export default function BannerRing({ radius = 13.5, height = 0.9, segments = 48 }) {
  const segmentsArr = useMemo(() => {
    const arr = [];
    const step = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      arr.push({
        angle: i * step,
        tint: i % 6 === 0 ? BRAND.primary
            : i % 3 === 0 ? EMBERLYNX.c500
            : VOLTARI.c500
      });
    }
    return arr;
  }, [segments]);

  const width = (Math.PI * 2 * radius) / segments * 0.92;

  return (
    <group position={[0, height / 2 + 0.25, 0]}>
      {segmentsArr.map((s, i) => {
        const x = Math.cos(s.angle) * radius;
        const z = Math.sin(s.angle) * radius;
        return (
          <mesh
            key={i}
            position={[x, 0, z]}
            rotation={[0, -s.angle + Math.PI / 2, 0]}
          >
            <boxGeometry args={[width, height, 0.08]} />
            <meshStandardMaterial
              color={s.tint}
              emissive={s.tint}
              emissiveIntensity={0.35}
              roughness={0.55}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
