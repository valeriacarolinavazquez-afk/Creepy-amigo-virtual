import React from 'react';
import { Skin } from '../types';
import { playSound } from '../utils/audio';

export const SKINS: Skin[] = [
  { id: 'chrome', name: 'Plata Chrome', price: 0, color: '#c5c2df', strokeColor: '#737094', unlocked: true },
  { id: 'gold', name: 'Oro Ejecutivo', price: 100, color: '#fbbf24', strokeColor: '#b45309', unlocked: false },
  { id: 'neon', name: 'Hacker Neón', price: 150, color: '#22c55e', strokeColor: '#15803d', unlocked: false, glow: true },
  { id: 'bubblegum', name: 'Pastel Chicle', price: 80, color: '#f472b6', strokeColor: '#db2777', unlocked: false },
  { id: 'onyx', name: 'Ónice Mate', price: 120, color: '#334155', strokeColor: '#0f172a', unlocked: false },
];

export interface ShopAccessory {
  id: string;
  name: string;
  price: number;
  type: 'hat' | 'glasses' | 'neck';
  icon: string;
}

export const ACCESSORIES: ShopAccessory[] = [
  { id: 'party_hat', name: 'Gorro de Fiesta', price: 40, type: 'hat', icon: '🥳' },
  { id: 'top_hat', name: 'Sombrero de Copa', price: 75, type: 'hat', icon: '🎩' },
  { id: 'crown', name: 'Corona Real', price: 150, type: 'hat', icon: '👑' },
  { id: 'deal_with_it', name: 'Gafas "MLG"', price: 60, type: 'glasses', icon: '🕶️' },
  { id: 'nerdy_glasses', name: 'Gafas de Pasta', price: 35, type: 'glasses', icon: '🤓' },
  { id: 'bowtie', name: 'Pajarita Roja', price: 30, type: 'neck', icon: '🎀' },
  { id: 'gold_chain', name: 'Cadena de Rapero', price: 120, type: 'neck', icon: '🪙' },
];

interface ShopProps {
  coins: number;
  unlockedSkins: string[]; // List of unlocked skin IDs
  unlockedAccessories: string[]; // List of unlocked accessory IDs
  activeSkinId: string;
  activeAccessories: { hat?: string; glasses?: string; neck?: string };
  onUnlockSkin: (skinId: string, price: number) => void;
  onEquipSkin: (skinId: string) => void;
  onUnlockAccessory: (accId: string, price: number) => void;
  onEquipAccessory: (accId: string, type: 'hat' | 'glasses' | 'neck') => void;
}

export const Shop: React.FC<ShopProps> = ({
  coins,
  unlockedSkins,
  unlockedAccessories,
  activeSkinId,
  activeAccessories,
  onUnlockSkin,
  onEquipSkin,
  onUnlockAccessory,
  onEquipAccessory,
}) => {

  const handleBuySkin = (skin: Skin) => {
    const isUnlocked = unlockedSkins.includes(skin.id);
    if (isUnlocked) {
      playSound('tap');
      onEquipSkin(skin.id);
      return;
    }

    if (coins < skin.price) {
      playSound('hurt');
      return;
    }

    playSound('coin');
    onUnlockSkin(skin.id, skin.price);
  };

  const handleBuyAccessory = (acc: ShopAccessory) => {
    const isUnlocked = unlockedAccessories.includes(acc.id);
    if (isUnlocked) {
      playSound('tap');
      onEquipAccessory(acc.id, acc.type);
      return;
    }

    if (coins < acc.price) {
      playSound('hurt');
      return;
    }

    playSound('coin');
    onUnlockAccessory(acc.id, acc.price);
  };

  return (
    <div id="shop" className="flex flex-col items-center w-full h-full p-2 overflow-y-auto">
      <div className="text-center mb-3">
        <h3 className="font-sans font-bold text-sm text-slate-800">🛍️ Tienda.lnk</h3>
        <p className="text-[10px] text-slate-500 font-sans mt-0.5">Viste a Clippy con los fondos ganados en tus partidas</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4 pb-4">
        {/* Skins Selection Group Box */}
        <div id="skins-cabinet" className="relative border border-slate-400 mt-2 p-3 bg-[#ece9d8] rounded-[3px] shadow-sm">
          <span className="absolute -top-2.5 left-3 bg-[#ece9d8] px-1 text-[11px] font-sans font-bold text-slate-700">
            🎨 Texturas de Metal
          </span>

          <div className="flex flex-col gap-2 pt-1">
            {SKINS.map((skin) => {
              const isUnlocked = unlockedSkins.includes(skin.id) || skin.id === 'chrome';
              const isActive = activeSkinId === skin.id;

              return (
                <div
                  key={skin.id}
                  className={`flex items-center justify-between p-2 bg-[#f0eee0] border ${
                    isActive ? 'border-[#002e9c]' : 'border-[#b5b2a3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border border-[#808080] flex items-center justify-center"
                      style={{
                        backgroundColor: skin.color,
                        borderColor: skin.strokeColor,
                        boxShadow: skin.glow ? `0 0 10px ${skin.color}` : 'none',
                      }}
                    />
                    <div>
                      <p className="text-[11px] font-sans font-bold text-slate-800 leading-none">{skin.name}</p>
                      <p className="text-[8px] text-slate-500 leading-none mt-1">
                        {skin.glow ? 'Resplandor Neón' : 'Acabado pulido'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuySkin(skin)}
                    className={`xp-btn text-[10px] py-1 px-3 ${
                      isActive ? 'xp-btn-blue' : ''
                    } ${coins < skin.price && !isUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {isActive ? '✓ En uso' : isUnlocked ? 'Equipar' : `🪙 ${skin.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accessories Selection Group Box */}
        <div id="accessories-cabinet" className="relative border border-slate-400 mt-3 p-3 bg-[#ece9d8] rounded-[3px] shadow-sm">
          <span className="absolute -top-2.5 left-3 bg-[#ece9d8] px-1 text-[11px] font-sans font-bold text-slate-700">
            👒 Accesorios de Oficina
          </span>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {ACCESSORIES.map((acc) => {
              const isUnlocked = unlockedAccessories.includes(acc.id);
              const isActive = activeAccessories[acc.type] === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`flex flex-col p-2 bg-[#f0eee0] border justify-between ${
                    isActive ? 'border-[#002e9c] bg-white' : 'border-[#b5b2a3]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl filter drop-shadow-xs">{acc.icon}</span>
                    <span className="xp-border-inset bg-white text-slate-700 text-[8px] font-mono px-1 py-0.2 leading-none">
                      {acc.type === 'hat' ? 'Cabeza' : acc.type === 'glasses' ? 'Gafas' : 'Cuello'}
                    </span>
                  </div>

                  <div className="mt-1.5 mb-1.5">
                    <p className="text-[10px] font-sans font-bold text-slate-800 leading-tight">{acc.name}</p>
                  </div>

                  <button
                    onClick={() => handleBuyAccessory(acc)}
                    className={`xp-btn text-[9px] py-0.5 mt-auto ${
                      isActive ? 'bg-red-500 border-red-800 text-white hover:bg-red-600' : ''
                    } ${coins < acc.price && !isUnlocked ? 'opacity-40' : ''}`}
                  >
                    {isActive ? 'Soltar' : isUnlocked ? 'Equipar' : `🪙 ${acc.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
