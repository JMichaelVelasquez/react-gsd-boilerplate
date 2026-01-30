import { useState } from 'react';
import type { Task, DayProgress } from '../types';
import TaskCard from '../components/TaskCard';
import BonusTaskCard from '../components/BonusTaskCard';
import ProgressBar from '../components/ProgressBar';
import CelebrationScreen from '../components/CelebrationScreen';

interface Props {
  dailyTasks: Task[];
  activeDailyTasks: Task[];
  bonusTasks: Task[];
  todayProgress: DayProgress;
  completedCount: number;
  allDailyDone: boolean;
  onToggleTask: (taskId: string) => void;
  onOpenParent: () => void;
}

export default function CalebView({
  dailyTasks,
  activeDailyTasks,
  bonusTasks,
  todayProgress,
  completedCount,
  allDailyDone,
  onToggleTask,
  onOpenParent,
}: Props) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  // Show celebration once when all done
  if (allDailyDone && !celebrationShown && !showCelebration) {
    setShowCelebration(true);
    setCelebrationShown(true);
  }

  const skippedTasks = dailyTasks.filter((t) => todayProgress.skippedTaskIds.includes(t.id));

  const today = new Date();
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <>
      {showCelebration && <CelebrationScreen onClose={() => setShowCelebration(false)} />}

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

          {/* Progress bar */}
          <div className="mt-4 text-white">
            <ProgressBar completed={completedCount} total={activeDailyTasks.length} />
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
        </header>

        {/* Daily tasks */}
        <main className="px-5 pb-8">
          <section>
            <h2 className="text-lg font-bold text-white/90 mb-3 flex items-center gap-2">
              ⚔️ Today&apos;s Quests
            </h2>
            <div className="space-y-3">
              {activeDailyTasks.map((task) => (
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

          {/* Bonus tasks */}
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
