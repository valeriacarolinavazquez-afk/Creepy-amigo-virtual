import React, { useState } from 'react';
import { MiniGame } from './MiniGame';

interface PlayroomRoomProps {
  onCompleteGame: (coins: number, fun: number, xp: number) => void;
}

export const PlayroomRoom: React.FC<PlayroomRoomProps> = ({ onCompleteGame }) => {
  return (
    <div id="playroom-room" className="flex flex-col items-center w-full h-full p-2 relative">
      <div className="text-center mb-3">
        <h3 className="font-sans font-bold text-sm text-slate-800">🎮 Juegoteca.bat</h3>
        <p className="text-[10px] text-slate-500 font-sans mt-0.5">Atrapa disquetes con Clippy para ganar monedas y diversión</p>
      </div>

      <div className="my-auto w-full flex justify-center">
        <MiniGame onGameComplete={onCompleteGame} />
      </div>

      <div className="w-full max-w-sm mt-3">
        <div className="p-2 border border-slate-400 bg-[#ffffe1] text-left text-[10px] font-sans text-slate-800 leading-tight shadow-sm relative">
          💡 <b>Nota de Ayuda:</b> ¡Use el teclado con las teclas <b>Flecha Izquierda / Derecha</b> o haga clic en los botones de pantalla !
        </div>
      </div>
    </div>
  );
};
