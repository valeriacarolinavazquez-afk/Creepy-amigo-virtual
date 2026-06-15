import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Item } from '../types';
import { playSound } from '../utils/audio';

interface KitchenRoomProps {
  coins: number;
  inventory: Record<string, number>;
  onFeed: (item: Item) => void;
  onBuyItem: (item: Item) => void;
  setMood: (mood: 'happy' | 'sad' | 'dizzy' | 'sleeping' | 'eating' | 'sick' | 'talking') => void;
}

export const FOOD_ITEMS: Item[] = [
  {
    id: 'paper_scraps',
    name: 'Papel Recortado',
    description: 'Bocadillo clásico de oficina. Suave y digestivo.',
    price: 4,
    effect: { hunger: 20, dirt: 5 },
    icon: '📄',
    category: 'food',
  },
  {
    id: 'grapas',
    name: 'Grapas de Acero',
    description: 'Aperitivo crujiente con alto contenido de hierro.',
    price: 10,
    effect: { hunger: 45, fun: 5 },
    icon: '📎',
    category: 'food',
  },
  {
    id: 'oil_wd40',
    name: 'Aceite WD-40',
    description: 'Bebida energética premium. Lubrica y combate el óxido.',
    price: 25,
    effect: { hunger: 80, health: 15, dirt: -20 },
    icon: '🛢️',
    category: 'food',
  },
  {
    id: 'screw',
    name: 'Tornillo Dulce',
    description: 'Caramelo duro con rosca fina.',
    price: 8,
    effect: { hunger: 30, health: 5 },
    icon: '🔩',
    category: 'food',
  },
];

export const KitchenRoom: React.FC<KitchenRoomProps> = ({
  coins,
  inventory,
  onFeed,
  onBuyItem,
  setMood,
}) => {
  const [flyingFood, setFlyingFood] = useState<{ id: number; icon: string } | null>(null);

  const handleFeed = (item: Item) => {
    if ((inventory[item.id] || 0) <= 0) {
      playSound('hurt');
      return;
    }

    // Trigger floating fly animation
    playSound('tap');
    const animId = Date.now();
    setFlyingFood({ id: animId, icon: item.icon });

    setTimeout(() => {
      // Feed after flight completes
      playSound('chew');
      setMood('eating');
      onFeed(item);
      setFlyingFood(null);

      // Revert mood to happy after eating finishes
      setTimeout(() => {
        setMood('happy');
      }, 1500);
    }, 700);
  };

  return (
    <div id="kitchen-room" className="flex flex-col items-center w-full h-full p-2 relative">
      {/* Absolute positioning for flying food animation */}
      <AnimatePresence>
        {flyingFood && (
          <motion.div
            key={flyingFood.id}
            className="absolute text-5xl z-50 pointer-events-none select-none"
            initial={{ x: -100, y: 150, scale: 1, rotate: 0 }}
            animate={{
              x: 0, // Target Clippy centered at 0 offset in horizontal room coordinate
              y: -50, // Height matching mouth
              scale: [1, 1.4, 0.4],
              rotate: 360,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {flyingFood.icon}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-3">
        <h3 className="font-sans font-bold text-sm text-slate-800">🍔 Cocina.exe</h3>
        <p className="text-[10px] text-slate-500 font-sans mt-0.5">Suministra papel de oficina para alimentar el clip</p>
      </div>

      {/* Pantry/Cupboard Group Box */}
      <div className="w-full max-w-md relative border border-slate-400 mt-2 p-3 bg-[#ece9d8] rounded-[3px] shadow-sm">
        <span className="absolute -top-2.5 left-3 bg-[#ece9d8] px-1 text-[11px] font-sans font-bold text-slate-700">
          Alacena de Oficina (Stock)
        </span>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {FOOD_ITEMS.map((item) => {
            const count = inventory[item.id] || 0;
            return (
              <div
                key={item.id}
                id={`food-item-${item.id}`}
                className="flex flex-col bg-[#f0eee0] border border-[#b5b2a3] p-2 relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl filter drop-shadow-xs">{item.icon}</span>
                  <span className="xp-border-inset bg-white px-1 py-0.5 text-[9px] font-mono font-bold text-slate-800">
                    S: {count}
                  </span>
                </div>

                <div className="mt-1">
                  <p className="text-[11px] font-sans font-bold text-slate-800 leading-tight">{item.name}</p>
                  <p className="text-[9px] text-slate-500 leading-tight h-5 overflow-hidden line-clamp-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-[#157900]">
                  <span>🍔 Hambre: +{item.effect.hunger}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 mt-2">
                  {/* Buy Button */}
                  <button
                    onClick={() => onBuyItem(item)}
                    className="flex-1 xp-btn text-[10px] py-0.5 font-bold flex items-center justify-center gap-0.5"
                  >
                    🪙 {item.price}
                  </button>

                  {/* Feed Button */}
                  <button
                    onClick={() => handleFeed(item)}
                    disabled={count <= 0}
                    className={`flex-1 xp-btn xp-btn-blue text-[10px] py-0.5 font-bold ${
                      count > 0 ? '' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    Servir
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
