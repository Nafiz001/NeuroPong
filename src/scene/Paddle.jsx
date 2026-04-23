// Visual paddle. Reads its position straight from the simulation state on every
// render frame. No React state churn, no re-renders.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PADDLE, SIDE } from '../game/constants.js';
import { state } from '../game/store.js';

const COLORS = {
  [SIDE.LEFT]:  { base: '#a855f7', glow: '#c084fc' },  // Minimax (Nafiz)
  [SIDE.RIGHT]: { base: '#f97316', glow: '#fb923c' }   // Fuzzy (Dewan)
};

const BLADE_RADIUS = PADDLE.depth / 2 * 0.95;
const BLADE_THICKNESS = 0.14;
const RUBBER_THICKNESS = 0.025;
// Short handle that tapers out from the blade bottom — with yMin = 1.4 and
// blade radius ≈ 0.9, a 0.42-unit handle stays above the table surface.
const HANDLE_LENGTH = 0.42;
const HANDLE_RADIUS_TOP = 0.1;
const HANDLE_RADIUS_BOTTOM = 0.13;

export default function Paddle({ side }) {
  const ref = useRef();
  const colors = COLORS[side];
  // Opponent is on the +X side for LEFT paddle, -X side for RIGHT paddle.
  const frontDir = side === SIDE.LEFT ? 1 : -1;

  const shieldRef = useRef();
  const boostRef = useRef();
  const slowRef = useRef();

  useFrame((_, delta) => {
    const p = state.paddles[side];
    const active = state.active[side];
    if (!ref.current) return;
    ref.current.position.x = p.x;
    ref.current.position.y = p.y;
    ref.current.position.z = p.z;
    // Paddle tilts into its own motion — smoothed so small velocity jitter
    // doesn't propagate to visible wobble. Rotation axes: Z tilts forward on
    // smash, X banks along sweep, Y opens the face on lunges.
    const t = Math.min(1, delta * 8);
    const targetRZ = -p.vy * 0.025;
    const targetRX = p.vz * 0.018;
    const targetRY = -p.vx * 0.03 * (side === SIDE.LEFT ? 1 : -1);
    ref.current.rotation.z += (targetRZ - ref.current.rotation.z) * t;
    ref.current.rotation.x += (targetRX - ref.current.rotation.x) * t;
    ref.current.rotation.y += (targetRY - ref.current.rotation.y) * t;
    // Power-up visuals — each effect gets its own ring that pulses while active.
    if (shieldRef.current) {
      shieldRef.current.visible = active.shield > 0;
      shieldRef.current.rotation.x += delta * 1.2;
    }
    if (boostRef.current) {
      boostRef.current.visible = active.boost > 0;
      const s = 1 + Math.sin(performance.now() / 80) * 0.08;
      boostRef.current.scale.set(s, s, s);
    }
    if (slowRef.current) {
      slowRef.current.visible = active.slow > 0;
      slowRef.current.rotation.z += delta * 2.2;
    }
  });

  const baseX = side === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;
  const frontFaceX = frontDir * (BLADE_THICKNESS / 2 + RUBBER_THICKNESS / 2);
  const backFaceX = -frontFaceX;

  return (
    <group ref={ref} position={[baseX, PADDLE.homeY, 0]}>
      {/* Wooden blade core (round) */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BLADE_RADIUS * 0.97, BLADE_RADIUS * 0.97, BLADE_THICKNESS, 40]} />
        <meshStandardMaterial color="#e3b684" roughness={0.55} metalness={0.04} />
      </mesh>

      {/* Front rubber face (player color, faces opponent) */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[frontFaceX, 0, 0]}>
        <cylinderGeometry args={[BLADE_RADIUS, BLADE_RADIUS, RUBBER_THICKNESS, 40]} />
        <meshStandardMaterial
          color={colors.base}
          emissive={colors.glow}
          emissiveIntensity={0.45}
          roughness={0.82}
          metalness={0.02}
        />
      </mesh>

      {/* Back rubber face (black) */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[backFaceX, 0, 0]}>
        <cylinderGeometry args={[BLADE_RADIUS, BLADE_RADIUS, RUBBER_THICKNESS, 40]} />
        <meshStandardMaterial color="#161616" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[BLADE_RADIUS * 0.99, 0.028, 10, 48]} />
        <meshStandardMaterial color="#2a1608" roughness={0.7} />
      </mesh>

      {/* Handle shaft */}
      <mesh castShadow position={[0, -BLADE_RADIUS - HANDLE_LENGTH / 2 + 0.04, 0]}>
        <cylinderGeometry args={[HANDLE_RADIUS_TOP, HANDLE_RADIUS_BOTTOM, HANDLE_LENGTH, 24]} />
        <meshStandardMaterial color="#7a4826" roughness={0.8} metalness={0.04} />
      </mesh>

      {/* Grip wrap */}
      <mesh castShadow position={[0, -BLADE_RADIUS - HANDLE_LENGTH * 0.55, 0]}>
        <cylinderGeometry args={[HANDLE_RADIUS_BOTTOM * 1.08, HANDLE_RADIUS_BOTTOM * 1.05, HANDLE_LENGTH * 0.55, 24]} />
        <meshStandardMaterial color="#2c1a10" roughness={0.95} />
      </mesh>

      {/* SHIELD aura — cyan ring that spins around the blade */}
      <mesh ref={shieldRef} visible={false}>
        <torusGeometry args={[BLADE_RADIUS * 1.25, 0.055, 16, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} transparent opacity={0.85} />
      </mesh>

      {/* BOOST aura — emerald glow that pulses in scale */}
      <mesh ref={boostRef} visible={false} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BLADE_RADIUS * 1.15, BLADE_RADIUS * 1.15, BLADE_THICKNESS * 1.4, 40]} />
        <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={1.2} transparent opacity={0.25} />
      </mesh>

      {/* SLOW aura — amber ring rotating over the paddle */}
      <mesh ref={slowRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BLADE_RADIUS * 1.35, 0.045, 12, 48]} />
        <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.3} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
