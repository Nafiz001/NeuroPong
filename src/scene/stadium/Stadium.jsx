// The venue around the table: pit floor, seat tiers, ad banner ring, ceiling
// truss hints. All procedural — no external model required.

import { useMemo } from 'react';
import * as THREE from 'three';
import Floodlights from './Floodlights.jsx';
import Crowd from './Crowd.jsx';
import BannerRing from './BannerRing.jsx';
import Jumbotron from './Jumbotron.jsx';
import { VOLTARI, EMBERLYNX, SURFACE } from '../../branding/palette.js';

const RING_INNER_RADIUS = 14;
const RING_TIER_COUNT = 3;
const RING_TIER_HEIGHT = 1.6;
const RING_TIER_DEPTH = 2.6;

export default function Stadium() {
  const tiers = useMemo(() => {
    const arr = [];
    for (let i = 0; i < RING_TIER_COUNT; i++) {
      const inner = RING_INNER_RADIUS + i * RING_TIER_DEPTH;
      const outer = inner + RING_TIER_DEPTH;
      const y     = i * RING_TIER_HEIGHT;
      arr.push({ inner, outer, y, i });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Pit floor — wide ring under the table that fades toward the seating */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <circleGeometry args={[RING_INNER_RADIUS + 0.1, 64]} />
        <meshStandardMaterial color={SURFACE.bg1} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Concentric seating tiers */}
      {tiers.map(t => (
        <group key={t.i} position={[0, t.y, 0]}>
          {/* Tier riser (the step up) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[t.inner, t.outer, 64, 1]} />
            <meshStandardMaterial
              color={t.i % 2 === 0 ? '#0F1626' : '#0B1020'}
              roughness={0.85}
            />
          </mesh>
          {/* Front-face trim — emissive accent per tier, alternates faction color */}
          <mesh position={[0, RING_TIER_HEIGHT / 2, 0]}>
            <torusGeometry args={[t.inner, 0.04, 6, 64]} />
            <meshStandardMaterial
              color={t.i % 2 === 0 ? VOLTARI.c400 : EMBERLYNX.c400}
              emissive={t.i % 2 === 0 ? VOLTARI.c400 : EMBERLYNX.c400}
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>
          <Crowd
            innerRadius={t.inner + 0.4}
            outerRadius={t.outer - 0.4}
            rows={3}
            density={44}
            yBase={RING_TIER_HEIGHT * 0.4}
            tint={t.i === 0 ? VOLTARI.c500 : t.i === 1 ? EMBERLYNX.c500 : '#334155'}
          />
        </group>
      ))}

      {/* Truss ring overhead — hints at arena infrastructure */}
      <mesh position={[0, 14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_INNER_RADIUS + 0.2, 0.1, 8, 64]} />
        <meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_INNER_RADIUS + 5.2, 0.1, 8, 64]} />
        <meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.6} />
      </mesh>

      <BannerRing radius={RING_INNER_RADIUS - 0.6} height={0.8} segments={48} />
      <Jumbotron />
      <Floodlights />
    </group>
  );
}
