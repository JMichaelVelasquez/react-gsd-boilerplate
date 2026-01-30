import { useCallback, useMemo } from 'react';
import type { AppState, Task, DayProgress, WeekData, WeekHistory } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { todayStr, getMonday, uid, weekDates } from '../utils/dates';

// ── Default data ────────────────────────────────────────────────

const DEFAULT_TASKS: Task[] = [
  { id: 'default-1', title: 'Read for 30 mins', emoji: '📚', isBonus: false, frequency: 'daily', createdAt: new Date().toISOString() },
  { id: 'default-2', title: 'TTRS (Maths)', emoji: '🔢', isBonus: false, frequency: 'daily', createdAt: new Date().toISOString() },
  { id: 'default-3', title: 'Handwriting', emoji: '✍️', isBonus: false, frequency: 'daily', createdAt: new Date().toISOString() },
];

function emptyWeek(monday: string): WeekData {
  return {
    weekStart: monday,
    days: weekDates(monday).map((date) => ({
      date,
      completedTaskIds: [],
      skippedTaskIds: [],
    })),
    weeklyCompletedTaskIds: [],
  };
}

const INITIAL_STATE: AppState = {
  tasks: DEFAULT_TASKS,
  currentWeek: emptyWeek(getMonday()),
  parentPin: '1234',
  weekHistory: [],
  bonusStars: 0,
};

// ── Migration: ensure old data gets new fields ──────────────────

function migrateState(state: AppState): AppState {
  let migrated = { ...state };

  // Ensure tasks have frequency field
  migrated.tasks = migrated.tasks.map((t) => ({
    ...t,
    frequency: t.frequency || 'daily',
  }));

  // Ensure currentWeek has weeklyCompletedTaskIds
  if (!migrated.currentWeek.weeklyCompletedTaskIds) {
    migrated.currentWeek = {
      ...migrated.currentWeek,
      weeklyCompletedTaskIds: [],
    };
  }

  // Ensure weekHistory exists
  if (!migrated.weekHistory) {
    migrated.weekHistory = [];
  }

  // Ensure bonusStars exists
  if (migrated.bonusStars === undefined) {
    migrated.bonusStars = 0;
  }

  return migrated;
}

// ── Hook ────────────────────────────────────────────────────────

export function useAppStore() {
  const [state, setState] = useLocalStorage<AppState>('calebs-quest', INITIAL_STATE);

  // Migrate + auto-reset stale week
  const ensuredState = useMemo(() => {
    let s = migrateState(state);
    const thisMonday = getMonday();
    if (s.currentWeek.weekStart !== thisMonday) {
      // Archive the old week before resetting
      const oldWeek = s.currentWeek;
      const allTasks = s.tasks.filter((t) => !t.isBonus);
      const weeklyTasks = allTasks.filter((t) => t.frequency === 'weekly');
      const dailyTasks = allTasks.filter((t) => t.frequency === 'daily');

      // Count completions
      let totalExpected = 0;
      let totalCompleted = 0;

      // Daily tasks: count each day
      for (const day of oldWeek.days) {
        for (const task of dailyTasks) {
          if (!day.skippedTaskIds.includes(task.id)) {
            totalExpected++;
            if (day.completedTaskIds.includes(task.id)) {
              totalCompleted++;
            }
          }
        }
      }

      // Weekly tasks
      for (const task of weeklyTasks) {
        totalExpected++;
        if (oldWeek.weeklyCompletedTaskIds?.includes(task.id)) {
          totalCompleted++;
        }
      }

      // Count bonus stars from old week
      const bonusTasks = s.tasks.filter((t) => t.isBonus);
      let weekBonusStars = 0;
      for (const day of oldWeek.days) {
        for (const bt of bonusTasks) {
          if (day.completedTaskIds.includes(bt.id)) {
            weekBonusStars++;
          }
        }
      }

      const pct = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
      const historyEntry: WeekHistory = {
        weekStart: oldWeek.weekStart,
        completionPct: pct,
        totalTasks: totalExpected,
        completedTasks: totalCompleted,
        bonusStarsEarned: weekBonusStars,
      };

      const fresh: AppState = {
        ...s,
        currentWeek: emptyWeek(thisMonday),
        weekHistory: [...(s.weekHistory || []), historyEntry],
      };
      window.localStorage.setItem('calebs-quest', JSON.stringify(fresh));
      return fresh;
    }
    return s;
  }, [state]);

  const today = todayStr();

  const todayProgress: DayProgress = useMemo(
    () => ensuredState.currentWeek.days.find((d) => d.date === today) ?? { date: today, completedTaskIds: [], skippedTaskIds: [] },
    [ensuredState, today],
  );

  // ── Helpers to update a specific day ──

  const updateDay = useCallback(
    (date: string, updater: (day: DayProgress) => DayProgress) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const days = migrated.currentWeek.days.map((d) => (d.date === date ? updater(d) : d));
        return { ...migrated, currentWeek: { ...migrated.currentWeek, days } };
      });
    },
    [setState],
  );

  // ── Caleb actions ──

  const toggleTask = useCallback(
    (taskId: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const task = migrated.tasks.find((t) => t.id === taskId);
        if (!task) return migrated;

        // Weekly task: toggle in weeklyCompletedTaskIds
        if (task.frequency === 'weekly' && !task.isBonus) {
          const weeklyCompleted = migrated.currentWeek.weeklyCompletedTaskIds || [];
          const newWeeklyCompleted = weeklyCompleted.includes(taskId)
            ? weeklyCompleted.filter((id) => id !== taskId)
            : [...weeklyCompleted, taskId];
          return {
            ...migrated,
            currentWeek: {
              ...migrated.currentWeek,
              weeklyCompletedTaskIds: newWeeklyCompleted,
            },
          };
        }

        // Daily task or bonus: toggle in day progress
        const dayDate = todayStr();
        const days = migrated.currentWeek.days.map((d) => {
          if (d.date !== dayDate) return d;
          const wasCompleted = d.completedTaskIds.includes(taskId);
          const completed = wasCompleted
            ? d.completedTaskIds.filter((id) => id !== taskId)
            : [...d.completedTaskIds, taskId];

          return { ...d, completedTaskIds: completed };
        });

        // Track bonus stars: if completing (not uncompleting) a bonus task, add a star
        let newBonusStars = migrated.bonusStars;
        if (task.isBonus) {
          const dayProgress = migrated.currentWeek.days.find((d) => d.date === dayDate);
          const wasCompleted = dayProgress?.completedTaskIds.includes(taskId) ?? false;
          if (!wasCompleted) {
            newBonusStars += 1;
          }
          // Note: we don't remove stars when uncompleting — stars are earned permanently
        }

        return {
          ...migrated,
          bonusStars: newBonusStars,
          currentWeek: { ...migrated.currentWeek, days },
        };
      });
    },
    [setState],
  );

  // ── Parent actions ──

  const addTask = useCallback(
    (title: string, emoji: string, isBonus: boolean, frequency: 'daily' | 'weekly' = 'daily') => {
      const task: Task = { id: uid(), title, emoji, isBonus, frequency: isBonus ? 'daily' : frequency, createdAt: new Date().toISOString() };
      setState((prev) => {
        const migrated = migrateState(prev);
        return { ...migrated, tasks: [...migrated.tasks, task] };
      });
    },
    [setState],
  );

  const editTask = useCallback(
    (id: string, updates: Partial<Pick<Task, 'title' | 'emoji' | 'isBonus' | 'frequency'>>) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        return {
          ...migrated,
          tasks: migrated.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        };
      });
    },
    [setState],
  );

  const removeTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        return { ...migrated, tasks: migrated.tasks.filter((t) => t.id !== id) };
      });
    },
    [setState],
  );

  const toggleSkip = useCallback(
    (taskId: string, date: string = today) => {
      updateDay(date, (day) => {
        const skipped = day.skippedTaskIds.includes(taskId)
          ? day.skippedTaskIds.filter((id) => id !== taskId)
          : [...day.skippedTaskIds, taskId];
        return { ...day, skippedTaskIds: skipped };
      });
    },
    [today, updateDay],
  );

  const resetWeek = useCallback(() => {
    setState((prev) => {
      const migrated = migrateState(prev);
      return { ...migrated, currentWeek: emptyWeek(getMonday()) };
    });
  }, [setState]);

  const changePin = useCallback(
    (pin: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        return { ...migrated, parentPin: pin };
      });
    },
    [setState],
  );

  // ── Derived ──

  const dailyTasks = useMemo(() => ensuredState.tasks.filter((t) => !t.isBonus && t.frequency === 'daily'), [ensuredState.tasks]);
  const weeklyTasks = useMemo(() => ensuredState.tasks.filter((t) => !t.isBonus && t.frequency === 'weekly'), [ensuredState.tasks]);
  const bonusTasks = useMemo(() => ensuredState.tasks.filter((t) => t.isBonus), [ensuredState.tasks]);

  /** Daily tasks that aren't skipped today */
  const activeDailyTasks = useMemo(
    () => dailyTasks.filter((t) => !todayProgress.skippedTaskIds.includes(t.id)),
    [dailyTasks, todayProgress],
  );

  /** Weekly tasks that aren't skipped */
  const activeWeeklyTasks = useMemo(
    () => weeklyTasks.filter((t) => !todayProgress.skippedTaskIds.includes(t.id)),
    [weeklyTasks, todayProgress],
  );

  const completedDailyCount = useMemo(
    () => activeDailyTasks.filter((t) => todayProgress.completedTaskIds.includes(t.id)).length,
    [activeDailyTasks, todayProgress],
  );

  const completedWeeklyCount = useMemo(
    () => activeWeeklyTasks.filter((t) => (ensuredState.currentWeek.weeklyCompletedTaskIds || []).includes(t.id)).length,
    [activeWeeklyTasks, ensuredState.currentWeek],
  );

  const totalActiveCount = activeDailyTasks.length + activeWeeklyTasks.length;
  const totalCompletedCount = completedDailyCount + completedWeeklyCount;
  const allDailyDone = totalActiveCount > 0 && totalCompletedCount === totalActiveCount;

  // ── Bonus stars from today ──
  const todayBonusCompleted = useMemo(
    () => bonusTasks.filter((t) => todayProgress.completedTaskIds.includes(t.id)).length,
    [bonusTasks, todayProgress],
  );

  // ── Streak calculation ──
  const currentStreak = useMemo(() => {
    const history = ensuredState.weekHistory || [];
    if (history.length === 0) return 0;
    let streak = 0;
    // Walk backwards through history
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].completionPct === 100) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [ensuredState.weekHistory]);

  return {
    state: ensuredState,
    today,
    todayProgress,
    dailyTasks,
    weeklyTasks,
    bonusTasks,
    activeDailyTasks,
    activeWeeklyTasks,
    completedCount: totalCompletedCount,
    completedDailyCount,
    completedWeeklyCount,
    totalActiveCount,
    allDailyDone,
    todayBonusCompleted,
    currentStreak,
    toggleTask,
    addTask,
    editTask,
    removeTask,
    toggleSkip,
    resetWeek,
    changePin,
  };
}
