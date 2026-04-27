// Branded boot sequence. Plays once per app load, any input skips forward.

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import NeuroPongWordmark from '../branding/logos/NeuroPongWordmark.jsx';
import VoltariMark from '../branding/logos/VoltariMark.jsx';
import EmberLynxMark from '../branding/logos/EmberLynxMark.jsx';
import { initAudio } from '../audio/hooks.js';

const TOTAL_MS = 2800;

export default function IntroSplash({ onComplete }) {
  useEffect(() => {
    const done = () => onComplete?.();
    const t = setTimeout(done, TOTAL_MS);

    const skip = () => {
      clearTimeout(t);
      done();
    };
    const unlock = () => {
      // First gesture is a good moment to unlock audio.
      initAudio().catch(() => {});
      skip();
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', unlock);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', unlock);
    };
  }, [onComplete]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 menu-backdrop" />

      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ letterSpacing: '0.5em', opacity: 0 }}
          animate={{ letterSpacing: '0.02em', opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <NeuroPongWordmark className="w-[520px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <VoltariMark size={44} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Season</div>
              <div className="font-display font-bold text-voltari-300 text-sm">VOLTARI</div>
            </div>
          </div>
          <div className="text-slate-500 font-display text-xl">vs</div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">01</div>
              <div className="font-display font-bold text-emberlynx-300 text-sm">EMBER LYNX</div>
            </div>
            <EmberLynxMark size={44} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ duration: 0.5, delay: 2.0 }}
          className="text-[10px] tracking-[0.32em] uppercase text-slate-500"
        >
          Press any key to begin
        </motion.div>
      </motion.div>

      {/* White flash at the end — driven by exit */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: TOTAL_MS / 1000, times: [0, 0.78, 0.88, 1], ease: 'easeOut' }}
      />
    </div>
  );
}
