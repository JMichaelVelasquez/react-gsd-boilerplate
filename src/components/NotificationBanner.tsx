import { useMemo } from 'react';

interface Props {
  completedCount: number;
  totalCount: number;
  allDone: boolean;
}

export default function NotificationBanner({ completedCount, totalCount, allDone }: Props) {
  const remaining = totalCount - completedCount;

  const message = useMemo(() => {
    if (allDone) return '🎉 All tasks done! Amazing work!';
    if (totalCount === 0) return '📋 No tasks today!';
    if (remaining === 1) return '🔥 Just 1 more! You can do it!';
    if (completedCount === 0) return `💪 ${remaining} tasks today! You've got this!`;

    const pct = completedCount / totalCount;
    if (pct >= 0.75) return `🚀 Almost there! Just ${remaining} left!`;
    if (pct >= 0.5) return `⚡ Halfway done! ${remaining} to go!`;
    if (pct >= 0.25) return `💪 Great start! ${remaining} tasks left!`;
    return `✨ ${remaining} tasks left today! You've got this!`;
  }, [completedCount, totalCount, remaining, allDone]);

  // End-of-day nudge (after 5pm)
  const hour = new Date().getHours();
  const isEvening = hour >= 17;
  const showNudge = isEvening && !allDone && remaining > 0;

  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl px-4 py-3 md:px-5 md:py-4 text-center font-bold text-sm md:text-base lg:text-lg shadow-md transition-all duration-500 ${
          allDone
            ? 'bg-green-400/90 text-white'
            : 'bg-white/20 backdrop-blur-sm text-white'
        }`}
      >
        {message}
      </div>
      {showNudge && (
        <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 text-center font-semibold text-xs md:text-sm bg-amber-400/90 text-amber-900 shadow-md animate-pulse">
          🌙 Evening check-in: {remaining} task{remaining > 1 ? 's' : ''} still to finish!
        </div>
      )}
    </div>
  );
}
