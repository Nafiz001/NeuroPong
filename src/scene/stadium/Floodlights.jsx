// Stadium lighting rig: four spotlights + ambient fill + volumetric cones.
// Only the main directional light casts shadows to keep the cost manageable.

import { VOLTARI, EMBERLYNX } from '../../branding/palette.js';

const RIG = [
  // [x, y, z, tint, warm?]
  [  9, 16,  8, VOLTARI.c400,   false],
  [ -9, 16, -8, EMBERLYNX.c400, true],
  [ -9, 16,  8, EMBERLYNX.c400, true],
  [  9, 16, -8, VOLTARI.c400,   false]
];

export default function Floodlights() {
  return (
    <group>
      <ambientLight intensity={0.15} color="#E2E8F0" />

      {/* Main shadow caster */}
      <directionalLight
        position={[8, 20, 6]}
        intensity={0.85}
        color="#F8FAFC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {RIG.map(([x, y, z, tint], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Truss cap */}
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.5, 0.4, 12]} />
            <meshStandardMaterial color="#1F2937" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Lamp */}
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial
              color={tint}
              emissive={tint}
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
          <spotLight
            position={[0, -0.2, 0]}
            angle={0.55}
            penumbra={0.4}
            intensity={0.9}
            distance={40}
            color={tint}
            target-position={[-x * 0.3, 0, -z * 0.3]}
          />
          {/* Volumetric cone — additive cylinder gives a haze suggestion without
              true volumetric scattering */}
          <mesh position={[-x * 0.3, -y / 2 - 0.5, -z * 0.3]} rotation={[0, 0, 0]}>
            <coneGeometry args={[5.5, y + 1, 16, 1, true]} />
            <meshBasicMaterial
              color={tint}
              transparent
              opacity={0.035}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
