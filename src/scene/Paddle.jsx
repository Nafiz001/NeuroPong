// Paddle mesh + power-up auras. Reads paddle state from the sim and renders
// through a visual-lerp layer so slow-motion reads as a smooth slowdown.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PADDLE, SIDE } from '../game/constants.js';
import { state } from '../game/store.js';
import { useSlowMo, visualAlpha } from './camera/useSlowMo.js';
import { VOLTARI, EMBERLYNX } from '../branding/palette.js';

const BLADE_RADIUS = PADDLE.depth / 2 * 0.95;
const BLADE_THICKNESS = 0.14;
const RUBBER_THICKNESS = 0.025;
const HANDLE_LENGTH = 0.42;
const HANDLE_RADIUS_TOP = 0.1;
const HANDLE_RADIUS_BOTTOM = 0.13;

const COLORS = {
  [SIDE.LEFT]:  { base: VOLTARI.c500,   glow: VOLTARI.c300   },
  [SIDE.RIGHT]: { base: EMBERLYNX.c500, glow: EMBERLYNX.c300 }
};

export default function Paddle({ side }) {
  const ref = useRef();
  const shieldRef = useRef();
  const boostRef  = useRef();
  const slowRef   = useRef();

  const colors = COLORS[side];
  const frontDir = side === SIDE.LEFT ? 1 : -1;
  const baseX = side === SIDE.LEFT ? PADDLE.leftX : PADDLE.rightX;

  const visual = useRef({
    x: baseX, y: PADDLE.homeY, z: 0,
    rx: 0, ry: 0, rz: 0
  });

  useFrame((_, dt) => {
    const p = state.paddles[side];
    const active = state.active[side];
    if (!ref.current) return;

    const intensity = useSlowMo.getState().intensity;
    const alpha = visualAlpha(intensity);
    const factor = 1 - Math.pow(1 - alpha, dt * 60);

    visual.current.x += (p.x - visual.current.x) * factor;
    visual.current.y += (p.y - visual.current.y) * factor;
    visual.current.z += (p.z - visual.current.z) * factor;

    ref.current.position.set(visual.current.x, visual.current.y, visual.current.z);

    const targetRZ = -p.vy * 0.025;
    const targetRX = p.vz * 0.018;
    const targetRY = -p.vx * 0.03 * (side === SIDE.LEFT ? 1 : -1);
    const rotFactor = Math.min(1, dt * 8);
    visual.current.rz += (targetRZ - visual.current.rz) * rotFactor;
    visual.current.rx += (targetRX - visual.current.rx) * rotFactor;
    visual.current.ry += (targetRY - visual.current.ry) * rotFactor;
    ref.current.rotation.set(visual.current.rx, visual.current.ry, visual.current.rz);

    if (shieldRef.current) {
      shieldRef.current.visible = active.shield > 0;
      shieldRef.current.rotation.x += dt * 1.2;
    }
    if (boostRef.current) {
      boostRef.current.visible = active.boost > 0;
      const s = 1 + Math.sin(performance.now() / 80) * 0.08;
      boostRef.current.scale.set(s, s, s);
    }
    if (slowRef.current) {
      slowRef.current.visible = active.slow > 0;
      slowRef.current.rotation.z += dt * 2.2;
    }
  });

  const frontFaceX = frontDir * (BLADE_THICKNESS / 2 + RUBBER_THICKNESS / 2);
  const backFaceX = -frontFaceX;

  return (
    <group ref={ref} position={[baseX, PADDLE.homeY, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BLADE_RADIUS * 0.97, BLADE_RADIUS * 0.97, BLADE_THICKNESS, 40]} />
        <meshStandardMaterial color="#E3B684" roughness={0.55} metalness={0.04} />
      </mesh>

      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[frontFaceX, 0, 0]}>
        <cylinderGeometry args={[BLADE_RADIUS, BLADE_RADIUS, RUBBER_THICKNESS, 40]} />
        <meshPhysicalMaterial
          color={colors.base}
          emissive={colors.glow}
          emissiveIntensity={0.6}
          roughness={0.55}
          sheen={1}
          sheenColor={colors.glow}
          clearcoat={0.35}
          clearcoatRoughness={0.5}
        />
      </mesh>

      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[backFaceX, 0, 0]}>
        <cylinderGeometry args={[BLADE_RADIUS, BLADE_RADIUS, RUBBER_THICKNESS, 40]} />
        <meshStandardMaterial color="#121212" roughness={0.9} metalness={0.02} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[BLADE_RADIUS * 0.99, 0.028, 10, 48]} />
        <meshStandardMaterial color="#2a1608" roughness={0.7} />
      </mesh>

      <mesh castShadow position={[0, -BLADE_RADIUS - HANDLE_LENGTH / 2 + 0.04, 0]}>
        <cylinderGeometry args={[HANDLE_RADIUS_TOP, HANDLE_RADIUS_BOTTOM, HANDLE_LENGTH, 24]} />
        <meshStandardMaterial color="#7A4826" roughness={0.8} metalness={0.04} />
      </mesh>

      <mesh castShadow position={[0, -BLADE_RADIUS - HANDLE_LENGTH * 0.55, 0]}>
        <cylinderGeometry args={[HANDLE_RADIUS_BOTTOM * 1.08, HANDLE_RADIUS_BOTTOM * 1.05, HANDLE_LENGTH * 0.55, 24]} />
        <meshStandardMaterial color="#2C1A10" roughness={0.95} />
      </mesh>

      {/* SHIELD aura */}
      <mesh ref={shieldRef} visible={false}>
        <torusGeometry args={[BLADE_RADIUS * 1.25, 0.055, 16, 64]} />
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={1.5} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {/* BOOST aura */}
      <mesh ref={boostRef} visible={false} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[BLADE_RADIUS * 1.15, BLADE_RADIUS * 1.15, BLADE_THICKNESS * 1.4, 40]} />
        <meshStandardMaterial color="#10B981" emissive="#34D399" emissiveIntensity={1.3} transparent opacity={0.26} toneMapped={false} />
      </mesh>
      {/* SLOW aura */}
      <mesh ref={slowRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BLADE_RADIUS * 1.35, 0.045, 12, 48]} />
        <meshStandardMaterial color="#F59E0B" emissive="#FBBF24" emissiveIntensity={1.4} transparent opacity={0.85} toneMapped={false} />
      </mesh>
    </group>
  );
}
