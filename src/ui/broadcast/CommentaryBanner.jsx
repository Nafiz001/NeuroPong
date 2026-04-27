// Subtitled commentary line. The CommentaryDirector writes here as it fires
// voice lines; the banner animates in/out like a TV lower-third caption.

import { motion, AnimatePresence } from 'framer-motion';

export default function CommentaryBanner({ line }) {
  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 w-[560px] flex justify-center">
      <AnimatePresence>
        {line && (
          <motion.div
            key={line.id}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: -14, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="broadcast-slab rounded-xl px-5 py-2"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-accent font-semibold">
              {line.speaker}
            </div>
            <div className="text-sm text-slate-100 mt-0.5">
              {line.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
