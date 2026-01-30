import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  done: boolean;
  onToggle: () => void;
  onStarEarned?: () => void;
}

export default function BonusTaskCard({ task, done, onToggle, onStarEarned }: Props) {
  const [popping, setPopping] = useState(false);

  const handleClick = () => {
    if (!done) {
      setPopping(true);
      setTimeout(() => setPopping(false), 600);
      onStarEarned?.();
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative w-full text-left rounded-2xl p-4 shadow-md border-2 border-dashed
        transition-all duration-300 active:scale-95
        ${done
          ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300/50'
          : 'bg-white/90 border-purple-300 hover:border-purple-400'
        }
        ${popping ? 'animate-pop' : ''}
      `}
    >
      {/* Star reward badge */}
      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
        ⭐ +1 Star
      </div>

      {popping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {['⭐', '🌟', '✨', '💫'].map((e, i) => (
            <span
              key={i}
              className="absolute text-xl animate-burst"
              style={{ animationDelay: `${i * 100}ms`, transform: `rotate(${i * 90}deg) translateY(-40px)` }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-3xl">{done ? '🌟' : task.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base ${done ? 'text-yellow-700 line-through' : 'text-gray-800'}`}>
            {task.title}
          </p>
          <p className="text-xs text-purple-500 font-medium">
            {done ? '⭐ Star earned!' : '⭐ Bonus challenge — earn a star!'}
          </p>
        </div>
        {done ? (
          <span className="text-yellow-500 text-2xl">✔️</span>
        ) : (
          <span className="text-purple-300 text-2xl">○</span>
        )}
      </div>
    </button>
  );
}
