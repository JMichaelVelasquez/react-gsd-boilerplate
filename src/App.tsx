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
        bonusTasks={store.bonusTasks}
        currentWeek={store.state.currentWeek}
        todayProgress={store.todayProgress}
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
        bonusTasks={store.bonusTasks}
        todayProgress={store.todayProgress}
        completedCount={store.completedCount}
        allDailyDone={store.allDailyDone}
        onToggleTask={store.toggleTask}
        onOpenParent={() => setShowPinLogin(true)}
      />
    </>
  );
}
