import { motion } from 'motion/react';

const ITEMS = ['👟', '📱', '👜', '🎮', '📚', '👗', '🧸', '🎧', '⌚', '🪴', '🍳', '💄'];

export default function LoadingAnimation() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative w-40 h-48">
        {/* Falling items */}
        {ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{ left: `${15 + (i % 4) * 25}%` }}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{
              y: [-(40 + i * 8), 80],
              opacity: [0, 1, 1, 0],
              rotate: [0, (i % 2 === 0 ? 1 : -1) * 180],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: ITEMS.length * 0.3 - 1.2,
              ease: 'easeIn',
            }}
          >
            {item}
          </motion.div>
        ))}

        {/* Box */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-20">
          {/* Box back */}
          <div className="absolute inset-0 border-[3px] border-brutal-black bg-gallery-white brutal-shadow-small" />
          {/* Box front flap */}
          <motion.div
            className="absolute -top-2 left-0 right-0 h-4 border-[3px] border-brutal-black bg-neon-pink origin-bottom"
            animate={{ rotateX: [0, -30, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <motion.p
        className="mono text-xs font-bold uppercase text-gray-400 tracking-widest"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
