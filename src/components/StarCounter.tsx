interface Props {
  totalStars: number;
  todayStars: number;
}

export default function StarCounter({ totalStars, todayStars }: Props) {
  if (totalStars === 0 && todayStars === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 bg-yellow-400/90 text-yellow-900 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-sm md:text-base shadow-md">
      <span className="text-lg md:text-xl">⭐</span>
      <span>{totalStars} star{totalStars !== 1 ? 's' : ''}</span>
      {todayStars > 0 && (
        <span className="text-xs md:text-sm bg-yellow-600/30 text-yellow-800 px-1.5 py-0.5 rounded-full">
          +{todayStars} today
        </span>
      )}
    </div>
  );
}
