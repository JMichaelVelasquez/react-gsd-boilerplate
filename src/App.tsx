import { useState } from 'react';
import type { ViewMode } from './types';
import { useAppStore } from './store/useAppStore';
import CalebView from './pages/CalebView';
import ParentView from './pages/ParentView';
import PinLogin from './components/PinLogin';
import SyncIndicator from './components/SyncIndicator';

export default function App() {
  const store = useAppStore();
  const [view, setView] = useState<ViewMode>('caleb');
  const [showPinLogin, setShowPinLogin] = useState(false);

  if (view === 'parent') {
    return (
      <>
        <ParentView store={store} onBack={() => setView('caleb')} />
        <SyncIndicator status={store.syncStatus} />
      </>
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
        todayTasks={store.todayTasks}
        activeTodayTasks={store.activeTodayTasks}
        bonusTasks={store.bonusTasks}
        todayProgress={store.todayProgress}
        completedCount={store.completedCount}
        totalActiveCount={store.totalActiveCount}
        allDailyDone={store.allDailyDone}
        bonusStars={store.state.bonusStars || 0}
        todayBonusCompleted={store.todayBonusCompleted}
        currentStreak={store.currentStreak}
        onToggleTask={store.toggleTask}
        onOpenParent={() => setShowPinLogin(true)}
      />
      <SyncIndicator status={store.syncStatus} />
    </>
  );
}
