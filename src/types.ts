import React from 'react';

export enum RoomType {
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  LAB = 'lab',
  BEDROOM = 'bedroom',
  PLAYROOM = 'playroom',
  HOUSE = 'house',
  SHOP = 'shop',
}

export interface ClippyStats {
  hunger: number;     // 0 - 100 (Pou equivalent)
  sleep: number;      // 0 - 100
  health: number;     // 0 - 100
  fun: number;        // 0 - 100
  dirt: number;       // 0 - 100 (0 means clean, 100 means fully rusty/dirty)
  xp: number;         // Current level XP
  level: number;      // Current Level
  coins: number;      // Wallet
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: {
    hunger?: number;
    sleep?: number;
    health?: number;
    fun?: number;
    dirt?: number;
  };
  icon: string;
  category: 'food' | 'potion' | 'soap' | 'toy';
}

export interface Skin {
  id: string;
  name: string;
  price: number;
  color: string;      // Primary SVG color
  strokeColor: string; // Stroke SVG color
  unlocked: boolean;
  glow?: boolean;      // Special neon glow styling
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  type: 'hat' | 'glasses' | 'neck';
  unlocked: boolean;
  renderSVG: (color: string) => React.ReactNode;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
}
