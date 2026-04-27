// The playing surface — table, net, side-rail indicators. Stadium surroundings
// live in scene/stadium/. Keeping them separate lets us toggle them off
// cheaply during development without losing the core play view.

import { ARENA, BALL } from '../game/constants.js';
import { VOLTARI, EMBERLYNX, SURFACE } from '../branding/palette.js';

const TABLE_COLOR = '#0C1322';
const TABLE_TRIM  = '#1F2937';
const TABLE_LINE  = '#E2E8F0';
const NET_COLOR   = '#1E293B';
const NEON        = '#22D3EE';

export default function Arena() {
  const w = ARENA.width;
  const d = ARENA.depth;

  return (
    <group>
      {/* Table base — slightly raised from the pit floor */}
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.8, 0.36, d + 0.8]} />
        <meshStandardMaterial color={TABLE_TRIM} roughness={0.6} metalness={0.25} />
      </mesh>

      {/* Playfield */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshPhysicalMaterial
          color={TABLE_COLOR}
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.35}
          clearcoatRoughness={0.6}
          emissive="#070B15"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Perimeter lines (broadcast-style) */}
      <LineBorder width={w} depth={d} color={TABLE_LINE} />

      {/* Center emissive stripe — pulses via emissive intensity only */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, d - 0.4]} />
        <meshBasicMaterial color={NEON} toneMapped={false} />
      </mesh>

      {/* Net */}
      <mesh position={[0, BALL.netHeight / 2, 0]} castShadow>
        <boxGeometry args={[BALL.netThickness, BALL.netHeight, d - 0.6]} />
        <meshStandardMaterial
          color={NET_COLOR}
          emissive={NEON}
          emissiveIntensity={0.42}
          roughness={0.7}
          toneMapped={false}
        />
      </mesh>
      {/* Net support posts */}
      <mesh position={[0, BALL.netHeight * 0.75, (d - 0.6) / 2]}>
        <cylinderGeometry args={[0.045, 0.045, BALL.netHeight * 1.5, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, BALL.netHeight * 0.75, -(d - 0.6) / 2]}>
        <cylinderGeometry args={[0.045, 0.045, BALL.netHeight * 1.5, 8]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Faction accent strips along the long table edges */}
      <mesh position={[0, 0.06, +d / 2 + 0.02]}>
        <boxGeometry args={[w, 0.12, 0.08]} />
        <meshStandardMaterial
          color={VOLTARI.c500}
          emissive={VOLTARI.c400}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh position={[0, 0.06, -d / 2 - 0.02]}>
        <boxGeometry args={[w, 0.12, 0.08]} />
        <meshStandardMaterial
          color={EMBERLYNX.c500}
          emissive={EMBERLYNX.c400}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* End indicators — subtle, color-coded */}
      <mesh position={[+w / 2 + 0.02, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.5, d - 0.2]} />
        <meshStandardMaterial
          color={EMBERLYNX.c500}
          emissive={EMBERLYNX.c400}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[-w / 2 - 0.02, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.5, d - 0.2]} />
        <meshStandardMaterial
          color={VOLTARI.c500}
          emissive={VOLTARI.c400}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

function LineBorder({ width, depth, color }) {
  const t = 0.04;
  const segments = [
    // top + bottom
    { x:  0,         z:  depth / 2 - t / 2, sx: width, sz: t },
    { x:  0,         z: -depth / 2 + t / 2, sx: width, sz: t },
    // left + right
    { x: -width / 2 + t / 2, z: 0, sx: t, sz: depth },
    { x:  width / 2 - t / 2, z: 0, sx: t, sz: depth }
  ];
  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0.011, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[s.sx, s.sz]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
