import { useState, useCallback } from 'react';
import type { Task, DayProgress } from '../types';
import TaskCard from '../components/TaskCard';
import BonusTaskCard from '../components/BonusTaskCard';
import ProgressBar from '../components/ProgressBar';
import CelebrationScreen from '../components/CelebrationScreen';
import NotificationBanner from '../components/NotificationBanner';
import StreakCounter from '../components/StreakCounter';
import StarCounter from '../components/StarCounter';
import StarBurst from '../components/StarBurst';

interface Props {
  todayTasks: Task[];
  activeTodayTasks: Task[];
  bonusTasks: Task[];
  todayProgress: DayProgress;
  completedCount: number;
  totalActiveCount: number;
  allDailyDone: boolean;
  bonusStars: number;
  todayBonusCompleted: number;
  currentStreak: number;
  onToggleTask: (taskId: string) => void;
  onOpenParent: () => void;
}

export default function CalebView({
  todayTasks,
  activeTodayTasks,
  bonusTasks,
  todayProgress,
  completedCount,
  totalActiveCount,
  allDailyDone,
  bonusStars,
  todayBonusCompleted,
  currentStreak,
  onToggleTask,
  onOpenParent,
}: Props) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [showStarBurst, setShowStarBurst] = useState(false);

  // Show celebration once when all done
  if (allDailyDone && !celebrationShown && !showCelebration) {
    setShowCelebration(true);
    setCelebrationShown(true);
  }

  const handleStarEarned = useCallback(() => {
    setShowStarBurst(true);
  }, []);

  const skippedTasks = todayTasks.filter((t) => todayProgress.skippedTaskIds.includes(t.id));

  const today = new Date();
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });

  const noTasksToday = todayTasks.length === 0;

  return (
    <>
      {showCelebration && <CelebrationScreen onClose={() => setShowCelebration(false)} />}
      {showStarBurst && <StarBurst onDone={() => setShowStarBurst(false)} />}

      <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400">
        {/* Header */}
        <header className="pt-6 pb-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-md">
                Hey Caleb! 👋
              </h1>
              <p className="text-white/80 font-medium text-sm mt-1">
                {dayName}&apos;s Quests
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenParent}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center
                text-white/60 hover:bg-white/30 transition-colors text-sm"
              title="Parent mode"
            >
              ⚙️
            </button>
          </div>

          {/* Streak + Stars row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StreakCounter streak={currentStreak} />
            <StarCounter totalStars={bonusStars} todayStars={todayBonusCompleted} />
          </div>

          {!noTasksToday && (
            <>
              {/* Notification banner */}
              <div className="mt-3 animate-slide-down">
                <NotificationBanner
                  completedCount={completedCount}
                  totalCount={totalActiveCount}
                  allDone={allDailyDone}
                />
              </div>

              {/* Progress bar */}
              <div className="mt-4 text-white">
                <ProgressBar completed={completedCount} total={totalActiveCount} />
              </div>

              {/* Unlocked banner if done */}
              {allDailyDone && (
                <button
                  type="button"
                  onClick={() => setShowCelebration(true)}
                  className="mt-3 w-full py-3 bg-green-400/90 rounded-2xl text-center font-black text-white text-lg shadow-lg
                    active:scale-95 transition-transform animate-pulse"
                >
                  🎮 Screen Time Unlocked! Tap to celebrate!
                </button>
              )}
            </>
          )}
        </header>

        {/* Tasks */}
        <main className="px-5 pb-8">
          {noTasksToday ? (
            /* No tasks scheduled for today */
            <section className="text-center py-12">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">
                No Tasks Today!
              </h2>
              <p className="text-white/80 font-medium text-lg">
                Enjoy your free day, Caleb! 🌟
              </p>
            </section>
          ) : (
            /* Today's scheduled tasks */
            <section>
              <h2 className="text-lg font-bold text-white/90 mb-3 flex items-center gap-2">
                ⚔️ Today&apos;s Quests
              </h2>
              <div className="space-y-3">
                {activeTodayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={todayProgress.completedTaskIds.includes(task.id)}
                    skipped={false}
                    onToggle={() => onToggleTask(task.id)}
                  />
                ))}
                {skippedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={false}
                    skipped={true}
                    onToggle={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Bonus tasks — always available */}
          {bonusTasks.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-white/90 mb-3 flex items-center gap-2">
                ⭐ Bonus Challenges
              </h2>
              <div className="space-y-3">
                {bonusTasks.map((task) => (
                  <BonusTaskCard
                    key={task.id}
                    task={task}
                    done={todayProgress.completedTaskIds.includes(task.id)}
                    onToggle={() => onToggleTask(task.id)}
                    onStarEarned={handleStarEarned}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
