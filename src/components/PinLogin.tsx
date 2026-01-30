import { useState } from 'react';

interface Props {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinLogin({ correctPin, onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      // Auto-submit on 4 digits
      if (next === correctPin) {
        setTimeout(() => onSuccess(), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-3xl p-8 md:p-10 shadow-2xl w-[320px] md:w-[380px] lg:w-[420px] text-center ${shake ? 'animate-shake' : ''}`}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">🔒 Parent Mode</h2>
        <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8">Enter PIN to continue</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 md:gap-4 mb-6 md:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? 'bg-red-500 scale-125'
                    : 'bg-purple-500 scale-125'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm md:text-base font-medium mb-4">Wrong PIN — try again</p>}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === '⌫') {
              return (
                <button
                  key="del"
                  type="button"
                  onClick={handleDelete}
                  className="h-14 md:h-16 lg:h-18 rounded-xl bg-gray-100 text-xl md:text-2xl font-bold text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDigit(key)}
                className="h-14 md:h-16 lg:h-18 rounded-xl bg-gray-100 text-xl md:text-2xl font-bold text-gray-800 hover:bg-purple-100 active:scale-95 transition-all"
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm md:text-base text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
