// Visible table + net. Gameplay physics are simulated in src/game/physics.js.

import { ARENA, BALL } from '../game/constants.js';

const WALL_COLOR = '#1e293b';
const TABLE_COLOR = '#0f172a';
const NEON = '#22d3ee';

export default function Arena() {
  const w = ARENA.width;
  const d = ARENA.depth;

  return (
    <group>
      {/* Table surface */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={TABLE_COLOR} roughness={0.6} />
      </mesh>

      {/* Center line (visual only) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, d - 0.5]} />
        <meshBasicMaterial color={NEON} />
      </mesh>

      {/* Table net */}
      <mesh position={[0, BALL.netHeight / 2, 0]}>
        <boxGeometry args={[BALL.netThickness, BALL.netHeight, d - 0.6]} />
        <meshStandardMaterial color={WALL_COLOR} emissive={NEON} emissiveIntensity={0.28} />
      </mesh>

      {/* End indicators */}
      <mesh position={[+w / 2, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.1, d]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <mesh position={[-w / 2, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.1, d]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
    </group>
  );
}
