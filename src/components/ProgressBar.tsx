interface Props {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-bold mb-1">
        <span>
          {completed} / {total} done
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-5 bg-white/20 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #34d399, #10b981, #059669)'
              : 'linear-gradient(90deg, #fbbf24, #f59e0b, #f97316)',
          }}
        />
      </div>
    </div>
  );
}
