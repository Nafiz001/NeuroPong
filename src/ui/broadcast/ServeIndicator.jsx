// Chevron indicator pointing at the serving faction card.

import { motion, AnimatePresence } from 'framer-motion';

export default function ServeIndicator({ side }) {
  const pos = side === 'left' ? 'left-[230px]' : 'right-[230px]';
  const arrow = side === 'left' ? '◀' : '▶';
  const accent = side === 'left' ? 'text-voltari-300' : 'text-emberlynx-300';

  return (
    <AnimatePresence>
      <motion.div
        key={side}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{    opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.35 }}
        className={`pointer-events-none absolute top-9 ${pos} flex flex-col items-center`}
      >
        <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${accent}`}>Serve</span>
        <span className={`${accent} text-xl chevron-bob leading-none`}>{arrow}</span>
      </motion.div>
    </AnimatePresence>
  );
}
