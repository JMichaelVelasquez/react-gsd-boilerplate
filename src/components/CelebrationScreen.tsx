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
      {/* Floating emojis — scale up on larger screens */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-3xl md:text-4xl lg:text-5xl animate-float"
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

      <div className="relative text-center px-6 md:px-12 lg:px-20 max-w-3xl mx-auto">
        <div className="text-8xl md:text-9xl lg:text-[10rem] mb-6 md:mb-8 animate-bounce">🎮</div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-3 md:mb-4 drop-shadow-lg">
          Screen Time
          <br />
          Unlocked!
        </h1>
        <p className="text-xl md:text-2xl lg:text-3xl text-white/90 font-medium mb-2 md:mb-3">
          All tasks done — amazing work, Caleb! 🏆
        </p>
        <p className="text-lg md:text-xl lg:text-2xl text-white/70 mb-8 md:mb-10">
          You&apos;ve earned your screen time. Enjoy! 🕹️
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-4 md:px-12 md:py-5 bg-white text-purple-600 font-extrabold text-xl md:text-2xl rounded-full shadow-xl
            hover:bg-purple-50 active:scale-95 transition-all"
        >
          Back to Tasks ←
        </button>
      </div>
    </div>
  );
}
