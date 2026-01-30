import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
}

export default function CelebrationScreen({ onClose }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700
        ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}
      style={{
        background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #f59e0b)',
      }}
    >
      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-3xl animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            {['🎮', '🎉', '⭐', '🏆', '🥳', '🎊', '✨', '🌟', '🕹️', '💫'][i % 10]}
          </span>
        ))}
      </div>

      <div className="relative text-center px-6">
        <div className="text-8xl mb-6 animate-bounce">🎮</div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 drop-shadow-lg">
          Screen Time
          <br />
          Unlocked!
        </h1>
        <p className="text-xl text-white/90 font-medium mb-2">
          All tasks done — amazing work, Caleb! 🏆
        </p>
        <p className="text-lg text-white/70 mb-8">
          You&apos;ve earned your screen time. Enjoy! 🕹️
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-4 bg-white text-purple-600 font-extrabold text-xl rounded-full shadow-xl
            hover:bg-purple-50 active:scale-95 transition-all"
        >
          Back to Tasks ←
        </button>
      </div>
    </div>
  );
}
