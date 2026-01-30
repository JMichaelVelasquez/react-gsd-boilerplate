import { useState } from 'react';
import type { ViewMode } from './types';
import { useAppStore } from './store/useAppStore';
import CalebView from './pages/CalebView';
import ParentView from './pages/ParentView';
import PinLogin from './components/PinLogin';

export default function App() {
  const store = useAppStore();
  const [view, setView] = useState<ViewMode>('caleb');
  const [showPinLogin, setShowPinLogin] = useState(false);

  if (view === 'parent') {
    return (
      <ParentView
        tasks={store.state.tasks}
        dailyTasks={store.dailyTasks}
        weeklyTasks={store.weeklyTasks}
        bonusTasks={store.bonusTasks}
        currentWeek={store.state.currentWeek}
        todayProgress={store.todayProgress}
        weekHistory={store.state.weekHistory || []}
        bonusStars={store.state.bonusStars || 0}
        currentStreak={store.currentStreak}
        onAddTask={store.addTask}
        onEditTask={store.editTask}
        onRemoveTask={store.removeTask}
        onToggleSkip={store.toggleSkip}
        onResetWeek={store.resetWeek}
        onBack={() => setView('caleb')}
      />
    );
  }

  return (
    <>
      {showPinLogin && (
        <PinLogin
          correctPin={store.state.parentPin}
          onSuccess={() => {
            setShowPinLogin(false);
            setView('parent');
          }}
          onCancel={() => setShowPinLogin(false)}
        />
      )}

      <CalebView
        dailyTasks={store.dailyTasks}
        activeDailyTasks={store.activeDailyTasks}
        weeklyTasks={store.weeklyTasks}
        activeWeeklyTasks={store.activeWeeklyTasks}
        bonusTasks={store.bonusTasks}
        todayProgress={store.todayProgress}
        weeklyCompletedTaskIds={store.state.currentWeek.weeklyCompletedTaskIds || []}
        completedCount={store.completedCount}
        totalActiveCount={store.totalActiveCount}
        allDailyDone={store.allDailyDone}
        bonusStars={store.state.bonusStars || 0}
        todayBonusCompleted={store.todayBonusCompleted}
        currentStreak={store.currentStreak}
        onToggleTask={store.toggleTask}
        onOpenParent={() => setShowPinLogin(true)}
      />
    </>
  );
}
