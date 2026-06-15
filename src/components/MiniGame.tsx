import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';

interface MiniGameProps {
  onGameComplete: (coinsEarned: number, funGained: number, xpGained: number) => void;
}

interface FallingObject {
  id: number;
  x: number; // percentage 0 - 100
  y: number; // pixels from top
  type: 'paper' | 'floppy' | 'coin' | 'magnet';
  speed: number;
  size: number;
}

export const MiniGame: React.FC<MiniGameProps> = ({ onGameComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [lives, setLives] = useState(3);
  const [clippyX, setClippyX] = useState(50); // percentage 0 - 100
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<any>(null);
  const nextObjectIdRef = useRef(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setClippyX((prev) => Math.max(5, prev - 8));
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setClippyX((prev) => Math.min(95, prev + 8));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const startGame = () => {
    playSound('tap');
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCoinsCollected(0);
    setLives(3);
    setClippyX(50);
    setObjects([]);
    nextObjectIdRef.current = 0;
  };

  // Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    let spawnCountdown = 0;

    const gameLoop = () => {
      // Spawn items
      spawnCountdown -= 16.67; // approx ms per frame
      if (spawnCountdown <= 0) {
        const types: ('paper' | 'floppy' | 'coin' | 'magnet')[] = ['paper', 'paper', 'floppy', 'coin', 'magnet'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const speed = 2.5 + Math.random() * 3.5 + score * 0.05; // accelerates slowly over score

        const newObj: FallingObject = {
          id: nextObjectIdRef.current++,
          x: 10 + Math.random() * 80, // %
          y: -20,
          type: randomType,
          speed,
          size: randomType === 'magnet' ? 40 : 32,
        };

        setObjects((prev) => [...prev, newObj]);
        spawnCountdown = Math.max(400, 1200 - score * 10); // speeds up spawns
      }

      // Move items and check collisions
      setObjects((prevObjects) => {
        const updated: FallingObject[] = [];

        prevObjects.forEach((obj) => {
          const nextY = obj.y + obj.speed;

          // Check boundary out of screen
          if (nextY > 300) {
            // Magnet goes off the screen safely
            if (obj.type !== 'magnet') {
              // Missed a paper or coin, no penalty but gone
            }
            return;
          }

          // Check collision with Clippy at y values close to the bottom (78% to 92% of the 300px area)
          const isAtBottomHeight = nextY >= 235 && nextY <= 270;
          const isWithinClippyX = Math.abs(obj.x - clippyX) < 11; // collision X percentage range

          if (isAtBottomHeight && isWithinClippyX) {
            // Collision detected!
            if (obj.type === 'magnet') {
              playSound('hurt');
              setLives((l) => {
                const updatedLives = l - 1;
                if (updatedLives <= 0) {
                  endTheGame();
                }
                return updatedLives;
              });
            } else {
              playSound('coin');
              if (obj.type === 'coin') {
                setCoinsCollected((c) => c + 5);
                setScore((s) => s + 50);
              } else if (obj.type === 'floppy') {
                setCoinsCollected((c) => c + 2);
                setScore((s) => s + 30);
              } else {
                setCoinsCollected((c) => c + 1);
                setScore((s) => s + 10);
              }
            }
            return; // delete object
          }

          updated.push({ ...obj, y: nextY });
        });

        return updated;
      });

      loopRef.current = requestAnimationFrame(gameLoop);
    };

    loopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
    };
  }, [isPlaying, clippyX, score]);

  const endTheGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    playSound('win');

    // Fun gained is based on score (cap at 35)
    const funGained = Math.min(35, Math.ceil(score / 15));
    // XP gained is score divided by 10 (cap at 40)
    const xpGained = Math.min(45, Math.ceil(score / 8) + 10);

    onGameComplete(coinsCollected, funGained, xpGained);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return '📄';
      case 'floppy':
        return '💾';
      case 'coin':
        return '🪙';
      case 'magnet':
        return '🧲';
      default:
        return '📦';
    }
  };

  return (
    <div
      ref={gameAreaRef}
      id="arcade-game"
      className="w-full max-w-sm xp-border-inset bg-black aspect-[4/3] relative overflow-hidden flex flex-col justify-between shadow-inner"
    >
      {/* HUD Top bar */}
      <div className="absolute top-0 inset-x-0 bg-[#0054e3] flex items-center justify-between px-3 py-1.5 z-30 text-white text-[11px] font-sans font-bold select-none border-b border-[#002e9c]">
        <div className="flex gap-1 items-center">
          <span className="text-[10px] uppercase mr-1">Vidas:</span>
          {[...Array(3)].map((_, idx) => (
            <span
              key={idx}
              className={`transition-all ${idx < lives ? 'text-red-400 scale-100' : 'text-slate-500 scale-75'}`}
            >
              ❤️
            </span>
          ))}
        </div>
        <div className="flex gap-3 font-mono text-[10px]">
          <span>SCORE: <b className="text-yellow-300">{score}</b></span>
          <span>🪙 +{coinsCollected}</span>
        </div>
      </div>

      {/* Screens layout builder */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 z-40 bg-[#ece9d8]/95 flex flex-col items-center justify-center p-4 text-center select-none text-slate-800">
          <span className="text-3xl animate-bounce mb-1">🕹️</span>
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-[#245dd7] pb-0.5 mb-2">
            ATRAPA_DOCS.EXE
          </h4>
          <p className="text-[10px] text-slate-600 font-sans max-w-xs leading-tight mb-3">
            Atrapa archivos de papelería que caen y monedas para Clippy. <b>¡Cuidado con los imanes destructivos!</b>
          </p>

          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-800 max-w-xs text-left mb-4 bg-white border border-[#b5b2a3] p-1.5 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)]">
            <span className="flex items-center gap-1">📄 Papel (+10)</span>
            <span className="flex items-center gap-1">💾 Discos (+30)</span>
            <span className="flex items-center gap-1">🪙 Moneda (+50)</span>
            <span className="flex items-center gap-1 font-bold text-red-600">🧲 Imán (-1 Vida)</span>
          </div>

          <button
            onClick={startGame}
            className="xp-btn xp-btn-blue text-[11px] py-1 px-5"
          >
            Iniciar Partida
          </button>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-[#ece9d8]/95 flex flex-col items-center justify-center p-4 text-center select-none text-slate-800">
          <span className="text-3xl mb-1">🏆</span>
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-red-600 pb-0.5 mb-2">
            SISTEMA DETENIDO
          </h4>
          <p className="text-[10px] text-slate-600 font-sans mb-3">
            ¡Has salvado los documentos del escritorio!
          </p>

          <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-800 w-40 bg-white border border-[#b5b2a3] p-2 mb-4 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between">
              <span>PUNTUACION:</span>
              <span className="text-blue-700 font-bold">{score}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
              <span>MONEDAS:</span>
              <span className="text-green-700 font-bold">+{coinsCollected}</span>
            </div>
            <div className="flex justify-between">
              <span>XP GANADA:</span>
              <span className="text-purple-700 font-bold">+{Math.min(45, Math.ceil(score / 8) + 10)}</span>
            </div>
          </div>

          <button
            onClick={startGame}
            className="xp-btn xp-btn-blue text-[11px] py-1 px-5"
          >
            Jugar de Nuevo
          </button>
        </div>
      )}

      {/* Playing Canvas */}
      <div id="playing-stage" className="relative flex-1 bg-gradient-to-b from-indigo-950 to-slate-900">
        {/* Dynamic stars on arcade backdrop */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/0 to-transparent pointer-events-none" />

        {/* Falling objects */}
        {objects.map((obj) => (
          <div
            key={obj.id}
            className="absolute select-none pointer-events-none z-10 text-2xl transition-all"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}px`,
              transform: 'translateX(-50%)',
              width: obj.size,
              height: obj.size,
            }}
          >
            {getIcon(obj.type)}
          </div>
        ))}

        {/* Player (Simple Clippy graphic representing position) */}
        <div
          id="arcade-clippy-player"
          className="absolute bottom-2 h-14 w-12 flex items-center justify-center transition-all duration-75 z-20"
          style={{
            left: `${clippyX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* A mini-character render or office supply */}
          <svg viewBox="0 0 100 120" className="w-full h-full filter drop-shadow-md overflow-visible">
            <path
              d="M 50,110 L 50,55 A 15,15 0 0,0 20,55 L 20,95 A 25,25 0 0,0 70,95 L 70,40 A 35,35 0 0,0 0,40 L 0,100"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Big eyes looking UP at the sky! */}
            <circle cx="35" cy="40" r="10" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="35" cy="35" r="4.5" fill="#0f172a" />
            <circle cx="55" cy="40" r="10" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="55" cy="35" r="4.5" fill="#0f172a" />
            {/* Open mouth catching items! */}
            <circle cx="45" cy="58" r="6.5" fill="#dc2626" />
          </svg>
        </div>
      </div>

      {/* Screen Buttons for Mobile/Iframe Click input */}
      {isPlaying && (
        <div className="flex w-full bg-slate-950 py-1.5 border-t border-slate-800 z-30 select-none">
          <button
            onTouchStart={() => setClippyX((x) => Math.max(5, x - 12))}
            onClick={() => setClippyX((x) => Math.max(5, x - 12))}
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-3 text-lg active:bg-slate-800 transition-colors cursor-pointer select-none"
          >
            ◀ Izquierda
          </button>
          <div className="w-px bg-slate-800" />
          <button
            onTouchStart={() => setClippyX((x) => Math.min(95, x + 12))}
            onClick={() => setClippyX((x) => Math.min(95, x + 12))}
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold py-3 text-lg active:bg-slate-800 transition-colors cursor-pointer select-none"
          >
            Derecha ▶
          </button>
        </div>
      )}
    </div>
  );
};
