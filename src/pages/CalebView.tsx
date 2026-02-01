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
  childName?: string;
  childEmoji?: string;
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
  childName = 'Caleb',
  childEmoji = '👋',
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
        {/* Responsive container: mobile full-width → tablet centered → desktop sidebar layout */}
        <div className="mx-auto md:max-w-3xl lg:max-w-6xl xl:max-w-7xl px-5 md:px-8 lg:flex lg:gap-8 lg:min-h-screen">

          {/* ── Header (mobile/tablet) / Sidebar (desktop) ── */}
          <header className="pt-6 pb-4 lg:w-80 xl:w-96 lg:shrink-0 lg:pt-10 lg:pb-10 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
            {/* Desktop sidebar glass card */}
            <div className="lg:bg-white/10 lg:backdrop-blur-md lg:rounded-3xl lg:p-6 lg:shadow-xl lg:border lg:border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black text-white drop-shadow-md">
                    Hey {childName}! {childEmoji}
                  </h1>
                  <p className="text-white/80 font-medium text-sm md:text-base lg:text-lg mt-1">
                    {dayName}&apos;s Quests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenParent}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center
                    text-white/60 hover:bg-white/30 transition-colors text-sm md:text-base"
                  title="Parent mode"
                >
                  ⚙️
                </button>
              </div>

              {/* Streak + Stars row */}
              <div className="flex items-center gap-2 mt-3 lg:mt-5 flex-wrap">
                <StreakCounter streak={currentStreak} />
                <StarCounter totalStars={bonusStars} todayStars={todayBonusCompleted} />
              </div>

              {!noTasksToday && (
                <>
                  {/* Notification banner */}
                  <div className="mt-3 lg:mt-5 animate-slide-down">
                    <NotificationBanner
                      completedCount={completedCount}
                      totalCount={totalActiveCount}
                      allDone={allDailyDone}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 lg:mt-5 text-white">
                    <ProgressBar completed={completedCount} total={totalActiveCount} />
                  </div>

                  {/* Unlocked banner if done */}
                  {allDailyDone && (
                    <button
                      type="button"
                      onClick={() => setShowCelebration(true)}
                      className="mt-3 lg:mt-5 w-full py-3 md:py-4 bg-green-400/90 rounded-2xl text-center font-black text-white
                        text-lg md:text-xl shadow-lg active:scale-95 transition-transform animate-pulse"
                    >
                      🎮 Screen Time Unlocked! Tap to celebrate!
                    </button>
                  )}
                </>
              )}
            </div>
          </header>

          {/* ── Tasks ── */}
          <main className="pb-8 lg:flex-1 lg:pt-10 lg:pb-10">
            {noTasksToday ? (
              /* No tasks scheduled for today */
              <section className="text-center py-12 md:py-16 lg:py-24">
                <div className="text-7xl md:text-8xl lg:text-9xl mb-4 md:mb-6">🎉</div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-md mb-2">
                  No Tasks Today!
                </h2>
                <p className="text-white/80 font-medium text-lg md:text-xl lg:text-2xl">
                  Enjoy your free day, {childName}! 🌟
                </p>
              </section>
            ) : (
              /* Today's scheduled tasks */
              <section>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white/90 mb-3 md:mb-4 flex items-center gap-2">
                  ⚔️ Today&apos;s Quests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
              <section className="mt-8 md:mt-10">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white/90 mb-3 md:mb-4 flex items-center gap-2">
                  ⭐ Bonus Challenges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
      </div>
    </>
  );
}
