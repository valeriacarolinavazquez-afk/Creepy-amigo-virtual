import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Item } from '../types';
import { playSound } from '../utils/audio';

interface LabRoomProps {
  coins: number;
  dirt: number;
  inventory: Record<string, number>;
  onBuyItem: (item: Item) => void;
  onUseItem: (item: Item) => void;
  onWash: () => void;
}

export const LAB_ITEMS: Item[] = [
  {
    id: 'rust_potion',
    name: 'Poción Anti-Óxido',
    description: 'Rápida remoción de manchas de óxido difíciles.',
    price: 12,
    effect: { health: 25, dirt: -40 },
    icon: '🧪',
    category: 'potion',
  },
  {
    id: 'health_pill',
    name: 'Pastilla Vitamínica',
    description: 'Suplemento de zinc y níquel para vigor universal.',
    price: 18,
    effect: { health: 50 },
    icon: '💊',
    category: 'potion',
  },
];

export const LabRoom: React.FC<LabRoomProps> = ({
  coins,
  dirt,
  inventory,
  onBuyItem,
  onUseItem,
  onWash,
}) => {
  const [isWashingMode, setIsWashingMode] = useState(false);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleSoapClick = () => {
    playSound('tap');
    setIsWashingMode(!isWashingMode);
  };

  const handleWashInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isWashingMode) return;

    // Trigger wash activity
    playSound('wash');
    onWash();

    // Spawn a bubble particle at mouse click coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newBubble = { id: Date.now() + Math.random(), x, y };
    setBubbles((prev) => [...prev, newBubble].slice(-15)); // Keep last 15 bubbles

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 850);
  };

  const handleUsePotion = (item: Item) => {
    if ((inventory[item.id] || 0) <= 0) {
      playSound('hurt');
      return;
    }
    playSound('heal');
    onUseItem(item);
  };

  return (
    <div
      id="lab-room"
      className="flex flex-col items-center w-full h-full p-2 relative"
    >
      <div className="text-center mb-3">
        <h3 className="font-sans font-bold text-sm text-slate-800">🔬 Sanar.dll</h3>
        <p className="text-[10px] text-slate-500 font-sans mt-0.5">Saca brillo con jabón y combate la corrosión de Clippy</p>
      </div>

      {/* Bubble click canvas covering the Clippy interactable area */}
      {isWashingMode && (
        <div
          id="clippy-wash-canvas"
          onClick={handleWashInteraction}
          onMouseMove={(e) => {
            // Scrubbing trigger (1 out of every 6 occurrences to prevent lag)
            if (e.buttons === 1 && Math.random() < 0.18) {
              handleWashInteraction(e);
            }
          }}
          className="absolute inset-x-2 top-14 bottom-48 bg-transparent z-40 cursor-grab active:cursor-grabbing border-2 border-dashed border-sky-400/60"
          title="¡Haz clic o arrastra sobre Clippy para limpiarlo con el jabón de oficina!"
        >
          <div className="absolute inset-x-2 top-2 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[10px] uppercase font-sans font-bold bg-[#245dd7] text-white px-2.5 py-0.5 rounded shadow">
              🧼 MODO LAVADO: Arrastra sobre Clippy para limpiar
            </span>
          </div>

          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.div
                key={b.id}
                className="absolute w-5 h-5 rounded-full bg-sky-200/50 border border-sky-300 pointer-events-none flex items-center justify-center"
                style={{ left: b.x - 10, top: b.y - 10 }}
                initial={{ scale: 0.2, y: 0, opacity: 0.8 }}
                animate={{
                  scale: [0.2, 1.4, 0.8],
                  y: -60,
                  x: (Math.random() - 0.5) * 40,
                  opacity: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                💧
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lab Actions & Potion Cabinet Group Box */}
      <div className="w-full max-w-sm relative border border-slate-400 mt-2 p-3 bg-[#ece9d8] rounded-[3px] shadow-sm z-10">
        <span className="absolute -top-2.5 left-3 bg-[#ece9d8] px-1 text-[11px] font-sans font-bold text-slate-700">
          Kit de Mantenimiento (Control)
        </span>

        {/* Soap Button */}
        <button
          onClick={handleSoapClick}
          className={`w-full flex items-center justify-center gap-1.5 xp-btn text-[11px] py-1.5 mb-3 ${
            isWashingMode ? 'xp-btn-blue' : ''
          }`}
        >
          <span>🧼</span> {isWashingMode ? 'Desactivar Esponja' : 'Pintar con Esponja de Oficina'}
        </button>

        <p className="text-[10px] uppercase font-bold text-slate-600 mb-2 font-mono">
          Gabinete Médico: {dirt > 50 ? '🤢 Oxidado' : dirt > 15 ? '🧹 Sucio' : '✨ Reluciente'}
        </p>

        <div className="flex flex-col gap-1.5">
          {LAB_ITEMS.map((item) => {
            const count = inventory[item.id] || 0;
            return (
              <div
                key={item.id}
                id={`lab-item-${item.id}`}
                className="flex items-center justify-between bg-[#f0eee0] border border-[#b5b2a3] p-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-1 leading-none">
                      <p className="text-[11px] font-sans font-bold text-slate-800 leading-none">{item.name}</p>
                      <span className="xp-border-inset bg-white px-1 py-0.2 text-[8px] font-mono leading-none font-bold">
                        x{count}
                      </span>
                    </div>
                    <p className="text-[8px] text-slate-500 font-sans leading-none mt-1 h-3 overflow-hidden">{item.description}</p>
                    <p className="text-[8px] text-[#157900] font-sans leading-none mt-0.5">
                      💚 Salud: +{item.effect.health} {item.effect.dirt && `| 🧼 Limpieza: ${-item.effect.dirt}`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 ml-2">
                  {/* Buy potion */}
                  <button
                    onClick={() => onBuyItem(item)}
                    className="xp-btn text-[9px] px-1.5 py-0.5"
                  >
                    🪙 {item.price}
                  </button>

                  {/* Apply potion */}
                  <button
                    onClick={() => handleUsePotion(item)}
                    disabled={count <= 0}
                    className={`xp-btn xp-btn-blue text-[9px] px-2 py-0.5 ${count <= 0 ? 'opacity-40' : ''}`}
                  >
                    Usar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
