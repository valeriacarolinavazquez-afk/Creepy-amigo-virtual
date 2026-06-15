import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ClippySpriteProps {
  mood: 'happy' | 'sad' | 'dizzy' | 'sleeping' | 'eating' | 'sick' | 'talking';
  talkingVolume?: number; // 0.0 - 1.0 (for mouthsync)
  skinColor?: { id: string; color: string; strokeColor: string; glow?: boolean };
  activeAccessory?: { hat?: string; glasses?: string; neck?: string };
  idleAnimation?: 'none' | 'spring' | 'tap-screen' | 'airplane';
  speechBubble?: string | null;
  onCloseSpeechBubble?: () => void;
  isClippyStatic?: boolean;
}

// Default skin definition
const defaultSkin = { id: 'chrome', color: '#c5c2df', strokeColor: '#737094', glow: false };

// Apply real-time hardware-accelerated CSS tinting to paint the Clippy PNG skin colors perfectly
const getSkinFilter = (skinId: string) => {
  switch (skinId) {
    case 'gold':
      return 'sepia(0.95) saturate(3.8) hue-rotate(5deg) brightness(1.05) contrast(1.1)';
    case 'neon':
      return 'brightness(1.1) saturate(5.5) hue-rotate(85deg) contrast(1.15) drop-shadow(0px 0px 8px rgba(34,197,94,0.6))';
    case 'bubblegum':
      return 'sepia(0.7) saturate(3.8) hue-rotate(280deg) brightness(1.1) contrast(1.05)';
    case 'onyx':
      return 'grayscale(1) brightness(0.65) contrast(1.35)';
    case 'chrome':
    default:
      return 'none';
  }
};

// Get custom glossy gradient colors depending on skin state
const getGradientStops = (skinId: string) => {
  switch (skinId) {
    case 'gold':
      return {
        highlight: '#fffbeb',
        mid: '#fef08a',
        base: '#fbbf24',
        shadow: '#b45309',
      };
    case 'neon':
      return {
        highlight: '#f0fdf4',
        mid: '#86efac',
        base: '#22c55e',
        shadow: '#15803d',
      };
    case 'bubblegum':
      return {
        highlight: '#fdf2f8',
        mid: '#fbcfe8',
        base: '#f472b6',
        shadow: '#db2777',
      };
    case 'onyx':
      return {
        highlight: '#94a3b8',
        mid: '#475569',
        base: '#334155',
        shadow: '#0f172a',
      };
    case 'chrome':
    default:
      return {
        highlight: '#ffffff',
        mid: '#e4e4ed',
        base: '#c5c2df',
        shadow: '#737094',
      };
  }
};

// Dynamic eyebrow coordinates to morph and tilt organically on state changes
const getEyebrowPaths = (mood: string) => {
  if (mood === 'sad' || mood === 'sick') {
    // Worried, tilted inwards, eyebrows raised on the outer corners
    return {
      left: "M 58,84 Q 76,92 92,102 Q 76,84 58,84",
      right: "M 102,102 Q 118,92 136,84 Q 118,84 102,102",
    };
  }
  if (mood === 'sleeping') {
    // 平, relaxed and horizontal eyebrows
    return {
      left: "M 56,94 Q 76,88 94,94 Q 76,83 56,94",
      right: "M 100,106 Q 120,100 138,106 Q 120,95 100,106",
    };
  }
  if (mood === 'dizzy') {
    // Crooked, asymmetric and confused eyebrows
    return {
      left: "M 55,80 Q 72,83 88,96 Q 71,75 55,80",
      right: "M 100,104 Q 118,88 136,82 Q 118,80 100,104",
    };
  }
  if (mood === 'eating' || mood === 'talking') {
    // Inquisitive, excited, arched high upward
    return {
      left: "M 54,76 Q 76,46 95,76 Q 76,40 54,76",
      right: "M 99,86 Q 120,58 139,86 Q 120,52 99,86",
    };
  }
  // Default: Classic MS Office Clippy eyebrows (Left cocked high, right lower, curious)
  return {
    left: "M 54,84 Q 76,56 94,84 Q 76,48 54,84",
    right: "M 100,98 Q 120,74 138,98 Q 120,68 100,98",
  };
};

export const ClippySprite: React.FC<ClippySpriteProps> = ({
  mood,
  talkingVolume = 0,
  skinColor = defaultSkin,
  activeAccessory = {} as { hat?: string; glasses?: string; neck?: string },
  idleAnimation = 'none',
  speechBubble = null,
  onCloseSpeechBubble,
  isClippyStatic = false,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Periodic blinking simulation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (mood !== 'sleeping') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, [mood]);

  // Mouse tracking to guide eye gaze
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || mood === 'sleeping' || mood === 'dizzy') return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const limit = 5.5;
      if (distance === 0) {
        setMousePos({ x: 0, y: 0 });
      } else {
        setMousePos({
          x: (dx / distance) * Math.min(distance / 18, limit),
          y: (dy / distance) * Math.min(distance / 18, limit),
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mood]);

  // Render cosmetic hats on Clippy's highest bend point (around X=92, Y=55)
  const renderHat = () => {
    switch (activeAccessory.hat) {
      case 'party_hat':
        return (
          <g transform="translate(62, -32)" className="drop-shadow-sm select-none">
            {/* Colorful Triangle Party Hat */}
            <path d="M 30,10 L 5,80 L 55,80 Z" fill="#eb4899" stroke="#000" strokeWidth="3" />
            <circle cx="30" cy="10" r="6" fill="#facc15" stroke="#000" strokeWidth="2.5" />
            <circle cx="20" cy="45" r="3.5" fill="#3b82f6" />
            <circle cx="40" cy="55" r="4.5" fill="#10b981" />
            <circle cx="28" cy="65" r="3.5" fill="#f59e0b" />
          </g>
        );
      case 'detective_hat':
        return (
          <g transform="translate(52, -22)" className="drop-shadow-sm select-none">
            {/* Detective brown hat */}
            <ellipse cx="40" cy="65" rx="35" ry="10" fill="#78350f" stroke="#000" strokeWidth="3" />
            <path d="M 15,64 L 18,25 C 20,15, 60,15, 62,25 L 65,64 Z" fill="#78350f" stroke="#000" strokeWidth="3" />
            <path d="M 16,52 Q 40,54 64,52 L 63,59 Q 40,61 17,59 Z" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
          </g>
        );
      case 'top_hat':
        return (
          <g transform="translate(50, -32)" className="drop-shadow-md select-none">
            {/* High top hat */}
            <ellipse cx="42" cy="74" rx="36" ry="8" fill="#1e293b" stroke="#000" strokeWidth="3" />
            <rect x="20" y="16" width="44" height="52" rx="2" fill="#111827" stroke="#000" strokeWidth="3" />
            <rect x="20" y="58" width="44" height="10" fill="#dc2626" stroke="#000" strokeWidth="1.5" />
          </g>
        );
      case 'crown':
        return (
          <g transform="translate(56, -34)" className="drop-shadow-md select-none">
            {/* Golden Crown */}
            <path d="M 10,75 L 10,35 L 25,55 L 40,30 L 55,55 L 70,35 L 70,75 Z" fill="#fbbf24" stroke="#000" strokeWidth="3.2" strokeLinejoin="round" />
            <circle cx="10" cy="35" r="3.5" fill="#ef4444" stroke="#000" strokeWidth="1.5" />
            <circle cx="40" cy="30" r="3.5" fill="#3b82f6" stroke="#000" strokeWidth="1.5" />
            <circle cx="70" cy="35" r="3.5" fill="#10b981" stroke="#000" strokeWidth="1.5" />
            <circle cx="40" cy="63" r="4.5" fill="#ec4899" stroke="#000" strokeWidth="1" />
          </g>
        );
      default:
        return null;
    }
  };

  // Render cosmetic glasses aligned with Left Eye (78, 110) & Right Eye (118, 120)
  const renderGlasses = () => {
    switch (activeAccessory.glasses) {
      case 'deal_with_it':
        return (
          <g transform="translate(46, 105)" className="drop-shadow-md select-none">
            {/* Pixel sunglasses */}
            <path d="M 5,0 L 32,0 L 32,15 L 24,15 L 24,8 L 13,8 L 13,15 L 5,15 Z" fill="#000000" />
            <path d="M 37,0 L 64,0 L 64,15 L 56,15 L 56,8 L 45,8 L 45,15 L 37,15 Z" fill="#000000" />
            <rect x="31" y="2" width="7" height="4" fill="#000000" />
            <rect x="7" y="3" width="4" height="4" fill="#ffffff" />
            <rect x="39" y="3" width="4" height="4" fill="#ffffff" />
          </g>
        );
      case 'nerdy_glasses':
        return (
          <g transform="translate(58, 94)" className="select-none">
            {/* Round thick frames */}
            <circle cx="20" cy="18" r="16" fill="none" stroke="#dc2626" strokeWidth="4" />
            <circle cx="56" cy="18" r="16" fill="none" stroke="#dc2626" strokeWidth="4" />
            <path d="M 36,18 L 40,18" stroke="#dc2626" strokeWidth="5.5" />
            <path d="M 4,18 L -3,15" stroke="#dc2626" strokeWidth="3" />
            <path d="M 72,18 L 79,15" stroke="#dc2626" strokeWidth="3" />
            <path d="M 12,10 A 8,8 0 0,1 24,14" stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M 48,10 A 8,8 0 0,1 60,14" stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'monocle':
        return (
          <g transform="translate(64, 98)" className="select-none">
            {/* Monocle on right eye */}
            <circle cx="54" cy="18" r="15" fill="none" stroke="#ca8a04" strokeWidth="4" />
            <path d="M 69,18 L 92,52" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 46,10 A 8,8 0 0,1 58,14" stroke="#ffffff" strokeWidth="2" fill="none" />
          </g>
        );
      default:
        return null;
    }
  };

  // Render neck wearable aligned with lower wire bend body (X=102, Y=180)
  const renderNeck = () => {
    switch (activeAccessory.neck) {
      case 'bowtie':
        return (
          <g transform="translate(102, 184)" className="drop-shadow-sm select-none">
            {/* Bowtie */}
            <path d="M -18,-9 L 18,9 L 18,-9 L -18,9 Z" fill="#ef4444" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="0" cy="0" r="5" fill="#b91c1c" stroke="#000" strokeWidth="2" />
          </g>
        );
      case 'gold_chain':
        return (
          <g transform="translate(102, 178)" className="drop-shadow-md select-none">
            {/* Gold Chain */}
            <path d="M -22,-6 Q 0,22 22,-6 Q 20,24 -20,24 Z" fill="#eab308" stroke="#000" strokeWidth="2.8" />
            <g transform="translate(0, 15)">
              <circle cx="0" cy="5" r="10" fill="#eab308" stroke="#000" strokeWidth="2" />
              <text x="0" y="9" fill="#854d0e" fontSize="11" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">$</text>
            </g>
          </g>
        );
      default:
        return null;
    }
  };

  // Mouth renders ONLY when eating or talking to match aesthetic fidelity
  const getMouthPath = () => {
    if (mood === 'sleeping' || mood === 'happy') {
      // Invisible smiling anchor to honor authentic mouth-less Clippy
      return 'M 98,145 Q 98,145 98,145';
    }
    if (mood === 'eating') {
      // Rounded eating mouth
      return 'M 92,138 Q 98,154 104,138 Q 98,142 92,138';
    }
    if (mood === 'talking') {
      const openHeight = 2 + talkingVolume * 15;
      return `M 92,142 Q 98,${142 + openHeight} 104,142 Q 98,${142 - openHeight / 4} 92,142`;
    }
    if (mood === 'sick' || mood === 'sad') {
      // Sad small frown curve
      return 'M 92,148 Q 98,140 104,148';
    }
    if (mood === 'dizzy') {
      // Wavy squiggle line
      return 'M 92,144 Q 95,140 98,144 Q 101,148 104,144';
    }
    return 'M 98,145 Q 98,145 98,145';
  };

  const stops = getGradientStops(skinColor?.id || 'chrome');
  const eyebrows = getEyebrowPaths(mood);

  const isAirplaneMode = idleAnimation === 'airplane' && !isClippyStatic;

  // Dynamic Framer Motion values for the outer container based on active idleAnimation
  const getContainerAnimate = () => {
    if (isClippyStatic) return undefined;
    if (idleAnimation === 'spring') {
      return {
        scaleY: [1, 0.4, 1.35, 0.85, 1.1, 1],
        scaleX: [1, 1.45, 0.7, 1.15, 0.95, 1],
        y: [0, 20, -60, 0, -10, 0],
        rotate: [0, 0, 180, 360, 360, 360],
      };
    }
    if (idleAnimation === 'tap-screen') {
      return {
        scale: [1.1, 1.25, 1.15, 1.25, 1.15, 1.1],
        x: [0, 5, -8, 5, -8, 0],
        rotate: [0, -3, 3, -3, 3, 0],
      };
    }
    return undefined;
  };

  const getContainerTransition = () => {
    if (isClippyStatic) return undefined;
    if (idleAnimation === 'spring') {
      return { duration: 1.8, ease: "easeInOut" };
    }
    if (idleAnimation === 'tap-screen') {
      return { duration: 1.5, ease: "easeOut" };
    }
    return undefined;
  };

  return (
    <motion.div
      ref={containerRef}
      id="clippy-container"
      className="relative flex items-center justify-center w-68 h-84 sm:w-76 sm:h-92 scale-105 sm:scale-110 hover:scale-[1.08] sm:hover:scale-[1.12] transition-transform duration-300 select-none cursor-pointer"
      animate={getContainerAnimate() as any}
      transition={getContainerTransition() as any}
    >
      {/* Yellow retro Speech Bubble styled after Microsoft Clippy's balloon */}
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-50 w-56 sm:w-60 bg-[#ffffca] border-2 border-black p-2.5 rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,1)] text-black select-none pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[12px] leading-tight font-sans font-bold pr-4 text-left">
              {speechBubble}
            </p>
            
            {/* Tiny retro Close box */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCloseSpeechBubble) onCloseSpeechBubble();
              }}
              className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] font-black border border-black bg-white hover:bg-gray-100 active:translate-y-0.5 rounded flex items-center justify-center"
            >
              ✕
            </button>

            {/* Bubble Speech Arrow Tail */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-black" />
            <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-[#ffffca]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light glow highlight if activated for Neon skin */}
      {skinColor?.glow && (
        <div
          className="absolute inset-x-8 inset-y-12 rounded-full blur-3xl opacity-40 animate-pulse"
          style={{ backgroundColor: skinColor.color }}
        />
      )}      {/* Main Vector SVG Asset representing 3D Paperclip */}
      <svg
        id="clippy-svg"
        viewBox="0 0 200 240"
        className="w-full h-full drop-shadow-xl overflow-visible"
      >
        <defs>
          <linearGradient id="paperclipMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stops.highlight} />
            <stop offset="25%" stopColor={stops.mid} />
            <stop offset="65%" stopColor={stops.base} />
            <stop offset="100%" stopColor={stops.shadow} />
          </linearGradient>

          <radialGradient id="eyeGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#f8f9fc" />
            <stop offset="100%" stopColor="#cfd2df" />
          </radialGradient>
        </defs>

        {isAirplaneMode ? (
          <g id="clippy-paper-airplane">
            {/* Outline path representing folded paper assistant airplane */}
            <motion.path
              d="M 150,50 L 30,130 L 100,145 L 120,185 L 130,155 L 175,75 Z"
              fill="#ffffdd"
              stroke="#000000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                x: [-120, 40, -60, 80, 0],
                y: [80, -40, -20, 30, 0],
                rotate: [0, 360, 540, 720, 1080],
                scale: [0.6, 1.3, 0.8, 1.2, 1],
              }}
              transition={{ duration: 4.2, ease: "easeInOut" }}
            />
            {/* Inner wing crease representing retro paper folding guide lines */}
            <motion.path
              d="M 100,145 L 150,50 L 130,155"
              fill="none"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                x: [-120, 40, -60, 80, 0],
                y: [80, -40, -20, 30, 0],
                rotate: [0, 360, 540, 720, 1080],
                scale: [0.6, 1.3, 0.8, 1.2, 1],
              }}
              transition={{ duration: 4.2, ease: "easeInOut" }}
            />
          </g>
        ) : (
          <>
            {/* --- Neck wearables rendered behind the face elements --- */}
            {renderNeck()}

            {/* --- 3-Layered 3D Paperclip loops geometry slanted at -6 degrees --- */}
        <g id="paperclip-loops" transform="rotate(-6, 100, 130)">
          {/* Layer 1: Solid thick black outline shadow */}
          <path
            d="M 112,105 L 112,180 A 12,12 0 0,1 88,180 L 88,90 A 24,24 0 0,1 136,90 L 136,210 A 36,36 0 0,1 64,210 L 64,55 A 28,28 0 0,1 120,55 L 120,105"
            fill="none"
            stroke="#000000"
            strokeWidth="19.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Layer 2: Glossy premium metallic color gradient */}
          <path
            d="M 112,105 L 112,180 A 12,12 0 0,1 88,180 L 88,90 A 24,24 0 0,1 136,90 L 136,210 A 36,36 0 0,1 64,210 L 64,55 A 28,28 0 0,1 120,55 L 120,105"
            fill="none"
            stroke="url(#paperclipMetal)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />

          {/* Layer 3: Central specular lighting reflection streak */}
          <path
            d="M 112,105 L 112,180 A 12,12 0 0,1 88,180 L 88,90 A 24,24 0 0,1 136,90 L 136,210 A 36,36 0 0,1 64,210 L 64,55 A 28,28 0 0,1 120,55 L 120,105"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.48"
          />
        </g>

        {/* --- Bulging overlapping white eyeballs with thick borders as seen in office helper --- */}
        <g id="clippy-bulging-eyes">
          {mood === 'sleeping' ? (
            // Curved sleeping eyelids
            <>
              <path d="M 58,110 Q 78,125 94,110" fill="none" stroke="#000000" strokeWidth="6.2" strokeLinecap="round" />
              <path d="M 102,120 Q 118,135 134,120" fill="none" stroke="#000000" strokeWidth="6.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Right eye (rendered first to be in background) */}
              <ellipse
                cx="118"
                cy="120"
                rx="23"
                ry={isBlinking ? "1" : "21"}
                fill="url(#eyeGradient)"
                stroke="#000000"
                strokeWidth="4.8"
                className="transition-all duration-100"
              />

              {/* Left eye (overlaps right eye slightly for that friendly 2.5D look) */}
              <ellipse
                cx="78"
                cy="110"
                rx="23"
                ry={isBlinking ? "1" : "21"}
                fill="url(#eyeGradient)"
                stroke="#000000"
                strokeWidth="4.8"
                className="transition-all duration-100"
              />

              {/* Gaze-ready dynamic pupils */}
              {!isBlinking && (
                mood === 'dizzy' ? (
                  <g transform="translate(98, 115)">
                    {/* Retro spinning spiral eyes for dizzy mode */}
                    <path d="M -15,-5 Q -20,5 -10,10 Q 0,10 -5,0" fill="none" stroke="#000000" strokeWidth="3.5" />
                    <path d="M 18,3 Q 13,13 23,18 Q 33,18 28,8" fill="none" stroke="#000000" strokeWidth="3.5" />
                  </g>
                ) : (
                  <>
                    {/* Left pupil */}
                    <motion.ellipse
                      cx="78"
                      cy="110"
                      rx="9.5"
                      ry="9.5"
                      fill="#000000"
                      animate={{
                        x: mousePos.x,
                        y: mousePos.y,
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                    />
                    {/* Left pupil speculative reflection glint */}
                    <motion.circle
                      cx="75.5"
                      cy="107.5"
                      r="3"
                      fill="#ffffff"
                      animate={{
                        x: mousePos.x,
                        y: mousePos.y,
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                    />

                    {/* Right pupil */}
                    <motion.ellipse
                      cx="118"
                      cy="120"
                      rx="9.5"
                      ry="9.5"
                      fill="#000000"
                      animate={{
                        x: mousePos.x,
                        y: mousePos.y,
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                    />
                    {/* Right pupil speculative reflection glint */}
                    <motion.circle
                      cx="115.5"
                      cy="117.5"
                      r="3"
                      fill="#ffffff"
                      animate={{
                        x: mousePos.x,
                        y: mousePos.y,
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                    />
                  </>
                )
              )}
            </>
          )}
        </g>

        {/* --- Highly expressive morphing eyebrows (The core of Clippy's soul) --- */}
        <g id="clippy-expressive-eyebrows">
          {/* Left Eyebrow */}
          <motion.path
            d={eyebrows.left}
            fill="#111827"
            stroke="#111827"
            strokeWidth="0.8"
            animate={{ d: eyebrows.left }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          />
          {/* Right Eyebrow */}
          <motion.path
            d={eyebrows.right}
            fill="#111827"
            stroke="#111827"
            strokeWidth="0.8"
            animate={{ d: eyebrows.right }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          />
        </g>

        {/* --- Cute rose cheeks when feeling happy --- */}
        {mood === 'happy' && (
          <g id="clippy-rose-cheeks" className="opacity-35" pointerEvents="none">
            <ellipse cx="52" cy="122" rx="9" ry="5.5" fill="#f43f5e" />
            <ellipse cx="140" cy="132" rx="9" ry="5.5" fill="#f43f5e" />
          </g>
        )}

        {/* --- Interactive mouth overlay for feeding/talking --- */}
        <motion.path
          id="clippy-mouth"
          d={getMouthPath()}
          fill={mood === 'eating' || mood === 'talking' ? '#881337' : 'none'}
          stroke="#000000"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ d: getMouthPath() }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        />

            {/* --- Top accessories overlay render on top layer --- */}
            {renderGlasses()}
            {renderHat()}
          </>
        )}
      </svg>

      {/* States visual graphic emoticons */}
      <AnimatePresence>
        {mood === 'sick' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1/4 left-1/4 text-3xl select-none" style={{ filter: 'drop-shadow(2px 2px 0px #000)' }}>🤢</motion.span>
        )}
        {mood === 'sad' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1/4 right-1/4 text-3xl select-none" style={{ filter: 'drop-shadow(2px 2px 0px #000)' }}>😢</motion.span>
        )}
        {mood === 'sleeping' && (
          <div className="absolute top-6 right-6 flex flex-col gap-1 items-start text-indigo-400 font-bold select-none drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <motion.span animate={{ y: [-15, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0 }} className="text-2xl font-mono">Z</motion.span>
            <motion.span animate={{ y: [-15, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.7 }} className="text-xl font-mono pl-3">z</motion.span>
            <motion.span animate={{ y: [-15, 0], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 1.4 }} className="text-base font-mono pl-6">z</motion.span>
          </div>
        )}
        {mood === 'dizzy' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 animate-spin select-none">
            <span className="text-2xl">💫</span>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
