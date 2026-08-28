import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KairoVisualState } from '@saarathi/types';

interface KairoOrbProps {
  state?: KairoVisualState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWaveform?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KairoOrb: React.FC<KairoOrbProps> = ({
  state = 'IDLE',
  size = 'md',
  showWaveform = true,
  interactive = false,
  onClick,
  className = '',
}) => {
  const sizeMap = {
    sm: { container: 'w-10 h-10', core: 'w-5 h-5', glow: 'w-10 h-10', barHeight: 12 },
    md: { container: 'w-16 h-16', core: 'w-8 h-8', glow: 'w-16 h-16', barHeight: 20 },
    lg: { container: 'w-28 h-28', core: 'w-14 h-14', glow: 'w-28 h-28', barHeight: 32 },
    xl: { container: 'w-40 h-40', core: 'w-20 h-20', glow: 'w-40 h-40', barHeight: 48 },
  };

  const dimensions = sizeMap[size];

  // Colors & Gradients based on State
  const stateStyles = {
    IDLE: {
      core: 'from-indigo-500 via-blue-500 to-indigo-600 shadow-indigo-500/30',
      ring: 'border-indigo-400/20 bg-indigo-500/5',
      glow: 'bg-indigo-500/20',
      pulseDuration: 4,
      scaleRange: [1, 1.05, 1],
    },
    LISTENING: {
      core: 'from-cyan-400 via-teal-500 to-emerald-500 shadow-teal-500/40',
      ring: 'border-teal-400/30 bg-teal-500/10',
      glow: 'bg-teal-400/30',
      pulseDuration: 1.5,
      scaleRange: [1, 1.15, 1],
    },
    THINKING: {
      core: 'from-purple-500 via-indigo-600 to-pink-500 shadow-purple-500/40',
      ring: 'border-purple-400/30 bg-purple-500/10',
      glow: 'bg-purple-500/30',
      pulseDuration: 1.2,
      scaleRange: [0.95, 1.08, 0.95],
    },
    SPEAKING: {
      core: 'from-blue-400 via-indigo-500 to-cyan-400 shadow-blue-500/40',
      ring: 'border-blue-400/30 bg-blue-500/10',
      glow: 'bg-blue-400/30',
      pulseDuration: 0.8,
      scaleRange: [1, 1.2, 1],
    },
    PROCESSING: {
      core: 'from-amber-400 via-orange-500 to-indigo-600 shadow-orange-500/40',
      ring: 'border-amber-400/30 bg-amber-500/10',
      glow: 'bg-amber-400/30',
      pulseDuration: 2,
      scaleRange: [1, 1.1, 1],
    },
    SUCCESS: {
      core: 'from-emerald-400 via-teal-500 to-green-600 shadow-emerald-500/40',
      ring: 'border-emerald-400/40 bg-emerald-500/15',
      glow: 'bg-emerald-400/35',
      pulseDuration: 0.8,
      scaleRange: [1, 1.25, 1],
    },
    ERROR: {
      core: 'from-rose-500 via-red-600 to-pink-600 shadow-rose-500/40',
      ring: 'border-rose-400/30 bg-rose-500/10',
      glow: 'bg-rose-500/30',
      pulseDuration: 1.5,
      scaleRange: [0.98, 1.05, 0.98],
    },
  };

  const currentStyle = stateStyles[state] || stateStyles.IDLE;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative flex items-center justify-center select-none ${dimensions.container} ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      role="status"
      aria-label={`Kairo assistant status: ${state}`}
    >
      {/* Outer Ambient Glow Ring */}
      <motion.div
        animate={{
          scale: currentStyle.scaleRange,
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: currentStyle.pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute rounded-full blur-xl pointer-events-none transition-colors duration-500 ${dimensions.glow} ${currentStyle.glow}`}
      />

      {/* Orbiting Ring (Active during THINKING / PROCESSING) */}
      <AnimatePresence>
        {(state === 'THINKING' || state === 'PROCESSING') && (
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className={`absolute inset-0 rounded-full border border-dashed border-primary/40 pointer-events-none`}
          />
        )}
      </AnimatePresence>

      {/* Middle Animated Glass Ring */}
      <motion.div
        animate={{
          scale: state === 'LISTENING' || state === 'SPEAKING' ? [1, 1.12, 1] : [1, 1.04, 1],
        }}
        transition={{
          duration: currentStyle.pulseDuration * 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute inset-1 rounded-full border backdrop-blur-sm transition-all duration-500 ${currentStyle.ring}`}
      />

      {/* Core Energy Orb */}
      <motion.div
        animate={{
          scale: currentStyle.scaleRange,
        }}
        transition={{
          duration: currentStyle.pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`relative rounded-full bg-gradient-to-tr shadow-lg flex items-center justify-center transition-all duration-500 ${dimensions.core} ${currentStyle.core}`}
      >
        {/* Waveform Bars inside core for Speaking / Listening */}
        {showWaveform && (state === 'LISTENING' || state === 'SPEAKING') && (
          <div className="flex items-center gap-0.5 justify-center z-10">
            {[0.4, 0.8, 1, 0.6, 0.3].map((heightMult, i) => (
              <motion.div
                key={i}
                animate={{
                  scaleY: [heightMult * 0.3, heightMult, heightMult * 0.3],
                }}
                transition={{
                  duration: 0.4 + i * 0.08,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }}
                className="w-[2px] sm:w-[3px] bg-white rounded-full origin-center"
                style={{ height: `${dimensions.barHeight * heightMult}px` }}
              />
            ))}
          </div>
        )}

        {/* Minimal Breathing Dot when Idle */}
        {state === 'IDLE' && (
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm"
          />
        )}
      </motion.div>
    </div>
  );
};
