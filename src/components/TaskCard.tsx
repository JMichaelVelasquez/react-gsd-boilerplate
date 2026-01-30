import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  done: boolean;
  skipped: boolean;
  onToggle: () => void;
}

const COLOURS = [
  'from-violet-500 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-fuchsia-500 to-pink-600',
];

function colourForId(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

export default function TaskCard({ task, done, skipped, onToggle }: Props) {
  const [popping, setPopping] = useState(false);

  const handleClick = () => {
    if (skipped) return;
    if (!done) {
      setPopping(true);
      setTimeout(() => setPopping(false), 600);
    }
    onToggle();
  };

  if (skipped) {
    return (
      <div className="relative rounded-3xl p-5 bg-gray-300/60 opacity-50 shadow-md select-none">
        <div className="flex items-center gap-4">
          <span className="text-4xl grayscale">⏭️</span>
          <div className="flex-1">
            <p className="font-bold text-lg text-gray-500 line-through">{task.title}</p>
            <p className="text-sm text-gray-400 italic">Skipped today</p>
          </div>
        </div>
      </div>
    );
  }

  const gradient = colourForId(task.id);
  const isWeekly = task.frequency === 'weekly';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative w-full text-left rounded-3xl p-5 shadow-lg
        transition-all duration-300 active:scale-95
        ${done ? 'bg-gradient-to-br from-emerald-400 to-green-600 ring-4 ring-green-300/50' : `bg-gradient-to-br ${gradient}`}
        ${isWeekly && !done ? 'animate-weekly-pulse' : ''}
        ${popping ? 'animate-pop' : ''}
      `}
    >
      {/* Weekly badge */}
      {isWeekly && (
        <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
          📅 Weekly
        </div>
      )}

      {/* Confetti burst on complete */}
      {popping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {['🎉', '⭐', '✨', '🌟'].map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-burst"
              style={{ animationDelay: `${i * 80}ms`, transform: `rotate(${i * 90}deg) translateY(-40px)` }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className={`text-5xl transition-transform duration-300 ${done ? 'scale-110' : ''}`}>
          {done ? '✅' : task.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-extrabold text-xl text-white drop-shadow ${done ? 'line-through opacity-80' : ''}`}>
            {task.title}
          </p>
          {done && <p className="text-sm text-white/80 font-medium">Nice one, Caleb! 💪</p>}
          {isWeekly && !done && (
            <p className="text-xs text-white/70 font-medium mt-0.5">Complete once this week</p>
          )}
        </div>
        {!done && (
          <span className="text-white/60 text-3xl">○</span>
        )}
      </div>
    </button>
  );
}
