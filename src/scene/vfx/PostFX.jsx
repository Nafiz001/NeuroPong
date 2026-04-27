// Post-processing stack: bloom, vignette, chromatic aberration (slow-mo bound),
// subtle noise. Tone mapping is set on the renderer itself in App.jsx.

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useSlowMo } from '../camera/useSlowMo.js';

export default function PostFX() {
  const { gl } = useThree();
  const intensity = useSlowMo(s => s.intensity);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  const caOffset = Math.min(0.003, 0.0003 + intensity * 0.0035);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.18}
        mipmapBlur
      />
      <ChromaticAberration offset={[caOffset, caOffset]} />
      <Vignette eskil={false} offset={0.22} darkness={0.55} />
      <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
