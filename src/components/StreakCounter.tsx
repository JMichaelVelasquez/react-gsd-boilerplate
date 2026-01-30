interface Props {
  streak: number;
}

export default function StreakCounter({ streak }: Props) {
  if (streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 bg-orange-500/90 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-md">
      <span className="text-lg">🔥</span>
      <span>{streak} week{streak > 1 ? 's' : ''} streak!</span>
    </div>
  );
}
