import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0 - 100
  colorClass: string; // Left here for compliance
  icon: React.ReactNode;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  colorClass,
  icon,
}) => {
  const roundedValue = Math.max(0, Math.min(100, Math.round(value)));
  const isLow = roundedValue < 30;

  // Render 14 progress block slots matching Windows XP segmented loading bars
  const totalSlots = 14;
  const activeSlots = Math.round((roundedValue / 100) * totalSlots);

  return (
    <div className="xp-border-outset p-2 flex flex-col gap-1 w-full bg-[#ece9d8] text-slate-800 select-none">
      <div className="flex items-center justify-between text-[11px] font-sans font-bold">
        <span className="flex items-center gap-1.5 text-slate-700">
          <span className="text-sm shrink-0">{icon}</span>
          <span className="font-sans text-[11px]">{label}</span>
        </span>
        <span className={`font-mono text-[11px] ${isLow ? 'text-red-600 animate-pulse font-bold' : 'text-slate-800'}`}>
          {roundedValue}%
        </span>
      </div>

      <div className="xp-progress-groove h-[18px] p-[2px] flex gap-[2px] bg-white overflow-hidden relative">
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const isActive = idx < activeSlots;
          return (
            <div
              key={idx}
              className={`h-full w-[calc(100%/14-2px)] rounded-[1px] transition-all duration-300 ${
                isActive 
                  ? 'xp-progress-block' 
                  : 'bg-transparent'
              }`}
            />
          );
        })}
        {isLow && (
          <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
};

