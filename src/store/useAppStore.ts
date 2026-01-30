import { useCallback, useMemo } from 'react';
import type { AppState, Task, DayProgress, WeekData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { todayStr, getMonday, uid, weekDates } from '../utils/dates';

// ── Default data ────────────────────────────────────────────────

const DEFAULT_TASKS: Task[] = [
  { id: 'default-1', title: 'Read for 30 mins', emoji: '📚', isBonus: false, createdAt: new Date().toISOString() },
  { id: 'default-2', title: 'TTRS (Maths)', emoji: '🔢', isBonus: false, createdAt: new Date().toISOString() },
  { id: 'default-3', title: 'Handwriting', emoji: '✍️', isBonus: false, createdAt: new Date().toISOString() },
];

function emptyWeek(monday: string): WeekData {
  return {
    weekStart: monday,
    days: weekDates(monday).map((date) => ({
      date,
      completedTaskIds: [],
      skippedTaskIds: [],
    })),
  };
}

const INITIAL_STATE: AppState = {
  tasks: DEFAULT_TASKS,
  currentWeek: emptyWeek(getMonday()),
  parentPin: '1234',
};

// ── Hook ────────────────────────────────────────────────────────

export function useAppStore() {
  const [state, setState] = useLocalStorage<AppState>('calebs-quest', INITIAL_STATE);

  // Auto-reset: if stored week is stale, create new week
  const ensuredState = useMemo(() => {
    const thisMonday = getMonday();
    if (state.currentWeek.weekStart !== thisMonday) {
      const fresh: AppState = { ...state, currentWeek: emptyWeek(thisMonday) };
      // Side effect inside useMemo is intentional for one-time migration
      window.localStorage.setItem('calebs-quest', JSON.stringify(fresh));
      return fresh;
    }
    return state;
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
        const days = prev.currentWeek.days.map((d) => (d.date === date ? updater(d) : d));
        return { ...prev, currentWeek: { ...prev.currentWeek, days } };
      });
    },
    [setState],
  );

  // ── Caleb actions ──

  const toggleTask = useCallback(
    (taskId: string) => {
      updateDay(today, (day) => {
        const completed = day.completedTaskIds.includes(taskId)
          ? day.completedTaskIds.filter((id) => id !== taskId)
          : [...day.completedTaskIds, taskId];
        return { ...day, completedTaskIds: completed };
      });
    },
    [today, updateDay],
  );

  // ── Parent actions ──

  const addTask = useCallback(
    (title: string, emoji: string, isBonus: boolean) => {
      const task: Task = { id: uid(), title, emoji, isBonus, createdAt: new Date().toISOString() };
      setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    },
    [setState],
  );

  const editTask = useCallback(
    (id: string, updates: Partial<Pick<Task, 'title' | 'emoji' | 'isBonus'>>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [setState],
  );

  const removeTask = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
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
    setState((prev) => ({ ...prev, currentWeek: emptyWeek(getMonday()) }));
  }, [setState]);

  const changePin = useCallback(
    (pin: string) => {
      setState((prev) => ({ ...prev, parentPin: pin }));
    },
    [setState],
  );

  // ── Derived ──

  const dailyTasks = useMemo(() => ensuredState.tasks.filter((t) => !t.isBonus), [ensuredState.tasks]);
  const bonusTasks = useMemo(() => ensuredState.tasks.filter((t) => t.isBonus), [ensuredState.tasks]);

  /** Daily tasks that aren't skipped today */
  const activeDailyTasks = useMemo(
    () => dailyTasks.filter((t) => !todayProgress.skippedTaskIds.includes(t.id)),
    [dailyTasks, todayProgress],
  );

  const completedCount = useMemo(
    () => activeDailyTasks.filter((t) => todayProgress.completedTaskIds.includes(t.id)).length,
    [activeDailyTasks, todayProgress],
  );

  const allDailyDone = activeDailyTasks.length > 0 && completedCount === activeDailyTasks.length;

  return {
    state: ensuredState,
    today,
    todayProgress,
    dailyTasks,
    bonusTasks,
    activeDailyTasks,
    completedCount,
    allDailyDone,
    toggleTask,
    addTask,
    editTask,
    removeTask,
    toggleSkip,
    resetWeek,
    changePin,
  };
}
