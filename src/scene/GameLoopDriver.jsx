// Bridge between the R3F render loop and our deterministic sim.
// Just calls step(dtMs) every frame. No JSX output.

import { useFrame } from '@react-three/fiber';
import { step } from '../game/loop.js';

export default function GameLoopDriver() {
  useFrame((_, dtSeconds) => {
    step(dtSeconds * 1000);
  });
  return null;
}
