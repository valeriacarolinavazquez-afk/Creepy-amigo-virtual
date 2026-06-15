import React from 'react';
import { motion } from 'motion/react';
import { playSound } from '../utils/audio';

interface BedroomRoomProps {
  isSleeping: boolean;
  onToggleSleep: () => void;
}

export const BedroomRoom: React.FC<BedroomRoomProps> = ({
  isSleeping,
  onToggleSleep,
}) => {
  const handleLampClick = () => {
    playSound('tap');
    onToggleSleep();
  };

  return (
    <div id="bedroom-room" className="flex flex-col items-center justify-between w-full h-full p-2 relative overflow-hidden">
      {/* Starry Night particles background overlay if sleeping */}
      {isSleeping && (
        <div className="absolute inset-0 bg-[#0c1020]/95 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Animated decorative random glowing stars */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 1, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
          {/* Big crescent moon */}
          <motion.div
            className="absolute top-10 right-10 text-3xl opacity-80"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🌙
          </motion.div>
        </div>
      )}

      <div className={`text-center mb-1 z-30 transition-colors duration-300 ${isSleeping ? 'text-indigo-200' : 'text-slate-800'}`}>
        <h3 className="font-sans font-bold text-sm flex items-center justify-center gap-1.5 leading-none">
          {isSleeping ? '💤 Dormitorio.sys' : '🛌 Dormitorio.sys'}
        </h3>
        <p className={`text-[10px] font-sans mt-0.5 leading-none ${isSleeping ? 'text-indigo-400' : 'text-slate-500'}`}>
          {isSleeping ? 'Cargando energía de reserva...' : 'Apaga la lámpara para reponer fuerzas.'}
        </p>
      </div>

      {/* Decorative Table Desk with Lamp */}
      <div className="flex flex-col items-center justify-center z-30 my-auto">
        <motion.button
          id="desk-lamp-toggle"
          onClick={handleLampClick}
          className="relative block cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isSleeping ? "Encender Lámpara" : "Apagar Lámpara"}
        >
          {/* Desk Lamp SVG */}
          <svg width="100" height="130" viewBox="0 0 120 150" className="overflow-visible">
            {/* Cone Light beam if lamp is ON */}
            {!isSleeping && (
              <motion.polygon
                points="60,65 -20,150 140,150"
                fill="url(#lampLightBeam)"
                className="opacity-45 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
              />
            )}

            <defs>
              <linearGradient id="lampLightBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Lamp base */}
            <path d="M 40,135 Q 60,115 80,135 Z" fill="#64748b" stroke="#475569" strokeWidth="2" />
            
            {/* Lamp neck */}
            <path d="M 60,125 Q 75,90 60,65" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            
            {/* Lamp shade/head representing yellow/orange active toggle state */}
            <path
              d="M 35,65 Q 60,40 85,65 Z"
              fill={isSleeping ? '#334155' : '#fac015'}
              stroke={isSleeping ? '#1e293b' : '#b45309'}
              strokeWidth="2.5"
            />
            {/* Small light bulb */}
            {!isSleeping && (
              <circle cx="60" cy="64" r="6" fill="#fef08a" />
            )}
          </svg>

          {/* Interactive Toggle Label Overlay */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span className={`text-[9px] font-sans font-bold px-2 py-0.5 border shadow-sm transition-all ${
              isSleeping 
                ? 'bg-slate-900 border-indigo-500/40 text-indigo-300' 
                : 'bg-[#ece9d8] border-[#a09e95] text-slate-700'
            }`}>
              {isSleeping ? 'Oscuridad' : 'Brillo'}
            </span>
          </div>
        </motion.button>
      </div>

      <div className="w-full max-w-sm mt-auto z-30">
        <div className={`p-2 border text-center ${
          isSleeping
            ? 'bg-slate-950/60 border-slate-800 text-indigo-300'
            : 'bg-white border-[#b5b2a3] text-slate-700'
        }`}>
          <span className="text-[10px] font-sans">
            {isSleeping 
              ? 'Clippy duerme profundamente y está restableciendo la batería de sus grapas.' 
              : 'Clippy se encuentra cansado. Dale un buen descanso.'}
          </span>
        </div>
      </div>
    </div>
  );
};
