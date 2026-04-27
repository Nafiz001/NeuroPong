// Silhouette crowd built from instanced meshes arranged in concentric rows.
// Each instance gets a per-instance phase so the sway shader can offset
// them in time. A crowd-energy uniform amplifies the motion on big moments.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCrowdEnergy } from './useCrowdEnergy.js';

const tempObject = new THREE.Object3D();
const tempColor  = new THREE.Color();

export default function Crowd({
  innerRadius = 14,
  outerRadius = 16,
  rows = 3,
  density = 36,
  yBase = 0.7,
  tint = '#334155'
}) {
  const ref = useRef();
  const colorRef = useRef();
  const phaseRef = useRef();
  const count = rows * density;

  const { basePositions, phases } = useMemo(() => {
    const positions = [];
    const phases = new Float32Array(count);
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const t = r / Math.max(1, rows - 1);
      const radius = innerRadius + (outerRadius - innerRadius) * t;
      const angleStep = (Math.PI * 2) / density;
      for (let i = 0; i < density; i++) {
        const angle = i * angleStep + (r * 0.11);
        positions.push({
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: yBase + r * 0.15 + ((i * 13 + r * 7) % 5) * 0.04,
          scale: 0.85 + ((i * 17 + r * 11) % 7) * 0.03
        });
        phases[idx++] = ((i * 31 + r * 47) % 100) / 100 * Math.PI * 2;
      }
    }
    return { basePositions: positions, phases };
  }, [innerRadius, outerRadius, rows, density, yBase, count]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const energy = useCrowdEnergy.getState().energy;
    useCrowdEnergy.getState().tick(dt * 1000);
    const time = performance.now() / 1000;
    const baseCol = tempColor.set(tint);
    const hotCol  = tempColor.clone().set('#F8FAFC');

    for (let i = 0; i < count; i++) {
      const p = basePositions[i];
      const phase = phases[i];
      const sway = Math.sin(time * 2 + phase) * (0.03 + energy * 0.18);
      const bounce = Math.max(0, Math.sin(time * 3 + phase)) * energy * 0.22;
      tempObject.position.set(p.x, p.y + bounce, p.z);
      // Face inward toward the arena center.
      tempObject.rotation.set(0, Math.atan2(-p.x, -p.z) + sway, sway * 0.4);
      tempObject.scale.setScalar(p.scale);
      tempObject.updateMatrix();
      ref.current.setMatrixAt(i, tempObject.matrix);

      // Tint shimmer — higher energy = brighter.
      const mix = 0.15 + energy * 0.55 * (0.5 + Math.sin(time * 3.5 + phase) * 0.5);
      tempColor.set(tint).lerp(hotCol, Math.min(1, mix));
      ref.current.setColorAt(i, tempColor);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]} castShadow={false} receiveShadow={false}>
      <capsuleGeometry args={[0.15, 0.45, 2, 8]} />
      <meshStandardMaterial
        color={tint}
        roughness={0.95}
        metalness={0.0}
        transparent={false}
      />
    </instancedMesh>
  );
}
