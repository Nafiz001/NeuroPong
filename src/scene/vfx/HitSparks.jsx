// Hit sparks — small burst of additive points spawned on paddle hits, shield
// absorbs, and big scores. Pool of sparks means no per-hit allocation.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { state } from '../../game/store.js';
import { onSceneEvent } from '../sceneBus.js';
import { VOLTARI, EMBERLYNX } from '../../branding/palette.js';

const MAX_SPARKS = 120;
const SPARK_LIFE = 0.45;

export default function HitSparks() {
  const points = useRef();

  const sparks = useMemo(() => {
    return Array.from({ length: MAX_SPARKS }, () => ({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 1,
      color: new THREE.Color()
    }));
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3));
    g.setAttribute('color',    new THREE.Float32BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3));
    g.setAttribute('alpha',    new THREE.Float32BufferAttribute(new Float32Array(MAX_SPARKS), 1));
    return g;
  }, []);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = alpha;
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 9.0 * alpha + 1.5;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }), []);

  function spawnBurst(x, y, z, tint, count = 14) {
    let spawned = 0;
    for (let i = 0; i < sparks.length && spawned < count; i++) {
      const s = sparks[i];
      if (s.life <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const up    = Math.random() * Math.PI * 0.3 + 0.1;
        const speed = 2.0 + Math.random() * 3.5;
        s.x = x; s.y = y; s.z = z;
        s.vx = Math.cos(angle) * Math.cos(up) * speed;
        s.vy = Math.sin(up) * (speed * 0.8);
        s.vz = Math.sin(angle) * Math.cos(up) * speed;
        s.maxLife = SPARK_LIFE + Math.random() * 0.25;
        s.life = s.maxLife;
        s.color.set(tint);
        spawned++;
      }
    }
  }

  useEffect(() => {
    return onSceneEvent(ev => {
      if (ev.type === 'hit') {
        const tint = ev.payload.side === 'left' ? VOLTARI.c400 : EMBERLYNX.c400;
        spawnBurst(state.ball.x, state.ball.y, state.ball.z, tint, ev.payload.smash ? 22 : 14);
      } else if (ev.type === 'shieldAbsorb') {
        spawnBurst(state.ball.x, state.ball.y, state.ball.z, '#22D3EE', 26);
      } else if (ev.type === 'matchWon') {
        // Confetti-ish burst around the winner paddle.
        const winnerSide = ev.payload.winner;
        const p = state.paddles[winnerSide];
        const tint = winnerSide === 'left' ? VOLTARI.c300 : EMBERLYNX.c300;
        spawnBurst(p.x, p.y + 1.2, p.z, tint, 36);
      }
    });
  }, []);

  useFrame((_, dt) => {
    if (!points.current) return;
    const pos   = geometry.attributes.position.array;
    const col   = geometry.attributes.color.array;
    const alpha = geometry.attributes.alpha.array;
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      if (s.life > 0) {
        s.life -= dt;
        s.vy -= 9.0 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      }
      pos[i * 3]     = s.x;
      pos[i * 3 + 1] = s.y;
      pos[i * 3 + 2] = s.z;
      col[i * 3]     = s.color.r;
      col[i * 3 + 1] = s.color.g;
      col[i * 3 + 2] = s.color.b;
      alpha[i] = Math.max(0, s.life / s.maxLife);
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
  );
}
