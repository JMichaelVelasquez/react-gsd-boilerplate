import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export default function StarBurst({ onDone }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Central star — scales on larger screens */}
        <span className="text-7xl md:text-8xl lg:text-9xl animate-star-grow block">⭐</span>
        {/* Orbiting particles */}
        {['✨', '🌟', '💫', '⭐', '✨', '🌟'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl lg:text-4xl animate-star-orbit"
            style={{
              animationDelay: `${i * 150}ms`,
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 60}deg) translateY(-70px)`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
      {/* Text */}
      <div className="absolute bottom-1/3 animate-star-text">
        <p className="text-2xl md:text-3xl lg:text-4xl font-black text-yellow-300 drop-shadow-lg text-center">
          ⭐ Bonus Star Earned! ⭐
        </p>
      </div>
    </div>
  );
}
