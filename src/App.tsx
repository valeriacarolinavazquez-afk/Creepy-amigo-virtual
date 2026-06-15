import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Apple,
  Moon,
  Pill,
  Gamepad,
  Award,
  CircleCheck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Volume2,
  Trash2,
  Monitor,
  FolderClosed,
  AppWindow,
  X,
  Minus,
  Maximize2
} from 'lucide-react';

import { RoomType, ClippyStats, Item } from './types';
import { playSound as rawPlaySound } from './utils/audio';
import { ClippySprite } from './components/ClippySprite';
import { MiniGame } from './components/MiniGame';
import { Shop, SKINS, ACCESSORIES } from './components/Shop';
import { TalkPanel } from './components/TalkPanel';
import {
  initAuth,
  googleSignIn,
  logout,
  fetchClippyEvents,
  createClippyPlayDay,
  deleteClippyPlayDay,
  setCachedToken,
  CalendarEvent
} from './utils/googleCalendar';
import { User } from 'firebase/auth';

export const FOOD_ITEMS: Item[] = [
  {
    id: 'glace_paper_sheets',
    name: 'Hojas de Papel Glacé',
    description: 'Hojas brillantes de colores para plegar avioncitos dulces.',
    price: 4,
    effect: { hunger: 20, dirt: 5 },
    icon: '📄',
    category: 'food',
  },
  {
    id: 'color_pixels',
    name: 'Píxeles de Colores',
    description: 'Un puñado de píxeles RGB crujientes llenos de energía retro.',
    price: 10,
    effect: { hunger: 45, fun: 5 },
    icon: '👾',
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
    id: 'chocolate_floppy',
    name: 'Disquete de Chocolate',
    description: 'Disquete de 3.5" relleno de chocolate suizo fundido. ¡Nostalgia pura!',
    price: 12,
    effect: { hunger: 60, health: 5 },
    icon: '💾',
    category: 'food',
  },
];

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

export interface AchievementStats {
  foodEaten: number;
  potionsDrunk: number;
  washes: number;
  gamesPlayed: number;
  speechSpoken: number;
  coinsEarned: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  condition: (
    stats: ClippyStats,
    achStats: AchievementStats,
    unlockedSkins: string[],
    unlockedAccessories: string[]
  ) => boolean;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_bite',
    title: 'Primer Bocado',
    description: 'Come cualquier alimento.',
    icon: '🍪',
    rewardCoins: 10,
    condition: (s, ach) => ach.foodEaten >= 1,
  },
  {
    id: 'cyber_gourmet',
    title: 'Gourmet de Oficina',
    description: 'Alimentá a Clippy 10 veces.',
    icon: '🍕',
    rewardCoins: 25,
    condition: (s, ach) => ach.foodEaten >= 10,
  },
  {
    id: 'first_potion',
    title: 'Poder Lubricante',
    description: 'Tomá cualquier solución química o pastilla.',
    icon: '🧪',
    rewardCoins: 15,
    condition: (s, ach) => ach.potionsDrunk >= 1,
  },
  {
    id: 'alchemist',
    title: 'Alquimista de Sistema',
    description: 'Tomá 5 pociones en el laboratorio.',
    icon: '⚗️',
    rewardCoins: 35,
    condition: (s, ach) => ach.potionsDrunk >= 5,
  },
  {
    id: 'clean_clip',
    title: 'Cero Óxido',
    description: 'Limpia a Clippy para remover toda suciedad.',
    icon: '🧼',
    rewardCoins: 15,
    condition: (s) => s.dirt === 0,
  },
  {
    id: 'always_shiny',
    title: 'Clip de Diamante',
    description: 'Limpia a Clippy 15 veces con el jabón o la ducha.',
    icon: '✨',
    rewardCoins: 30,
    condition: (s, ach) => ach.washes >= 15,
  },
  {
    id: 'great_sleeper',
    title: 'Estrella Durmiente',
    description: 'Haz que la energía (Sueño) de Clippy llegue al 100%.',
    icon: '💤',
    rewardCoins: 20,
    condition: (s) => s.sleep >= 100,
  },
  {
    id: 'pro_gamer',
    title: 'Gamer Retro',
    description: 'Juega 5 minigames o actividades divertidas.',
    icon: '🎮',
    rewardCoins: 30,
    condition: (s, ach) => ach.gamesPlayed >= 5,
  },
  {
    id: 'reach_lvl_3',
    title: 'Usuario Iniciado',
    description: 'Alcanza el Nivel 3 de Clippy.',
    icon: '🛡️',
    rewardCoins: 20,
    condition: (s) => s.level >= 3,
  },
  {
    id: 'reach_lvl_5',
    title: 'Veterano de Windows',
    description: 'Alcanza el Nivel 5 de Clippy.',
    icon: '👑',
    rewardCoins: 50,
    condition: (s) => s.level >= 5,
  },
  {
    id: 'reach_lvl_10',
    title: 'Señor del Soporte',
    description: 'Alcanza el Nivel 10 de Clippy.',
    icon: '🌟',
    rewardCoins: 100,
    condition: (s) => s.level >= 10,
  },
  {
    id: 'skin_collector',
    title: 'Metamorfosis',
    description: 'Desbloquea al menos 3 colores o pinturas en la Tienda.',
    icon: '🎨',
    rewardCoins: 40,
    condition: (s, ach, skins) => skins.length >= 3,
  },
  {
    id: 'fashionist',
    title: 'Diseñador de Accesorios',
    description: 'Desbloquea al menos 3 accesorios en la Tienda.',
    icon: '👓',
    rewardCoins: 40,
    condition: (s, ach, skins, acc) => acc.length >= 3,
  },
  {
    id: 'rich_clip',
    title: 'Monarca de Silicon Valley',
    description: 'Amortiza y acumula 250 monedas a la vez.',
    icon: '💰',
    rewardCoins: 50,
    condition: (s) => s.coins >= 250,
  },
  {
    id: 'talkative',
    title: 'Parlanchín Conectado',
    description: 'Dialoga con Clippy a través de voz o teclado 6 veces.',
    icon: '💬',
    rewardCoins: 20,
    condition: (s, ach) => ach.speechSpoken >= 6,
  },
];

const ROOM_ORDER = [
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.LAB,
  RoomType.BEDROOM,
  RoomType.PLAYROOM,
  RoomType.HOUSE,
  RoomType.SHOP
];

const ROOM_THEMES = {
  [RoomType.KITCHEN]: { bg: '#ff8585', topBar: '#ffc3c3', label: 'Cocina' },
  [RoomType.BATHROOM]: { bg: '#06dffc', topBar: '#aeecfe', label: 'Baño' },
  [RoomType.LAB]: { bg: '#ea4aa0', topBar: '#fcbddd', label: 'Laboratorio' },
  [RoomType.BEDROOM]: { bg: '#ffe843', topBar: '#e2f782', sleepBg: '#10101d', label: 'Dormitorio' },
  [RoomType.PLAYROOM]: { bg: '#4ce150', topBar: '#b4fbaf', label: 'Cuarto de Juegos' },
  [RoomType.HOUSE]: { bg: '#4abeff', topBar: '#a2e0ff', label: 'Patio' },
  [RoomType.SHOP]: { bg: '#ec90c0', topBar: '#fed0e8', label: 'Tienda' }
};

export default function App() {
  const [activeRoom, setActiveRoom] = useState<RoomType>(RoomType.KITCHEN);
  const [mood, setMood] = useState<'happy' | 'sad' | 'dizzy' | 'sleeping' | 'eating' | 'sick' | 'talking'>('happy');
  const [isSleeping, setIsSleeping] = useState(false);
  const [mouthSyncVolume, setMouthSyncVolume] = useState(0);

  // Stats State loading from LocalStorage
  const [stats, setStats] = useState<ClippyStats>(() => {
    const saved = localStorage.getItem('clippy_virtual_pet_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      hunger: 90,
      sleep: 80,
      health: 100,
      fun: 75,
      dirt: 15,
      xp: 0,
      level: 1,
      coins: 80,
    };
  });

  // Inventory Stock loading
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('clippy_inventory_stock');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      glace_paper_sheets: 3,
      color_pixels: 1,
      oil_wd40: 0,
      chocolate_floppy: 2,
      rust_potion: 1,
      health_pill: 0,
    };
  });

  // Cosmetics Unlock history
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('clippy_unlocked_skins');
    return saved ? JSON.parse(saved) : ['chrome'];
  });
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(() => {
    const saved = localStorage.getItem('clippy_unlocked_accessories');
    return saved ? JSON.parse(saved) : [];
  });

  // Equipped Cosmetics
  const [activeSkinId, setActiveSkinId] = useState<string>(() => {
    return localStorage.getItem('clippy_active_skin_id') || 'chrome';
  });
  const [activeAccessories, setActiveAccessories] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('clippy_active_accessories');
    return saved ? JSON.parse(saved) : {};
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Carousel slider indices
  const [selectedFoodIdx, setSelectedFoodIdx] = useState(0);
  const [selectedPotionIdx, setSelectedPotionIdx] = useState(0);

  // Washing Sponge Mode and Bubble Sprinkles
  const [isWashingMode, setIsWashingMode] = useState(false);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Bathroom Shower & Ball States
  const [isShowerToggled, setIsShowerToggled] = useState(false);
  const [showerDrops, setShowerDrops] = useState<{ id: number; left: string; delay: number }[]>([]);
  const [isBallBouncing, setIsBallBouncing] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  // Cabinet sliding drawer open toggle
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  // Help window trigger modal
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sound muting settings
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('clippy_sounds_muted') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('clippy_sounds_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  const playSound = (type: Parameters<typeof rawPlaySound>[0]) => {
    if (!isMuted) {
      rawPlaySound(type);
    }
  };

  // Interaction click timers (for dizzy spins)
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  // Falling particles animation for food
  const [flyingFood, setFlyingFood] = useState<{ id: number; icon: string } | null>(null);

  // Inactivity tracking & retro yellow speech bubble
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [activeIdleAnimation, setActiveIdleAnimation] = useState<'none' | 'spring' | 'tap-screen' | 'airplane'>('none');
  const [clippySpeechBubble, setClippySpeechBubble] = useState<string | null>(
    "¡Hola! Parece que querés jugar conmigo... ¿Necesitás ayuda?"
  );
  const [crackPositions, setCrackPositions] = useState<{ id: number; x: number; y: number }[]>([]);

  // Google Calendar Integration State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [phoneTab, setPhoneTab] = useState<'stats' | 'calendar' | 'achievements'>('stats');
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);

  // Static Clippy toggle settings
  const [isClippyStatic, setIsClippyStatic] = useState<boolean>(() => {
    return localStorage.getItem('clippy_is_static') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('clippy_is_static', isClippyStatic ? 'true' : 'false');
  }, [isClippyStatic]);

  // Achievement and Progress states
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem('clippy_unlocked_achievements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [achievementStats, setAchievementStats] = useState<AchievementStats>(() => {
    const saved = localStorage.getItem('clippy_achievement_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      foodEaten: 0,
      potionsDrunk: 0,
      washes: 0,
      gamesPlayed: 0,
      speechSpoken: 0,
      coinsEarned: 0,
    };
  });

  const [achievementPopup, setAchievementPopup] = useState<{
    title: string;
    description: string;
    icon: string;
    reward: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('clippy_unlocked_achievements', JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  useEffect(() => {
    localStorage.setItem('clippy_achievement_stats', JSON.stringify(achievementStats));
  }, [achievementStats]);

  const triggerAchievementNotification = (ach: typeof ACHIEVEMENTS_LIST[0]) => {
    playSound('coin');
    setAchievementPopup({
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      reward: ach.rewardCoins,
    });
    setTimeout(() => {
      setAchievementPopup(null);
    }, 4500);
  };

  // Monitor and automatically unlock Achievements
  useEffect(() => {
    const newlyUnlocked: string[] = [];
    let awardCoinsTotal = 0;

    ACHIEVEMENTS_LIST.forEach((ach) => {
      if (!unlockedAchievements.includes(ach.id)) {
        if (ach.condition(stats, achievementStats, unlockedSkins, unlockedAccessories)) {
          newlyUnlocked.push(ach.id);
          awardCoinsTotal += ach.rewardCoins;
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements((prev) => [...prev, ...newlyUnlocked]);
      if (awardCoinsTotal > 0) {
        setStats((prev) => ({
          ...prev,
          coins: prev.coins + awardCoinsTotal,
        }));
      }

      newlyUnlocked.forEach((id) => {
        const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id);
        if (ach) {
          triggerAchievementNotification(ach);
        }
      });
    }
  }, [
    stats.level,
    stats.coins,
    stats.sleep,
    stats.dirt,
    achievementStats.foodEaten,
    achievementStats.potionsDrunk,
    achievementStats.washes,
    achievementStats.gamesPlayed,
    achievementStats.speechSpoken,
    unlockedSkins.length,
    unlockedAccessories.length,
    unlockedAchievements,
  ]);

  const resetInactivity = () => {
    setLastInteraction(Date.now());
    if (activeIdleAnimation !== 'none') {
      setActiveIdleAnimation('none');
    }
  };

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('clippy_virtual_pet_stats', JSON.stringify(stats));
  }, [stats]);

  // Google Calendar Auth Initializer
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setCalendarToken(token);
        loadEvents(token);
      },
      () => {
        setCurrentUser(null);
        setCalendarToken(null);
        setCalendarEvents([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadEvents = async (token: string) => {
    setIsLoadingCalendar(true);
    setCalendarMessage(null);
    try {
      const list = await fetchClippyEvents(token);
      setCalendarEvents(list);
    } catch (err: any) {
      console.error(err);
      setCalendarMessage("Hubo un error al sincronizar con tu Google Calendar. Podría deberse a un problema de conexión.");
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingCalendar(true);
    setCalendarMessage(null);
    try {
      playSound('tap');
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setCalendarToken(result.accessToken);
        setCachedToken(result.accessToken);
        await loadEvents(result.accessToken);
        
        setClippySpeechBubble(`¡Hola, ${result.user.displayName || 'Usuario'}! Qué lindo tener tus proezas en tu Google Calendar. ¡Sincronizado! 👋`);
        triggerNotification(`🔓 ¡Conectado con éxito a Google Calendar de ${result.user.displayName}!`);
      }
    } catch (err: any) {
      console.error(err);
      setCalendarMessage("No se pudo iniciar sesión con Google. Revisa tu conexión y vuelve a intentarlo.");
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleGoogleLogout = async () => {
    playSound('tap');
    try {
      await logout();
      setCurrentUser(null);
      setCalendarToken(null);
      setCalendarEvents([]);
      setClippySpeechBubble("Has cerrado sesión de Google. Tus datos de calendario local se han limpiado.");
      triggerNotification("🔒 Sesión de Google cerrada.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPlayDay = async () => {
    if (!calendarToken) return;
    
    // Get local date formatted as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if duplicate already exists for today
    const alreadyRegistered = calendarEvents.some(e => {
      const eventDate = e.start.date || e.start.dateTime || '';
      return eventDate.startsWith(todayStr);
    });
    
    if (alreadyRegistered) {
      setCalendarMessage("¡Ya has registrado el día de hoy en tu Google Calendar! Vuelve mañana para unirte de nuevo.");
      return;
    }

    // MANDATORY confirmation dialog for modifying Workspace calendar events
    const confirmed = window.confirm(
      `¿Confirmas registrar tu día de juego de hoy (${todayStr}) como un evento 'Día de Juego Clippy' en tu Google Calendar?`
    );
    if (!confirmed) return;

    setIsLoadingCalendar(true);
    setCalendarMessage(null);
    playSound('levelUp');
    try {
      await createClippyPlayDay(calendarToken, todayStr);
      
      // Let's reward the virtual pet owner with coins & XP!
      setStats(prev => ({
        ...prev,
        coins: prev.coins + 50,
        xp: prev.xp + 50,
      }));
      setClippySpeechBubble("💾 ¡Día guardado en tu Google Calendar! Te obsequio 🪙 50 monedas y +50 XP por cuidar tus hábitos retro.");
      triggerNotification("📅 ¡Día de juego guardado en Google Calendar! +50 Monedas & +50 XP");
      
      await loadEvents(calendarToken);
    } catch (err: any) {
      console.error(err);
      setCalendarMessage("No se pudo agendar el evento en tu calendario. Comprueba la configuración de tu cuenta.");
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleDeletePlayDay = async (eventId: string, dateLabel: string) => {
    if (!calendarToken) return;

    // MANDATORY confirmation dialog for deleting Workspace data
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el registro de juego del ${dateLabel} de tu Google Calendar?`
    );
    if (!confirmed) return;

    setIsLoadingCalendar(true);
    setCalendarMessage(null);
    playSound('hurt');
    try {
      await deleteClippyPlayDay(calendarToken, eventId);
      setClippySpeechBubble(`He borrado el registro del día ${dateLabel} de tu Google Calendar.`);
      triggerNotification(`🗑️ Borrado día de juego: ${dateLabel}`);
      await loadEvents(calendarToken);
    } catch (err: any) {
      console.error(err);
      setCalendarMessage("No se pudo eliminar el evento del calendario.");
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Bathroom Shower Droplet Simulator Ticker
  useEffect(() => {
    if (!isShowerToggled) {
      setShowerDrops([]);
      return;
    }
    const interval = setInterval(() => {
      // Spawn new drop particles
      setShowerDrops((prev) => {
        const newDrop = {
          id: Date.now() + Math.random(),
          left: `${15 + Math.random() * 70}%`,
          delay: Math.random() * 0.4,
        };
        return [...prev, newDrop].slice(-25); // Limit particle pool
      });

      // Clean dirt level gradually when under the running shower drops!
      setStats((prev) => {
        if (prev.dirt > 0) {
          // Increment wash statistic every few ticks of running shower drops (so they count as washes!)
          if (Math.random() < 0.2) {
            setAchievementStats((ach) => ({ ...ach, washes: ach.washes + 1 }));
          }
          return {
            ...prev,
            dirt: Math.max(0, prev.dirt - 5),
            health: Math.min(100, prev.health + 0.4),
          };
        }
        return prev;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isShowerToggled]);

  useEffect(() => {
    localStorage.setItem('clippy_inventory_stock', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('clippy_unlocked_skins', JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  useEffect(() => {
    localStorage.setItem('clippy_unlocked_accessories', JSON.stringify(unlockedAccessories));
  }, [unlockedAccessories]);

  useEffect(() => {
    localStorage.setItem('clippy_active_skin_id', activeSkinId);
  }, [activeSkinId]);

  useEffect(() => {
    localStorage.setItem('clippy_active_accessories', JSON.stringify(activeAccessories));
  }, [activeAccessories]);

  // Pou Needs Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        if (isSleeping) {
          const nextSleep = Math.min(100, prev.sleep + 3.8);
          const nextHunger = Math.max(0, prev.hunger - 0.25);
          const nextDirt = Math.min(100, prev.dirt + 0.08);
          return {
            ...prev,
            sleep: nextSleep,
            hunger: nextHunger,
            dirt: nextDirt,
          };
        } else {
          // Regular Awake decay rates
          const hungerDecay = 0.5;
          const sleepDecay = 0.4;
          const funDecay = 0.6;
          const dirtAccumulation = 0.3;

          const nextHunger = Math.max(0, prev.hunger - hungerDecay);
          const nextSleep = Math.max(0, prev.sleep - sleepDecay);
          const nextFun = Math.max(0, prev.fun - funDecay);
          const nextDirt = Math.min(100, prev.dirt + dirtAccumulation);

          let healthMod = 0;
          if (nextHunger <= 0) healthMod += 0.8;
          if (nextSleep <= 0) healthMod += 1.0;
          if (nextDirt >= 85) healthMod += 0.5;

          const nextHealth = Math.max(0, prev.health - healthMod);

          return {
            ...prev,
            hunger: nextHunger,
            sleep: nextSleep,
            fun: nextFun,
            dirt: nextDirt,
            health: nextHealth,
          };
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Automated inactivity reset upon any detectable state changes / user actions
  useEffect(() => {
    resetInactivity();
  }, [activeRoom, stats.coins, stats.hunger, stats.xp, isSleeping, activeAccessories, activeSkinId]);

  // Idle Animation Periodical Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSleeping || activeIdleAnimation !== 'none' || gameActive) return;

      const idleDuration = Date.now() - lastInteraction;
      if (idleDuration >= 12000) { // 12 seconds of complete silence
        // Trigger a random idle animation!
        const animations: ('spring' | 'tap-screen' | 'airplane')[] = ['spring', 'tap-screen', 'airplane'];
        const chosen = animations[Math.floor(Math.random() * animations.length)];
        
        setActiveIdleAnimation(chosen);

        // Perform animation-specific side effects!
        if (chosen === 'tap-screen') {
          playSound('tap');
          setTimeout(() => playSound('tap'), 300); // knock knock!
          
          setClippySpeechBubble("🤔 ¿Seguís ahí? Parece que querés jugar conmigo... ¿Necesitás ayuda?");
          triggerNotification("🔔 ¡Clippy golpeó la pantalla para llamar tu atención!");
          
          // Spawn click crack visual ripples
          setCrackPositions([
            { id: Date.now(), x: 80 + Math.random() * 60, y: 180 + Math.random() * 60 },
          ]);
          setTimeout(() => {
            setCrackPositions(prev => [
              ...prev,
              { id: Date.now() + 1, x: 100 + Math.random() * 60, y: 190 + Math.random() * 60 }
            ]);
          }, 300);

          setTimeout(() => {
            setCrackPositions([]);
          }, 3000);

        } else if (chosen === 'spring') {
          playSound('giggle');
          setClippySpeechBubble("¡Mírame! ¡Me estiro como un resorte de oficina! 🪛");
          triggerNotification("🪛 ¡Clippy se enrolló en espiral como un resorte!");
        } else if (chosen === 'airplane') {
          playSound('tap');
          setClippySpeechBubble("¡Fiuuuuu! ¡Me convertí en avioncito de papel! ✈️");
          triggerNotification("✈️ ¡Clippy se transformó en avioncito de papel!");
        }

        // Auto-reset idle state back to none after the animation finishes
        const duration = chosen === 'airplane' ? 4200 : 2500;
        setTimeout(() => {
          setActiveIdleAnimation('none');
        }, duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastInteraction, isSleeping, activeIdleAnimation, gameActive]);

  // Sync active Mood
  useEffect(() => {
    if (isSleeping) {
      setMood('sleeping');
      return;
    }
    if (stats.health < 30) {
      setMood('sick');
    } else if (stats.hunger < 30 || stats.fun < 30 || stats.sleep < 30) {
      setMood('sad');
    } else if (mood !== 'eating' && mood !== 'talking' && mood !== 'dizzy') {
      setMood('happy');
    }
  }, [stats.health, stats.hunger, stats.fun, stats.sleep, isSleeping]);

  // XP & Level manager
  const addXP = (amount: number) => {
    setStats((prev) => {
      const targetXP = prev.level * 100;
      let nextXP = prev.xp + amount;
      let nextLevel = prev.level;
      let extraCoins = 0;

      if (nextXP >= targetXP) {
        nextXP -= targetXP;
        nextLevel += 1;
        extraCoins = 25 * nextLevel;
        playSound('levelUp');
        triggerNotification(`¡NIVEL SUBIDO! Nivel ${nextLevel} 🎉 +🪙 ${extraCoins} monedas`);
      }

      return {
        ...prev,
        xp: nextXP,
        level: nextLevel,
        coins: prev.coins + extraCoins,
      };
    });
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Touching Clippy triggers
  const handleTouchClippy = () => {
    if (isSleeping) {
      playSound('hurt');
      triggerNotification('Shh... Clippy está durmiendo. Enciende la luz para jugar 💤');
      return;
    }

    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 450);

    if (clickCountRef.current >= 4) {
      playSound('hurt');
      setMood('dizzy');
      triggerNotification('¡Ay! ¡Clippy se sintió súper mareado por las sacudidas! 💫');
      setTimeout(() => {
        setMood('happy');
      }, 3000);
      clickCountRef.current = 0;
      return;
    }

    playSound('giggle');
    setMood('happy');
    setStats((prev) => ({
      ...prev,
      fun: Math.min(100, prev.fun + 5),
      coins: prev.coins + 1, // Gain coin for loving him
    }));
    addXP(4);
  };

  // Slide rooms prev/next
  const currentRoomIdx = ROOM_ORDER.indexOf(activeRoom);
  const nextRoom = () => {
    playSound('tap');
    setIsWashingMode(false);
    setDrawerOpen(false);
    const nextIdx = (currentRoomIdx + 1) % ROOM_ORDER.length;
    setActiveRoom(ROOM_ORDER[nextIdx]);
  };
  const prevRoom = () => {
    playSound('tap');
    setIsWashingMode(false);
    setDrawerOpen(false);
    const prevIdx = (currentRoomIdx - 1 + ROOM_ORDER.length) % ROOM_ORDER.length;
    setActiveRoom(ROOM_ORDER[prevIdx]);
  };

  // Playroom ball bounce sound and coins trigger
  const handleBounceBall = () => {
    if (isBallBouncing) return;
    playSound('tap');
    setIsBallBouncing(true);
    setStats((prev) => ({
      ...prev,
      fun: Math.min(100, prev.fun + 12),
      coins: prev.coins + 5,
    }));
    setAchievementStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      coinsEarned: prev.coinsEarned + 5,
    }));
    addXP(10);
    triggerNotification('¡Rebote de básquetbol! 🏀 +🪙 5 monedas');
    setTimeout(() => {
      setIsBallBouncing(false);
    }, 1000);
  };

  // Feeding action
  const handleFeedItem = (item: Item) => {
    const stock = inventory[item.id] || 0;
    if (stock <= 0) {
      // Prompt buy
      handleBuyCarouselItem(item, 'food');
      return;
    }

    // Flight animation
    playSound('tap');
    const animId = Date.now();
    setFlyingFood({ id: animId, icon: item.icon });

    setTimeout(() => {
      playSound('chew');
      setMood('eating');
      setFlyingFood(null);

      setInventory((prev) => ({
        ...prev,
        [item.id]: Math.max(0, stock - 1),
      }));

      setStats((prev) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + (item.effect.hunger || 0)),
        fun: Math.min(100, prev.fun + (item.effect.fun || 0)),
        health: Math.min(100, prev.health + (item.effect.health || 0)),
        dirt: Math.min(100, prev.dirt + (item.effect.dirt || 0)),
      }));

      setAchievementStats((prev) => ({
        ...prev,
        foodEaten: prev.foodEaten + 1,
      }));

      addXP(15);
      triggerNotification(`¡Clippy comió ${item.name}! 😋`);

      let msgBubble = `¡Qué rico! Gracias por alimentarme. 😋`;
      if (item.id === 'glace_paper_sheets') msgBubble = "¡Qué ricas hojas de papel glacé! Puedo plegarme en miles de formas dulces. 📄";
      if (item.id === 'chocolate_floppy') msgBubble = "💾 ¡Un disquete de 3.5\" cargado de chocolate suizo! ¡Nostalgia pura!";
      if (item.id === 'color_pixels') msgBubble = "¡Ñam! ¡Estos píxeles luminosos RGB encienden toda mi pantalla! 👾";
      if (item.id === 'oil_wd40') msgBubble = "¡Fiuuu! ¡Lubricación WD-40 para que mis resortes de clip no hagan ruido! 🛢️";
      setClippySpeechBubble(msgBubble);

      setTimeout(() => {
        setMood('happy');
      }, 1500);
    }, 700);
  };

  // Medicine action
  const handleUsePotionItem = (item: Item) => {
    const stock = inventory[item.id] || 0;
    if (stock <= 0) {
      handleBuyCarouselItem(item, 'potion');
      return;
    }

    playSound('heal');
    setInventory((prev) => ({
      ...prev,
      [item.id]: Math.max(0, stock - 1),
    }));

    setStats((prev) => ({
      ...prev,
      health: Math.min(100, prev.health + (item.effect.health || 0)),
      dirt: Math.max(0, prev.dirt + (item.effect.dirt || 0)),
    }));

    setAchievementStats((prev) => ({
      ...prev,
      potionsDrunk: prev.potionsDrunk + 1,
    }));

    addXP(18);
    triggerNotification(`¡Completado tratamiento de ${item.name}! ✨`);
  };

  // Sparkly cleaning action
  const handleWashInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isWashingMode) return;

    playSound('wash');
    
    // Clean dirt
    setStats((prev) => ({
      ...prev,
      dirt: Math.max(0, prev.dirt - 8),
      fun: Math.min(100, prev.fun + 1),
    }));
    setAchievementStats((prev) => ({
      ...prev,
      washes: prev.washes + 1,
    }));
    addXP(1);

    // Spawn bubbles
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newBubble = { id: Date.now() + Math.random(), x, y };

    setBubbles((prev) => [...prev, newBubble].slice(-15));
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 850);
  };

  // 1-Tap purchase inside Carousel
  const handleBuyCarouselItem = (item: Item, cat: string) => {
    if (stats.coins < item.price) {
      playSound('hurt');
      triggerNotification(`Necesitas 🪙 ${item.price} monedas para comprar ${item.name}`);
      return;
    }

    playSound('coin');
    setStats((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
    }));

    setInventory((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));

    triggerNotification(`¡Compraste ${item.name}! +1 en tu inventario.`);
  };

  // Toggle sleep lamp
  const handleToggleSleep = () => {
    playSound('tap');
    setIsSleeping((prev) => {
      const nextSleepState = !prev;
      if (nextSleepState) {
        setMood('sleeping');
        triggerNotification('Apagando la luz del dormitorio... Zzz 💤');
      } else {
        setMood('happy');
        triggerNotification('Luz encendida. ¡Hola Clippy! ☀️');
      }
      return nextSleepState;
    });
  };

  // Mini-game completed
  const handleCompleteGame = (coinsEarned: number, funGained: number, xpGained: number) => {
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + coinsEarned,
      fun: Math.min(100, prev.fun + funGained),
    }));
    setAchievementStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      coinsEarned: prev.coinsEarned + coinsEarned,
    }));
    addXP(xpGained);
    triggerNotification(`¡Fin del juego! Ganaste 🪙 ${coinsEarned} monedas y +${xpGained} XP! 🎮`);
  };

  // Unlock permanent paint/skins
  const handleUnlockSkin = (skinId: string, price: number) => {
    setStats((prev) => ({ ...prev, coins: prev.coins - price }));
    setUnlockedSkins((prev) => [...prev, skinId]);
    setActiveSkinId(skinId);
    triggerNotification('¡Nueva textura equipada y guardada con éxito!');
  };

  const handleEquipSkin = (skinId: string) => {
    setActiveSkinId(skinId);
    triggerNotification('Textura metálica equipada.');
  };

  // Unlock accessoiries
  const handleUnlockAccessory = (accId: string, price: number) => {
    setStats((prev) => ({ ...prev, coins: prev.coins - price }));
    setUnlockedAccessories((prev) => [...prev, accId]);

    const itemType = ACCESSORIES.find(a => a.id === accId)?.type || 'hat';
    setActiveAccessories((prev) => ({
      ...prev,
      [itemType]: accId,
    }));

    triggerNotification('¡Accesorio comprado y colocado!');
  };

  const handleEquipAccessory = (accId: string, type: 'hat' | 'glasses' | 'neck') => {
    setActiveAccessories((prev) => {
      const copy = { ...prev };
      if (copy[type] === accId) {
        delete copy[type];
      } else {
        copy[type] = accId;
      }
      return copy;
    });
  };

  const currentSkin = SKINS.find((s) => s.id === activeSkinId) || SKINS[0];

  // Colors based on rooms
  const activeTheme = ROOM_THEMES[activeRoom] || ROOM_THEMES[RoomType.KITCHEN];
  const mainBgColor = activeRoom === RoomType.BEDROOM && isSleeping ? activeTheme.sleepBg : activeTheme.bg;

  return (
    <div className="min-h-screen w-full bg-[#f4f2ea] flex items-center justify-center p-0 sm:p-5 select-none font-sans relative">
      
      {/* Background Soft Clouds for Desk vibe */}
      <div className="hidden md:block absolute top-[15%] left-[8%] w-48 h-12 bg-white/40 blur-xl rounded-full" />
      <div className="hidden md:block absolute top-[40%] right-[10%] w-60 h-16 bg-white/40 blur-xl rounded-full" />

      {/* Main POU Emulated Bracket Container */}
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[820px] sm:max-h-[880px] sm:rounded-[40px] flex flex-col justify-between overflow-hidden relative shadow-[0px_16px_40px_rgba(0,0,0,0.18)] border-t-0 sm:border-[7px] border-black bg-white">
        
        {/* Absolute floating notifications box */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-22 left-1/2 -translate-x-1/2 z-50 w-[85%] bg-[#fffde6] border-[3px] border-black rounded-2xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center text-[12px] font-bold text-black"
            >
              ⭐ {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absolute floating achievements celebratory popup banner */}
        <AnimatePresence>
          {achievementPopup && (
            <motion.div
              initial={{ opacity: 0, y: -45, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              className="absolute top-22 left-1/2 -translate-x-1/2 z-50 w-[90%] bg-amber-50 border-[4px] border-emerald-600 shadow-[6px_6px_0px_#000] rounded-3xl p-4 text-black overflow-hidden"
            >
              <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none" />
              <div className="flex gap-3 relative z-10">
                <div className="w-14 h-14 bg-white border-2 border-emerald-600 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)] select-none">
                  {achievementPopup.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[9px] font-black tracking-widest text-emerald-600 font-mono uppercase mb-0.5 animate-pulse">
                    🏆 ¡LOGRO DESBLOQUEADO!
                  </div>
                  <h4 className="font-extrabold text-xs text-neutral-900 leading-tight">
                    {achievementPopup.title}
                  </h4>
                  <p className="text-[10px] font-bold text-stone-600 mt-1 leading-snug">
                    {achievementPopup.description}
                  </p>
                  <div className="mt-2 text-[10px] font-extrabold flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      🪙 +{achievementPopup.reward} monedas
                    </span>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest animate-bounce">
                      ✨ CONSEGUIDO
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. TOP STATUS BAR (POU NATIVE STYLE) */}
        <div 
          className="p-3 pt-5 border-b-[4px] border-black flex items-center justify-between relative transition-colors duration-300"
          style={{ backgroundColor: activeTheme.topBar }}
        >
          {/* Coin Wallet */}
          <div 
            onClick={() => setActiveRoom(RoomType.SHOP)}
            className="flex items-center gap-1 bg-yellow-400 border-[3.5px] border-black rounded-2xl px-2.5 py-0.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 active:scale-95 transition-all text-black"
          >
            <div className="w-4.5 h-4.5 rounded-full bg-yellow-200 border-[2px] border-black font-extrabold text-[12px] flex items-center justify-center">
              +
            </div>
            <span className="font-extrabold text-[13px] leading-none tracking-tight">{stats.coins}</span>
          </div>

          {/* 4 Status Meter Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Hunger Box */}
            <div 
              onClick={() => { playSound('tap'); setActiveRoom(RoomType.KITCHEN); }}
              className="w-10 h-10 border-[3px] border-black rounded-xl bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 transition-all"
              title="Hambre"
            >
              <div 
                className={`absolute bottom-0 inset-x-0 transition-all duration-500 ${stats.hunger < 30 ? 'bg-red-500 animate-pulse' : 'bg-[#5cd01b]'}`} 
                style={{ height: `${stats.hunger}%` }} 
              />
              <span className="text-[16px] leading-none z-10 font-bold drop-shadow-[0px_1.5px_0px_#fff]">🍗</span>
            </div>

            {/* Health Box */}
            <div 
              onClick={() => { playSound('tap'); setActiveRoom(RoomType.LAB); }}
              className="w-10 h-10 border-[3px] border-black rounded-xl bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 transition-all"
              title="Salud"
            >
              <div 
                className={`absolute bottom-0 inset-x-0 transition-all duration-500 ${stats.health < 30 ? 'bg-red-500 animate-pulse' : 'bg-[#5cd01b]'}`} 
                style={{ height: `${stats.health}%` }} 
              />
              <span className="text-[15px] leading-none z-10 font-extrabold drop-shadow-[0px_1.5px_0px_#fff]">➕</span>
            </div>

            {/* Sleep Box */}
            <div 
              onClick={() => { playSound('tap'); setActiveRoom(RoomType.BEDROOM); }}
              className="w-10 h-10 border-[3px] border-black rounded-xl bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 transition-all"
              title="Sueño"
            >
              <div 
                className={`absolute bottom-0 inset-x-0 transition-all duration-500 ${stats.sleep < 30 ? 'bg-red-500 animate-pulse' : 'bg-[#5cd01b]'}`} 
                style={{ height: `${stats.sleep}%` }} 
              />
              <span className="text-[17px] leading-none z-10 font-bold drop-shadow-[0px_1.5px_0px_#fff]">😴</span>
            </div>

            {/* Fun Box */}
            <div 
              onClick={() => { playSound('tap'); setActiveRoom(RoomType.PLAYROOM); }}
              className="w-10 h-10 border-[3px] border-black rounded-xl bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-105 transition-all"
              title="Diversión"
            >
              <div 
                className={`absolute bottom-0 inset-x-0 transition-all duration-500 ${stats.fun < 30 ? 'bg-red-500 animate-pulse' : 'bg-[#5cd01b]'}`} 
                style={{ height: `${stats.fun}%` }} 
              />
              <span className="text-[16px] leading-none z-10 font-bold drop-shadow-[0px_1.5px_0px_#fff]">🎮</span>
            </div>
          </div>

          {/* Level Tracker Egg */}
          <div className="w-9 h-11 border-[3.5px] border-black rounded-t-[18px] rounded-b-[18px] bg-white flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all text-black">
            <span className="font-extrabold text-[13px] leading-none">{stats.level}</span>
          </div>
        </div>

        {/* 2. ROOM CONTROLLER HEADER ROW */}
        <div className="p-3 flex items-center justify-between bg-white border-b-[4px] border-black shadow-[0px_4px_0px_rgba(0,0,0,0.05)] z-20">
          <button 
            onClick={() => { playSound('tap'); triggerNotification('📷 ¡Patata! Retrato guardado en el portapapeles.'); }}
            className="w-10 h-10 pou-btn flex items-center justify-center text-lg shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            title="Captura"
          >
            📷
          </button>

          <button 
            onClick={prevRoom}
            className="w-10 h-10 pou-btn flex items-center justify-center text-lg font-black text-black shadow-[2px_2px_0px_#000] active:translate-y-0.5"
          >
            &lt;
          </button>

          <div className="flex-1 text-center select-none">
            <h2 className="text-2xl font-black pou-bubble-title text-black drop-shadow-sm uppercase">
              {activeTheme.label}
            </h2>
          </div>

          <button 
            onClick={nextRoom}
            className="w-10 h-10 pou-btn flex items-center justify-center text-lg font-black text-black shadow-[2px_2px_0px_#000] active:translate-y-0.5"
          >
            &gt;
          </button>

          <button 
            onClick={() => { playSound('tap'); setSettingsOpen(true); }}
            className="w-10 h-10 pou-btn flex items-center justify-center text-lg font-black text-black shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            title="Configuración"
          >
            ⚙️
          </button>

          <button 
            onClick={() => { playSound('tap'); setHelpOpen(true); }}
            className="w-10 h-10 pou-btn flex items-center justify-center text-lg font-black text-black shadow-[2px_2px_0px_#000] active:translate-y-0.5"
          >
            ?
          </button>
        </div>

        {/* 3. CENTER ACTIVE VIEWPORT STAGE */}
        <div 
          onClick={() => {
            if (activeRoom !== RoomType.LAB) handleTouchClippy();
          }}
          className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden transition-colors duration-300 cursor-pointer"
          style={{ backgroundColor: mainBgColor }}
        >
          {/* Flying Food Particle Animation */}
          <AnimatePresence>
            {flyingFood && (
              <motion.div
                key={flyingFood.id}
                className="absolute text-6xl z-50 pointer-events-none select-none drop-shadow-lg"
                initial={{ x: 0, y: 180, scale: 0.5, rotate: 0 }}
                animate={{
                  x: 0,
                  y: -40,
                  scale: [0.5, 1.4, 0.4],
                  rotate: 360,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                {flyingFood.icon}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bubble Particle Animation for soap washing */}
          <AnimatePresence>
            {bubbles.map((b) => (
              <motion.div
                key={b.id}
                className="absolute w-5 h-5 rounded-full bg-sky-100/60 border border-sky-300 pointer-events-none flex items-center justify-center text-xs"
                style={{ left: b.x, top: b.y }}
                initial={{ scale: 0.2, y: 0, opacity: 0.8 }}
                animate={{
                  scale: [0.2, 1.5, 0.8],
                  y: -70,
                  x: (Math.random() - 0.5) * 45,
                  opacity: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                💧
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Glass Tapping Crack Visual Effects */}
          <AnimatePresence>
            {crackPositions.map((c) => (
              <motion.div
                key={c.id}
                className="absolute z-50 pointer-events-none select-none text-red-500 font-extrabold flex items-center justify-center text-4xl"
                style={{ left: `${c.x}%`, top: `${c.y}px` }}
                initial={{ scale: 0, opacity: 0.95, rotate: 0 }}
                animate={{
                  scale: [0, 1.4, 1.1],
                  opacity: [0.95, 0.8, 0],
                  rotate: [0, Math.random() > 0.5 ? 20 : -20],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                💥
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Floating Stars / Crescent Moon if Bedroom Bedroom is turned OFF */}
          {activeRoom === RoomType.BEDROOM && isSleeping && (
            <div className="absolute inset-x-0 top-6 bottom-36 pointer-events-none z-10 select-none">
              <motion.div 
                className="absolute top-4 right-10 text-3xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🌙
              </motion.div>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full"
                  style={{
                    top: `${15 + Math.random() * 50}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}

          {/* ROOM SPECIFIC SUB-LABELS (POU STYLE BANNER SENTENCES) */}
          <div className="text-center z-10 w-full select-none pt-2 pointer-events-none">
            {activeRoom === RoomType.KITCHEN && (
              <h3 className="text-2xl font-black text-white uppercase drop-shadow-[0_2.2px_0_rgba(0,0,0,1)] tracking-normal">
                Nutre Pou! Yumm!
              </h3>
            )}
            {activeRoom === RoomType.LAB && (
              <h3 className="text-2xl font-black text-white uppercase drop-shadow-[0_2.2px_0_rgba(0,0,0,1)] tracking-normal">
                {isWashingMode ? "¡Cuida de Pou!" : "Sanar y Limpiar"}
              </h3>
            )}
            {activeRoom === RoomType.BEDROOM && (
              <h3 className="text-2xl font-black text-white uppercase drop-shadow-[0_2.2px_0_rgba(0,0,0,1)] tracking-normal">
                {isSleeping ? "¡Zzz... Dulces Sueños!" : "Hora de Dormir"}
              </h3>
            )}
            {activeRoom === RoomType.PLAYROOM && (
              <h3 className="text-2xl font-black text-white uppercase drop-shadow-[0_2.2px_0_rgba(0,0,0,1)] tracking-normal">
                ¡A Jugar con Clippy!
              </h3>
            )}
            {activeRoom === RoomType.SHOP && (
              <h3 className="text-2xl font-black text-white uppercase drop-shadow-[0_2.2px_0_rgba(0,0,0,1)] tracking-normal">
                Racks de Moda de Clippy
              </h3>
            )}
          </div>

          {/* ACTIVE CONTENT SELECTOR */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative z-20">
            {activeRoom === RoomType.SHOP ? (
              <div className="w-full h-full bg-white/85 border-[3px] border-black rounded-3xl p-3 shadow-[4px_4px_0px_#000] overflow-y-auto max-h-[350px]">
                <Shop
                  coins={stats.coins}
                  unlockedSkins={unlockedSkins}
                  unlockedAccessories={unlockedAccessories}
                  activeSkinId={activeSkinId}
                  activeAccessories={activeAccessories}
                  onUnlockSkin={handleUnlockSkin}
                  onEquipSkin={handleEquipSkin}
                  onUnlockAccessory={handleUnlockAccessory}
                  onEquipAccessory={handleEquipAccessory}
                />
              </div>
            ) : activeRoom === RoomType.PLAYROOM ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
                  {/* Bouncing Basketball */}
                  <div className="flex flex-col items-center justify-center select-none text-center relative">
                    <motion.div
                      animate={isBallBouncing ? { 
                        y: [0, -120, 0, -50, 0],
                        rotate: [0, 180, 360, 480, 540]
                      } : { y: [0, -4, 0] }}
                      transition={isBallBouncing ? {
                        duration: 1.0,
                        ease: "easeOut"
                      } : {
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBounceBall();
                      }}
                      className="w-20 h-20 bg-orange-505 border-[3.5px] border-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center relative overflow-hidden active:scale-95"
                      style={{ backgroundColor: '#eb621a' }}
                    >
                      <div className="absolute inset-x-0 w-full h-[3.5px] bg-black top-1/2 -translate-y-1/2" />
                      <div className="absolute inset-y-0 w-[3.5px] bg-black left-1/2 -translate-x-1/2" />
                      <div className="absolute inset-0 border-[3px] border-black rounded-full pointer-events-none" />
                      <span className="text-3xl filter drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] z-10 select-none">🏀</span>
                    </motion.div>
                    <span className="text-[9px] uppercase font-black bg-white border border-black px-1.5 py-0.2 rounded-md mt-1 shadow-[1px_1px_0px_#000]">
                      Rebotar
                    </span>
                  </div>

                  {/* Playroom Pou Character standing */}
                  <motion.div 
                    className="relative cursor-pointer scale-100 active:scale-95 transition-transform"
                    animate={isClippyStatic ? { y: 0 } : { y: [0, -4, 0] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <ClippySprite
                      mood={mood}
                      talkingVolume={mouthSyncVolume}
                      skinColor={currentSkin}
                      activeAccessory={activeAccessories}
                      idleAnimation={activeIdleAnimation}
                      speechBubble={clippySpeechBubble}
                      onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                      isClippyStatic={isClippyStatic}
                    />
                  </motion.div>
                </div>
              </div>
            ) : activeRoom === RoomType.BATHROOM ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                {/* Shower sprinkler graphics active if isShowerToggled */}
                {isShowerToggled && (
                  <div className="absolute inset-x-0 top-0 bottom-12 pointer-events-none z-30 select-none overflow-hidden">
                    <motion.div 
                      initial={{ y: -30 }} 
                      animate={{ y: 0 }} 
                      className="absolute top-0 left-12 w-16 h-8 border-[3px] border-black bg-yellow-400 rounded-b-xl flex items-center justify-center shadow-[3px_3px_0px_#000]"
                    >
                      <span className="text-sm">🚿</span>
                    </motion.div>
                    
                    {showerDrops.map((drop) => (
                      <motion.div
                        key={drop.id}
                        className="absolute w-1.5 h-3.5 bg-blue-400/80 rounded-full"
                        style={{ left: drop.left, top: -10 }}
                        animate={{ y: [0, 320] }}
                        transition={{ duration: 0.8, ease: "linear", delay: drop.delay }}
                      />
                    ))}
                  </div>
                )}

                {/* Soap drag canvas overlay if soap is selected (isWashingMode) */}
                <div 
                  id="bathroom-soap-canvas"
                  onClick={(e) => { e.stopPropagation(); handleWashInteraction(e); }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1 && Math.random() < 0.2) {
                      handleWashInteraction(e);
                    }
                  }}
                  className={`w-full max-w-[300px] h-[230px] rounded-3xl border-3 border-black flex items-center justify-center relative touch-none select-none transition-colors ${
                    isWashingMode ? 'border-dashed border-sky-500 bg-sky-200/20 active:cursor-grabbing' : 'border-transparent bg-transparent'
                  }`}
                >
                  {isWashingMode && (
                    <div className="absolute top-2 inset-x-2 text-center pointer-events-none z-30">
                      <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full uppercase shadow-[2.2px_2.22px_0px_#000]">
                        🧼 Arrastra sobre Pou para enjabonar!
                      </span>
                    </div>
                  )}
                  
                  {/* Pou Sprite standing inside the bath stage */}
                  <motion.div 
                    className="relative cursor-pointer scale-100"
                    animate={isClippyStatic ? { y: 0 } : { y: [0, -3, 0] }} 
                    transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
                  >
                    <ClippySprite
                      mood={mood}
                      talkingVolume={mouthSyncVolume}
                      skinColor={currentSkin}
                      activeAccessory={activeAccessories}
                      idleAnimation={activeIdleAnimation}
                      speechBubble={clippySpeechBubble}
                      onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                      isClippyStatic={isClippyStatic}
                    />
                  </motion.div>
                </div>
              </div>
            ) : activeRoom === RoomType.HOUSE ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden rounded-2xl">
                  <div className="flex justify-around pt-2">
                    <div className="w-16 h-6 bg-white/40 blur-md rounded-full animate-pulse" />
                    <div className="w-24 h-8 bg-white/40 blur-md rounded-full" />
                  </div>
                  <div className="flex gap-4 items-end justify-center w-full opacity-35 z-0 mb-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[38px] border-b-green-700" />
                    ))}
                  </div>
                  <div className="w-full h-11 bg-green-500 border-t-4 border-black z-10" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-around w-full z-20 mt-1 pb-4">
                  {/* Cartoon red roofed House */}
                  <div className="flex flex-col items-center relative">
                    <div className="relative w-28 h-20 bg-stone-100 border-4 border-black shadow-[4px_4px_0_#000]">
                      <div className="absolute -top-11 -left-4 w-32 h-0 border-l-[64px] border-l-transparent border-r-[64px] border-r-transparent border-b-[40px] border-b-red-500 overflow-visible">
                        <div className="absolute top-[38px] -left-[64px] w-[128px] h-1 bg-black" />
                      </div>
                      <div className="absolute top-2 left-3 w-6 h-6 bg-sky-200 border-2 border-black rounded" />
                      <div className="absolute bottom-0 right-3 w-8 h-12 bg-red-600 border-2 border-black rounded-t-lg">
                        <div className="absolute top-5 left-1 w-2 h-2 rounded-full bg-yellow-400 border border-black" />
                      </div>
                    </div>
                  </div>

                  <motion.div 
                    className="relative cursor-pointer scale-100 active:scale-105"
                    animate={isClippyStatic ? { y: 0 } : { y: [0, -3, 0] }} 
                    transition={{ repeat: Infinity, duration: 2.3, ease: "easeInOut" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound('giggle');
                      setStats(prev => ({ ...prev, coins: prev.coins + 2 }));
                      triggerNotification('¡Pou se divierte en el patio! +🪙 2 monedas');
                    }}
                  >
                    <ClippySprite
                      mood={mood}
                      talkingVolume={mouthSyncVolume}
                      skinColor={currentSkin}
                      activeAccessory={activeAccessories}
                      idleAnimation={activeIdleAnimation}
                      speechBubble={clippySpeechBubble}
                      onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                      isClippyStatic={isClippyStatic}
                    />
                  </motion.div>
                </div>
              </div>
            ) : activeRoom === RoomType.BEDROOM ? (
              <div className="flex flex-col items-center justify-center scale-90 relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSleep();
                  }}
                  className="relative cursor-pointer select-none z-30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="110" height="120" viewBox="0 0 120 150" className="overflow-visible">
                    {!isSleeping && (
                      <polygon points="60,65 -30,150 150,150" fill="url(#lampRay)" className="opacity-30" />
                    )}
                    <defs>
                      <linearGradient id="lampRay" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="100%" stopColor="#ff0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 40,135 Q 60,115 80,135 Z" fill="#444254" stroke="#000" strokeWidth="3" />
                    <path d="M 60,125 Q 75,90 60,65" fill="none" stroke="#000" strokeWidth="4" />
                    <path d="M 35,65 Q 60,40 85,65 Z" fill={isSleeping ? '#22202e' : '#fff37a'} stroke="#000" strokeWidth="3" />
                  </svg>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white border-[2px] border-black px-1.5 py-0.2 rounded-md text-black">
                    {isSleeping ? 'ENCENDER' : 'APAGAR'}
                  </span>
                </motion.button>

                <div className="flex flex-col items-center justify-center relative mt-2">
                  <div className="absolute -bottom-6 z-0 select-none pointer-events-none flex flex-col items-center">
                    <svg viewBox="0 0 160 60" className="w-56 h-20 pointer-events-none drop-shadow-md overflow-visible">
                      <path d="M 10,35 Q 35,5 80,5 Q 125,5 150,35 Q 120,55 80,55 Q 40,55 10,35 Z" fill="#ffffff" stroke="#000" strokeWidth="3.5" />
                      <path d="M 15,32 Q 40,50 80,50 Q 120,50 145,32" fill="none" stroke="#d5d5df" strokeWidth="2" />
                    </svg>
                  </div>

                  <motion.div 
                    className="relative scale-100 z-10"
                    animate={isClippyStatic ? { y: 0 } : isSleeping ? { y: [0, 2, 0] } : { y: [0, -3, 0] }} 
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  >
                    <ClippySprite
                      mood={mood}
                      talkingVolume={mouthSyncVolume}
                      skinColor={currentSkin}
                      activeAccessory={activeAccessories}
                      idleAnimation={activeIdleAnimation}
                      speechBubble={clippySpeechBubble}
                      onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                      isClippyStatic={isClippyStatic}
                    />
                  </motion.div>
                </div>
              </div>
            ) : activeRoom === RoomType.LAB ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                <motion.div 
                  className={`relative cursor-pointer scale-100 ${isClippyStatic ? '' : 'animate-bounce-slow'}`}
                  animate={isClippyStatic ? { y: 0 } : { y: [0, -4, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <ClippySprite
                    mood={mood}
                    talkingVolume={mouthSyncVolume}
                    skinColor={currentSkin}
                    activeAccessory={activeAccessories}
                    idleAnimation={activeIdleAnimation}
                    speechBubble={clippySpeechBubble}
                    onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                    isClippyStatic={isClippyStatic}
                  />
                </motion.div>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                <motion.div 
                  className="relative cursor-pointer scale-100"
                  animate={isClippyStatic ? { y: 0 } : { y: [0, -4, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <ClippySprite
                    mood={mood}
                    talkingVolume={mouthSyncVolume}
                    skinColor={currentSkin}
                    activeAccessory={activeAccessories}
                    idleAnimation={activeIdleAnimation}
                    speechBubble={clippySpeechBubble}
                    onCloseSpeechBubble={() => setClippySpeechBubble(null)}
                    isClippyStatic={isClippyStatic}
                  />
                </motion.div>
              </div>
            )}
          </div>

          {/* Speech dialogue panel integrated cleanly at bottom of viewport */}
          {activeRoom !== RoomType.PLAYROOM && activeRoom !== RoomType.SHOP && (
            <div className="w-full max-w-[320px] mt-1 p-1 bg-white/20 rounded-2xl">
              <TalkPanel
                onVolumeChange={setMouthSyncVolume}
                setMood={setMood}
                isSleeping={isSleeping}
                onTalk={() => {
                  setAchievementStats((prev) => ({
                    ...prev,
                    speechSpoken: prev.speechSpoken + 1,
                  }));
                }}
              />
            </div>
          )}
        </div>

        {/* 4. DYNAMIC INTERACTIVE POU CAROUSEL / DRAWER BOTTOM BAR */}
        <div className="bg-[#e4ddcc] border-t-[4px] border-black p-3 relative flex flex-col items-center">
          
          {/* Main bottom launcher buttons and carousel shelf */}
          <div className="w-full flex items-center justify-between gap-2.5">
            {/* Left Button cupboard locker */}
            <div className="flex flex-col items-center select-none text-center">
              {activeRoom === RoomType.KITCHEN && (
                <button 
                  onClick={() => { playSound('tap'); setDrawerOpen(!drawerOpen); }}
                  className="w-13 h-13 bg-orange-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                  title="Alacena / Refrigerator"
                >
                  🚪
                </button>
              )}
              {activeRoom === RoomType.BATHROOM && (
                <button 
                  onClick={() => { playSound('tap'); setIsShowerToggled(!isShowerToggled); }}
                  className={`w-13 h-13 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl ${isShowerToggled ? 'bg-yellow-400 text-white' : 'bg-stone-50'}`}
                  title="Activar Regadera"
                >
                  🚿
                </button>
              )}
              {activeRoom === RoomType.LAB && (
                <button 
                  onClick={() => { playSound('tap'); setDrawerOpen(!drawerOpen); }}
                  className="w-13 h-13 bg-sky-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                  title="Gabinete de Pociones"
                >
                  🧪
                </button>
              )}
              {activeRoom === RoomType.BEDROOM && (
                <button 
                  onClick={() => { playSound('tap'); setDrawerOpen(!drawerOpen); }}
                  className="w-13 h-13 bg-indigo-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                  title="Armario de Ropa"
                >
                  👚
                </button>
              )}
              {activeRoom === RoomType.PLAYROOM && (
                <button 
                  onClick={() => { playSound('tap'); setGameActive(true); }}
                  className="w-13 h-13 bg-green-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                  title="Minijuego"
                >
                  🕹️
                </button>
              )}
              {activeRoom === RoomType.HOUSE && (
                <button 
                  onClick={() => { playSound('tap'); setIsPhoneOpen(true); }}
                  className="w-13 h-13 bg-red-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                  title="Estadísticas de Pou"
                >
                  📞
                </button>
              )}
              {activeRoom === RoomType.SHOP && (
                <button 
                  onClick={() => { playSound('tap'); setActiveRoom(RoomType.KITCHEN); }}
                  className="w-13 h-13 bg-stone-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-xl"
                  title="Ir a Cocina"
                >
                  🏠
                </button>
              )}
              <span className="text-[10px] uppercase font-black text-black mt-1 leading-none text-shadow-xs">
                {activeRoom === RoomType.KITCHEN ? 'Alacena' 
                  : activeRoom === RoomType.BATHROOM ? 'Ducha' 
                  : activeRoom === RoomType.LAB ? 'Estante' 
                  : activeRoom === RoomType.BEDROOM ? 'Closet' 
                  : activeRoom === RoomType.PLAYROOM ? 'Juegos' 
                  : activeRoom === RoomType.HOUSE ? 'Teléfono' 
                  : 'Volver'}
              </span>
            </div>

            {/* Middle Container: Dynamic Scroll Item Carousel */}
            <div className="flex-1 flex justify-center items-center">
              {activeRoom === RoomType.KITCHEN ? (
                (() => {
                  const currentFood = FOOD_ITEMS[selectedFoodIdx];
                  const stock = inventory[currentFood.id] || 0;
                  return (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { playSound('tap'); setSelectedFoodIdx(prev => (prev - 1 + FOOD_ITEMS.length) % FOOD_ITEMS.length); }}
                        className="w-8 h-8 rounded-full border-[2.5px] border-black bg-white font-bold flex items-center justify-center shadow-[1px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-100 text-black active:translate-y-0.5"
                      >
                        ◀
                      </button>

                      <button
                        onClick={() => handleFeedItem(currentFood)}
                        className="pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-3 py-1 bg-white hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none"
                      >
                        <span className="text-2xl leading-none">{currentFood.icon}</span>
                        <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black line-clamp-1">{currentFood.name}</span>
                        
                        <div className="mt-1 flex items-center gap-1">
                          {stock > 0 ? (
                            <span className="bg-orange-500 text-white font-black px-1.5 py-0.2 rounded-md text-[9px] line-height-none">x{stock}</span>
                          ) : (
                            <span className="bg-[#10b981] text-white font-black px-1.5 py-0.2 rounded-md text-[9px]">🪙 {currentFood.price} +</span>
                          )}
                        </div>
                      </button>

                      <button 
                        onClick={() => { playSound('tap'); setSelectedFoodIdx(prev => (prev + 1) % FOOD_ITEMS.length); }}
                        className="w-8 h-8 rounded-full border-[2.5px] border-black bg-white font-bold flex items-center justify-center shadow-[1px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-100 text-black active:translate-y-0.5"
                      >
                        ▶
                      </button>
                    </div>
                  );
                })()
              ) : activeRoom === RoomType.LAB ? (
                (() => {
                  const currentPotion = LAB_ITEMS[selectedPotionIdx];
                  const stock = inventory[currentPotion.id] || 0;
                  return (
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => { playSound('tap'); setSelectedPotionIdx(prev => (prev - 1 + LAB_ITEMS.length) % LAB_ITEMS.length); }}
                        className="w-8 h-8 rounded-full border-[2.5px] border-black bg-white font-bold flex items-center justify-center shadow-[1px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-100 text-black active:translate-y-0.5"
                      >
                        ◀
                      </button>

                      <button
                        onClick={() => handleUsePotionItem(currentPotion)}
                        className="pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-3 py-1 bg-white hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none"
                      >
                        <span className="text-2xl leading-none">{currentPotion.icon}</span>
                        <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black line-clamp-1">{currentPotion.name}</span>
                        
                        <div className="mt-1 flex items-center gap-1">
                          {stock > 0 ? (
                            <span className="bg-sky-500 text-white font-black px-1.5 py-0.2 rounded-md text-[9px] line-height-none">x{stock}</span>
                          ) : (
                            <span className="bg-[#10b981] text-white font-black px-1.5 py-0.2 rounded-md text-[9px]">🪙 {currentPotion.price} +</span>
                          )}
                        </div>
                      </button>

                      <button 
                        onClick={() => { playSound('tap'); setSelectedPotionIdx(prev => (prev + 1) % LAB_ITEMS.length); }}
                        className="w-8 h-8 rounded-full border-[2.5px] border-black bg-white font-bold flex items-center justify-center shadow-[1px_2px_0px_rgba(0,0,0,1)] hover:bg-gray-100 text-black active:translate-y-0.5"
                      >
                        ▶
                      </button>
                    </div>
                  );
                })()
              ) : activeRoom === RoomType.BATHROOM ? (
                <button
                  onClick={() => { playSound('tap'); setIsWashingMode(!isWashingMode); }}
                  className={`pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-5 py-2 hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none ${
                    isWashingMode ? 'bg-sky-200' : 'bg-white'
                  }`}
                >
                  <span className="text-2xl leading-none">🧼</span>
                  <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black">
                    {isWashingMode ? 'Jabón ON' : 'Jabón azul'}
                  </span>
                </button>
              ) : activeRoom === RoomType.BEDROOM ? (
                <button
                  onClick={() => { playSound('tap'); handleToggleSleep(); }}
                  className={`pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-5 py-2 hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none ${
                    isSleeping ? 'bg-indigo-300' : 'bg-white'
                  }`}
                >
                  <span className="text-2xl leading-none">💡</span>
                  <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black">
                    {isSleeping ? 'Encender' : 'Apagar'}
                  </span>
                </button>
              ) : activeRoom === RoomType.PLAYROOM ? (
                <button
                  onClick={handleBounceBall}
                  className={`pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-5 py-2 hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none ${
                    isBallBouncing ? 'bg-orange-200' : 'bg-white'
                  }`}
                >
                  <span className="text-2xl leading-none">🏀</span>
                  <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black">
                    Balón
                  </span>
                </button>
              ) : activeRoom === RoomType.HOUSE ? (
                <button
                  onClick={() => { playSound('tap'); setActiveRoom(RoomType.KITCHEN); }}
                  className="pou-item-card border-[3.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] px-5 py-2 bg-stone-100 hover:brightness-95 active:translate-y-0.5 transition-all text-black w-28 text-center flex flex-col items-center justify-center select-none"
                >
                  <span className="text-2xl leading-none">🚪</span>
                  <span className="text-[10px] font-black tracking-tight leading-none mt-1 uppercase text-black">
                    Entrar
                  </span>
                </button>
              ) : (
                <div className="text-slate-800 text-[11px] font-bold text-center px-4 py-1.5 bg-white/70 rounded-full border-[2px] border-black uppercase text-shadow-xs">
                  🛍️ Selecciona artículos
                </div>
              )}
            </div>

            {/* Right Button direct market Shop */}
            <div className="flex flex-col items-center select-none text-center">
              <button 
                onClick={() => { playSound('tap'); setActiveRoom(RoomType.SHOP); }}
                className="w-13 h-13 bg-pink-100 pou-btn shadow-[3px_3px_0px_#000] flex items-center justify-center text-2xl"
                title="Tienda de Regalos"
              >
                🏪
              </button>
              <span className="text-[10px] uppercase font-black text-black mt-1 leading-none text-shadow-xs">
                Tienda
              </span>
            </div>
          </div>

          {/* DYNAMIC CABINET DRAWER BOARD (SLIDES UP FROM THE WOOD SHELF) */}
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ y: 220, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 220, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="absolute bottom-0 inset-x-0 bg-[#dacfb7] border-t-[4px] border-black p-4 z-40 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-1.5">
                  <span className="font-extrabold text-black uppercase text-sm">
                    {activeRoom === RoomType.KITCHEN ? '🗄️ Dispensario de Comidas' : activeRoom === RoomType.LAB ? '🧪 Estante de Pociones' : '👚 Baúl de Ropas (Cosméticos)'}
                  </span>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="w-7 h-7 rounded-lg border-2 border-black bg-red-500 font-extrabold text-white text-xs flex items-center justify-center hover:bg-red-400 active:translate-y-0.5"
                  >
                    X
                  </button>
                </div>

                {/* Cabinet scroll list item grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {activeRoom === RoomType.KITCHEN ? (
                    FOOD_ITEMS.map((food) => {
                      const qty = inventory[food.id] || 0;
                      return (
                        <div key={food.id} className="bg-white border-2 border-black rounded-xl p-2 flex items-center justify-between text-black">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{food.icon}</span>
                            <div className="flex flex-col select-none">
                              <span className="text-[9px] font-black uppercase leading-tight">{food.name}</span>
                              <span className="text-[8px] text-gray-500">Tengo: {qty}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleBuyCarouselItem(food, 'food')}
                            className="bg-green-500 text-white border-2 border-black rounded-lg px-2 py-0.5 text-[9px] font-black hover:bg-green-400 active:translate-y-0.2"
                          >
                            🪙 {food.price}
                          </button>
                        </div>
                      );
                    })
                  ) : activeRoom === RoomType.LAB ? (
                    LAB_ITEMS.map((potion) => {
                      const qty = inventory[potion.id] || 0;
                      return (
                        <div key={potion.id} className="bg-white border-2 border-black rounded-xl p-2 flex items-center justify-between text-black">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{potion.icon}</span>
                            <div className="flex flex-col select-none">
                              <span className="text-[9px] font-black uppercase leading-tight">{potion.name}</span>
                              <span className="text-[8px] text-gray-500">Tengo: {qty}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleUsePotionItem(potion)}
                            className="bg-sky-500 text-white border-2 border-black rounded-lg px-2 py-0.5 text-[9px] font-black hover:bg-sky-400 active:translate-y-0.2"
                          >
                            {qty > 0 ? 'Usar' : `🪙 ${potion.price}`}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    /* Display Bedroom closets / equipped head accessories */
                    ACCESSORIES.map((acc) => {
                      const isUnlocked = unlockedAccessories.includes(acc.id);
                      const isActive = activeAccessories[acc.type] === acc.id;
                      return (
                        <div key={acc.id} className={`border-2 border-black rounded-xl p-2 flex items-center justify-between text-black ${isActive ? 'bg-sky-100' : 'bg-white'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{acc.icon}</span>
                            <span className="text-[9px] font-black uppercase line-clamp-1 leading-none">{acc.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (isUnlocked) {
                                handleEquipAccessory(acc.id, acc.type);
                              } else {
                                handleUnlockAccessory(acc.id, acc.price);
                              }
                            }}
                            className={`border-2 border-black rounded-lg px-2 py-0.5 text-[8px] font-black leading-none ${
                              isActive ? 'bg-red-500 text-white' : isUnlocked ? 'bg-sky-500 text-white' : 'bg-green-500 text-white'
                            }`}
                          >
                            {isActive ? 'Soltar' : isUnlocked ? 'Usar' : `🪙 ${acc.price}`}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PLAY ROOM ARCADE POPUP DISQUETES CATCHER */}
          <AnimatePresence>
            {gameActive && (
              <div className="fixed inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-sm bg-[#5ad36c] border-[4px] border-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_#000]"
                >
                  <div className="p-4 border-b-4 border-black bg-green-400 flex items-center justify-between text-black">
                    <span className="font-extrabold text-sm uppercase tracking-tight">🕹️ Atrapa Disquetes</span>
                    <button 
                      onClick={() => setGameActive(false)}
                      className="w-8 h-8 rounded-full bg-red-500 border-2 border-black font-extrabold text-white text-xs flex items-center justify-center hover:bg-red-400 active:translate-y-0.5"
                    >
                      X
                    </button>
                  </div>
                  <div className="p-2 bg-[#ffffeb]">
                    <MiniGame onGameComplete={handleCompleteGame} />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* OUTDOOR RETRO PHONE STATS BOOK POPUP */}
          <AnimatePresence>
            {isPhoneOpen && (
              <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-sm bg-orange-50 border-[4px] border-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_#000]"
                >
                  {/* Title Bar */}
                  <div className="p-4 border-b-4 border-black bg-orange-400 flex items-center justify-between text-black">
                    <span className="font-extrabold text-[15px] uppercase tracking-tight">📱 Pou-Tel Log Quests</span>
                    <button 
                      onClick={() => setIsPhoneOpen(false)}
                      className="w-8 h-8 rounded-full bg-red-500 border-2 border-black font-extrabold text-white text-xs flex items-center justify-center hover:bg-red-400 active:translate-y-0.5 cursor-pointer"
                    >
                      X
                    </button>
                  </div>

                  {/* Tab bar */}
                  <div className="flex border-b-2 border-black bg-amber-100 font-bold text-[11px]">
                    <button
                      onClick={() => { playSound('tap'); setPhoneTab('stats'); }}
                      className={`flex-1 py-1.5 text-center border-r-[2px] border-black transition-all cursor-pointer ${
                        phoneTab === 'stats' ? 'bg-orange-300 font-extrabold text-black' : 'bg-transparent text-gray-600 hover:bg-amber-200/50'
                      }`}
                    >
                      📊 Stats
                    </button>
                    <button
                      onClick={() => { playSound('tap'); setPhoneTab('calendar'); }}
                      className={`flex-1 py-1.5 text-center border-r-[2px] border-black transition-all cursor-pointer ${
                        phoneTab === 'calendar' ? 'bg-orange-300 font-extrabold text-black' : 'bg-transparent text-gray-600 hover:bg-amber-200/50'
                      }`}
                    >
                      📅 Calendar
                    </button>
                    <button
                      onClick={() => { playSound('tap'); setPhoneTab('achievements'); }}
                      className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                        phoneTab === 'achievements' ? 'bg-orange-300 font-extrabold text-black' : 'bg-transparent text-gray-600 hover:bg-amber-200/50'
                      }`}
                    >
                      🏆 Logros
                    </button>
                  </div>

                  <div className="p-5 text-black">
                    {phoneTab === 'stats' ? (
                      <>
                        <h4 className="font-black text-sm mb-3 border-b-2 border-black pb-1 uppercase">ESTADÍSTICAS GENERALES</h4>
                        <div className="space-y-2 text-xs font-bold font-mono">
                          <div className="flex justify-between">
                            <span>NIVEL ACTUAL:</span>
                            <span>{stats.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PUNTOS XP:</span>
                            <span>{stats.xp} / {stats.level * 100} XP</span>
                          </div>
                          <div className="flex justify-between">
                            <span>BILLETE MONEDAS:</span>
                            <span>🪙 {stats.coins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ESTADO SALUD:</span>
                            <span>{stats.health.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>NIVEL JUEGO:</span>
                            <span>{stats.fun.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SUCIEDAD:</span>
                            <span>{stats.dirt.toFixed(0)}%</span>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-white border-2 border-dashed border-orange-500 rounded-xl">
                          <h5 className="font-black text-[11px] text-orange-600 uppercase mb-1">Misión del Día:</h5>
                          <p className="text-[11px] font-bold text-gray-700 leading-relaxed">
                            ¡Mantén a Pou limpio con el Jabón o la Ducha y consigue monedas jugando al básquetbol o al atrapadisquetes! 🚀
                          </p>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000]">
                          <h5 className="font-extrabold text-[12px] uppercase text-amber-950 mb-2 flex items-center gap-1.5">
                            ⚙️ Ajustes de Clippy
                          </h5>
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isClippyStatic}
                              onChange={(e) => {
                                playSound('tap');
                                setIsClippyStatic(e.target.checked);
                              }}
                              className="w-4 h-4 accent-orange-500 rounded border-2 border-black cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-amber-950 leading-snug">
                              Clippy estático (sin flotar / quieto como Pou)
                            </span>
                          </label>
                        </div>
                      </>
                    ) : phoneTab === 'calendar' ? (
                      <div className="space-y-3">
                        {calendarToken ? (
                          <>
                            {/* User Profile Connected Info */}
                            <div className="flex items-center gap-2 p-2 bg-amber-100 border-2 border-black rounded-2xl">
                              {currentUser?.photoURL ? (
                                <img
                                  src={currentUser.photoURL}
                                  className="w-8 h-8 rounded-full border border-black"
                                  referrerPolicy="no-referrer"
                                  alt="Avatar"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full border border-black bg-amber-200 flex items-center justify-center text-sm font-bold">
                                  👤
                                </div>
                              )}
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-black leading-none truncate mb-1">
                                  {currentUser?.displayName || 'Usuario Google'}
                                </p>
                                <p className="text-[9px] font-bold text-gray-500 truncate leading-none">
                                  {currentUser?.email}
                                </p>
                              </div>
                              <button
                                onClick={handleGoogleLogout}
                                className="text-[9px] px-2 py-1 bg-red-100 hover:bg-red-200 active:translate-y-0.5 border border-black rounded font-bold cursor-pointer transition-all"
                              >
                                Salir
                              </button>
                            </div>

                            {/* Attendance Days Stats counter */}
                            {(() => {
                              const uniqueDaysCount = Array.from(new Set(calendarEvents.map(e => {
                                return e.start.date || (e.start.dateTime ? e.start.dateTime.split('T')[0] : '');
                              }))).filter(Boolean).length;

                              const todayStr = new Date().toISOString().split('T')[0];
                              const isTodayRegistered = calendarEvents.some(e => {
                                const d = e.start.date || e.start.dateTime || '';
                                return d.startsWith(todayStr);
                              });

                              return (
                                <>
                                  <div className="p-3 bg-yellow-100 border-2 border-black rounded-2xl text-center shadow-[3px_3px_0px_#000]">
                                    <div className="text-[9px] font-black uppercase text-amber-800 tracking-wider">
                                      Días de Juego en Google Calendar
                                    </div>
                                    <div className="text-3xl font-black text-amber-950 my-1 font-mono tracking-tight">
                                      {uniqueDaysCount} {uniqueDaysCount === 1 ? 'DÍA' : 'DÍAS'}
                                    </div>
                                    <div className="text-[9px] font-bold text-amber-900 leading-tight">
                                      ¡Tus visitas seguidas quedan registradas!
                                    </div>
                                  </div>

                                  {/* Error or Warning Message Box */}
                                  {calendarMessage && (
                                    <div className="p-2 bg-red-100 border border-red-400 rounded-lg text-red-700 text-[10px] font-extrabold leading-tight">
                                      ⚠️ {calendarMessage}
                                    </div>
                                  )}

                                  {/* Log Today Button */}
                                  {!isTodayRegistered ? (
                                    <button
                                      onClick={handleRegisterPlayDay}
                                      disabled={isLoadingCalendar}
                                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 border-2 border-black font-extrabold text-[11px] uppercase tracking-tight rounded-xl shadow-[2px_2.5px_0px_#000] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                      ✍️ Registrar Día de Hoy 🎮
                                    </button>
                                  ) : (
                                    <div className="w-full py-2 bg-green-100 border-2 border-black border-dashed font-bold text-[11px] rounded-xl text-center text-green-700">
                                      ✅ ¡Asistencia de Hoy Guardada! 🎉
                                    </div>
                                  )}

                                  {/* Loading State Spinner */}
                                  {isLoadingCalendar && (
                                    <div className="text-center py-2 text-[10px] font-black font-mono text-gray-500 animate-pulse">
                                      ⏳ Sincronizando eventos...
                                    </div>
                                  )}

                                  {/* Calendar Events List */}
                                  <div className="border-t border-black/15 pt-2">
                                    <span className="text-[9px] font-black tracking-wider uppercase text-gray-500 block mb-1">
                                      Registro de Días Activos:
                                    </span>
                                    {calendarEvents.length === 0 ? (
                                      <div className="text-[10px] text-gray-500 font-bold italic py-2 text-center">
                                        No encontramos días de juego agendados.
                                      </div>
                                    ) : (
                                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 font-mono">
                                        {calendarEvents.map((ev) => {
                                          const dateLabel = ev.start.date || (ev.start.dateTime ? ev.start.dateTime.split('T')[0] : 'N/A');
                                          return (
                                            <div key={ev.id} className="flex justify-between items-center bg-white px-2.5 py-1.5 border border-black rounded-lg text-[10px] font-bold shadow-[1px_1.5px_0_rgba(0,0,0,1)]">
                                              <span className="flex items-center gap-1 text-gray-800">🎮 {dateLabel}</span>
                                              <button 
                                                onClick={() => handleDeletePlayDay(ev.id, dateLabel)}
                                                className="text-red-500 hover:text-red-700 font-extrabold px-1 cursor-pointer"
                                                title="Eliminar registro"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <div className="text-center py-3 space-y-4">
                            <div className="text-4xl text-center">📅</div>
                            <div className="space-y-1.5">
                              <h5 className="font-extrabold text-[12px] uppercase text-amber-950">
                                Sincronización Google Calendar
                              </h5>
                              <p className="text-[11px] text-gray-600 font-bold leading-relaxed px-1">
                                ¡Vincula tu cuenta para contar exactamente cuántas fechas visitas a tu Clippy! Podrás agendar tus días de juego en tu Google Calendar para completar tus metas diarias y conseguir monedas.
                              </p>
                            </div>

                            {calendarMessage && (
                              <div className="p-2.5 bg-red-100 border border-red-400 rounded-lg text-red-700 text-[10px] font-extrabold leading-tight text-left">
                                ⚠️ {calendarMessage}
                              </div>
                            )}

                            {isLoadingCalendar ? (
                              <div className="text-center py-2 text-xs font-bold font-mono text-gray-500 animate-pulse">
                                Conectando con Google...
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <button
                                  onClick={handleGoogleLogin}
                                  className="border-2 border-black bg-white hover:bg-orange-50 active:translate-y-0.5 text-xs py-2 px-3 rounded-xl shadow-[3px_3px_0_#000] font-black text-black transition-all flex items-center gap-2 cursor-pointer"
                                >
                                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '16px', height: '16px' }}>
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                    <path fill="none" d="M0 0h48v48H0z"></path>
                                  </svg>
                                  <span>Conectar Google Calendar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b-2 border-black pb-1.5 uppercase">
                          <h4 className="font-black text-xs text-neutral-900 flex items-center gap-1">🏆 LOGROS Y MEDALLAS</h4>
                          <span className="text-[10px] font-extrabold bg-orange-200 border border-black px-1.5 py-0.5 rounded-full font-mono text-orange-950">
                            {unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length}
                          </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 text-xs">
                          {ACHIEVEMENTS_LIST.map((ach) => {
                            const isUnlocked = unlockedAchievements.includes(ach.id);
                            return (
                              <div
                                key={ach.id}
                                className={`p-2.5 border-2 border-black rounded-xl flex gap-3 shadow-[2.5px_2.5px_0px_#000] relative transition-all ${
                                  isUnlocked
                                    ? 'bg-amber-50/70 border-emerald-600 shadow-[2.5px_2.5px_0px_rgba(5,150,105,1)]'
                                    : 'bg-stone-50 border-stone-300 text-stone-500 opacity-75'
                                }`}
                              >
                                {isUnlocked && (
                                  <div className="absolute top-1 right-2 text-[8px] font-black tracking-tight text-emerald-600 font-mono uppercase bg-emerald-100 px-1 py-px rounded border border-emerald-500">
                                    CONSEGUIDO (+🪙{ach.rewardCoins})
                                  </div>
                                )}
                                <div className="text-xl flex items-center justify-center p-1 bg-white border border-black rounded-lg w-9 h-9 shrink-0 select-none">
                                  {isUnlocked ? ach.icon : '❓'}
                                </div>
                                <div className="flex-1 min-w-0 pr-8">
                                  <p className="font-extrabold text-[11px] leading-tight text-neutral-900 flex items-center gap-1">
                                    {isUnlocked ? ach.title : 'Logro Bloqueado'}
                                  </p>
                                  <p className="text-[9px] font-bold text-stone-600 mt-1 leading-tight">
                                    {ach.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* 5. PLAY ROOM HELP INFORMATION DIALOG MODAL */}
      <AnimatePresence>
        {helpOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#fffdf0] border-[4px] border-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_#000]"
            >
              <div className="p-4 border-b-4 border-black bg-yellow-300 flex items-center justify-between text-black">
                <span className="font-extrabold text-lg uppercase tracking-tight">Manual de Clippy Pou</span>
                <button 
                  onClick={() => setHelpOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500 border-2 border-black font-extrabold text-white text-xs flex items-center justify-center hover:bg-red-400 active:translate-y-0.5"
                >
                  X
                </button>
              </div>

              <div className="p-5 text-black flex flex-col gap-3 font-medium select-none text-xs">
                <p className="font-bold text-center text-sm border-b border-black/10 pb-1 mb-1">
                  👋 ¡Te damos la bienvenida al Pou de Oficina!
                </p>
                <div className="flex flex-col gap-2">
                  <p>🍔 <b>Cocina:</b> Desliza las flechas del carrusel o abre la <b>Alacena</b> para alimentar a tu querido Clippy.</p>
                  <p>🔬 <b>Laboratorio:</b> Saca brillo activando la <b>esponja jabonosa</b> (limpiando manchas) o aplícale pócimas.</p>
                  <p>🛌 <b>Dormir:</b> Apaga la lámpara para reciclar energía y reponer sus grapas.</p>
                  <p>🎮 <b>Juegos:</b> Atrapa archivos digitales que caen para acumular monedas en el monedero.</p>
                  <p>🛍️ <b>Tienda:</b> ¡Viste con estilo y desbloquea acabados de metal o sombreros!</p>
                  <p>🎤 <b>Micrófono:</b> Di algo y él te imitará balanceando su boca.</p>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      playSound('tap');
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="flex-1 bg-red-100 border-2 border-black rounded-xl py-2 font-bold text-[11px] text-red-600 hover:bg-red-200 active:translate-y-0.5 shadow-[2px_2.5px_0_#000] cursor-pointer"
                  >
                    Reiniciar Progreso
                  </button>
                  <button 
                    onClick={() => setHelpOpen(false)}
                    className="flex-1 bg-yellow-400 border-2 border-black rounded-xl py-2 font-bold text-[11px] text-black hover:bg-yellow-300 active:translate-y-0.5 shadow-[2px_2.5px_0_#000] cursor-pointer"
                  >
                    Cerrar Manual
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PLAY ROOM SETTINGS DIALOG MODAL */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#fffdf0] border-[4px] border-black rounded-[32px] overflow-hidden shadow-[8px_8px_0px_#000]"
            >
              <div className="p-4 border-b-4 border-black bg-orange-400 flex items-center justify-between text-black">
                <span className="font-extrabold text-lg uppercase tracking-tight">⚙️ Configuración</span>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-red-500 border-2 border-black font-extrabold text-white text-xs flex items-center justify-center hover:bg-red-400 active:translate-y-0.5"
                >
                  X
                </button>
              </div>

              <div className="p-5 text-black flex flex-col gap-4 font-medium select-none text-xs">
                <p className="font-bold text-center text-sm border-b border-black/10 pb-2 mb-1">
                  Ajustes del Juego y Clippy
                </p>

                {/* Switch 1: Static Clippy setting requested by the user */}
                <div className="p-3 bg-amber-50 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000]">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isClippyStatic}
                      onChange={(e) => {
                        playSound('tap');
                        setIsClippyStatic(e.target.checked);
                      }}
                      className="w-5 h-5 accent-orange-500 rounded border-2 border-black cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-extrabold text-amber-950 text-left">
                        Clippy estático (fijo)
                      </span>
                      <span className="text-[10px] text-amber-900/75 font-bold text-left leading-normal">
                        Se queda quieto y no flota en el aire (estilo Pou).
                      </span>
                    </div>
                  </label>
                </div>

                {/* Switch 2: Sound muting toggle */}
                <div className="p-3 bg-blue-50 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000]">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isMuted}
                      onChange={(e) => {
                        const nextMuted = e.target.checked;
                        setIsMuted(nextMuted);
                        if (!nextMuted) {
                          rawPlaySound('tap');
                        }
                      }}
                      className="w-5 h-5 accent-sky-500 rounded border-2 border-black cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-extrabold text-blue-950 text-left">
                        Silenciar Sonidos (Mute)
                      </span>
                      <span className="text-[10px] text-blue-900/75 font-bold text-left leading-normal">
                        Apaga todos los efectos de sintetizador retro.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      playSound('tap');
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="flex-1 bg-red-100 border-2 border-black rounded-xl py-2 font-bold text-[11px] text-red-600 hover:bg-red-200 active:translate-y-0.5 shadow-[2px_2.5px_0_#000] cursor-pointer"
                    title="Borra todos los datos guardados de Clippy"
                  >
                    Reiniciar Datos
                  </button>
                  <button 
                    onClick={() => setSettingsOpen(false)}
                    className="flex-1 bg-orange-400 border-2 border-black rounded-xl py-2 font-bold text-[11px] text-black hover:bg-orange-300 active:translate-y-0.5 shadow-[2px_2.5px_0_#000] cursor-pointer"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
