import { useCallback, useMemo } from 'react';
import type { AppState, Task, DayProgress, WeekData, WeekHistory, DayOfWeek, WeeklySchedule, WeeklyTemplate } from '../types';
import { ALL_DAYS } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { todayStr, getMonday, uid, weekDates, getDayOfWeek, dateToDayOfWeek } from '../utils/dates';

// ── Default data ────────────────────────────────────────────────

const DEFAULT_TASKS: Task[] = [
  { id: 'default-1', title: 'Read for 30 mins', emoji: '📚', isBonus: false, createdAt: new Date().toISOString() },
  { id: 'default-2', title: 'TTRS (Maths)', emoji: '🔢', isBonus: false, createdAt: new Date().toISOString() },
  { id: 'default-3', title: 'Handwriting', emoji: '✍️', isBonus: false, createdAt: new Date().toISOString() },
];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  mon: ['default-1', 'default-2', 'default-3'],
  tue: ['default-1', 'default-2', 'default-3'],
  wed: ['default-1', 'default-2', 'default-3'],
  thu: ['default-1', 'default-2', 'default-3'],
  fri: ['default-1', 'default-2', 'default-3'],
  sat: [],
  sun: [],
};

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
  weeklySchedule: DEFAULT_SCHEDULE,
  currentWeek: emptyWeek(getMonday()),
  parentPin: '1234',
  weekHistory: [],
  bonusStars: 0,
  templates: [],
};

// ── Migration: ensure old data gets new fields ──────────────────

function migrateState(raw: unknown): AppState {
  const state = raw as Record<string, unknown>;
  if (!state || typeof state !== 'object') return INITIAL_STATE;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as any;

  // Phase 3 migration: from global tasks to per-day schedule
  if (!s.weeklySchedule) {
    const oldTasks: Array<{ id: string; title: string; emoji: string; isBonus?: boolean; frequency?: string; createdAt?: string }> = s.tasks || [];

    // Strip frequency field, build clean Task objects
    const newTasks: Task[] = oldTasks.map((t) => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji,
      isBonus: t.isBonus || false,
      createdAt: t.createdAt || new Date().toISOString(),
    }));

    // All non-bonus tasks → schedule on ALL days (so nothing breaks)
    const regularTaskIds = newTasks.filter((t) => !t.isBonus).map((t) => t.id);
    const schedule: WeeklySchedule = {
      mon: [...regularTaskIds],
      tue: [...regularTaskIds],
      wed: [...regularTaskIds],
      thu: [...regularTaskIds],
      fri: [...regularTaskIds],
      sat: [...regularTaskIds],
      sun: [...regularTaskIds],
    };

    // Preserve current week data, merge old weeklyCompletedTaskIds into today
    const currentWeek: WeekData = {
      weekStart: s.currentWeek?.weekStart || getMonday(),
      days: (s.currentWeek?.days || []).map((d: DayProgress) => ({
        date: d.date,
        completedTaskIds: d.completedTaskIds || [],
        skippedTaskIds: d.skippedTaskIds || [],
      })),
    };

    // If old format had weeklyCompletedTaskIds, merge them into today's progress
    const oldWeeklyCompleted: string[] = s.currentWeek?.weeklyCompletedTaskIds || [];
    if (oldWeeklyCompleted.length > 0) {
      const todayDate = todayStr();
      currentWeek.days = currentWeek.days.map((d: DayProgress) => {
        if (d.date === todayDate) {
          const merged = new Set([...d.completedTaskIds, ...oldWeeklyCompleted]);
          return { ...d, completedTaskIds: Array.from(merged) };
        }
        return d;
      });
    }

    // Ensure week has 7 days
    if (currentWeek.days.length === 0) {
      const mon = currentWeek.weekStart || getMonday();
      currentWeek.days = weekDates(mon).map((date) => ({
        date,
        completedTaskIds: [],
        skippedTaskIds: [],
      }));
    }

    return {
      tasks: newTasks,
      weeklySchedule: schedule,
      currentWeek,
      parentPin: s.parentPin || '1234',
      weekHistory: s.weekHistory || [],
      bonusStars: s.bonusStars || 0,
      templates: [],
    };
  }

  // Already phase 3 format — ensure all fields present
  const migrated: AppState = {
    tasks: (s.tasks || []).map((t: Task) => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji,
      isBonus: t.isBonus || false,
      createdAt: t.createdAt || new Date().toISOString(),
    })),
    weeklySchedule: s.weeklySchedule,
    currentWeek: s.currentWeek || emptyWeek(getMonday()),
    parentPin: s.parentPin || '1234',
    weekHistory: s.weekHistory || [],
    bonusStars: s.bonusStars ?? 0,
    templates: s.templates || [],
  };

  // Ensure schedule has all 7 days
  for (const day of ALL_DAYS) {
    if (!migrated.weeklySchedule[day]) {
      migrated.weeklySchedule[day] = [];
    }
  }

  return migrated;
}

// ── Hook ────────────────────────────────────────────────────────

export function useAppStore() {
  const [state, setState] = useLocalStorage<AppState>('calebs-quest', INITIAL_STATE);

  // Supabase sync — writes to cloud on every state change, listens for remote changes
  const { syncStatus } = useSupabaseSync(state, setState);

  // Migrate + auto-reset stale week
  const ensuredState = useMemo(() => {
    const s = migrateState(state);
    const thisMonday = getMonday();

    if (s.currentWeek.weekStart !== thisMonday) {
      // Archive the old week before resetting
      const oldWeek = s.currentWeek;
      const regularTasks = s.tasks.filter((t) => !t.isBonus);
      const bonusTasks = s.tasks.filter((t) => t.isBonus);

      let totalExpected = 0;
      let totalCompleted = 0;

      for (const day of oldWeek.days) {
        const dow = dateToDayOfWeek(day.date);
        const scheduledIds = s.weeklySchedule[dow] || [];

        for (const taskId of scheduledIds) {
          const task = regularTasks.find((t) => t.id === taskId);
          if (!task) continue;
          if (!day.skippedTaskIds.includes(taskId)) {
            totalExpected++;
            if (day.completedTaskIds.includes(taskId)) {
              totalCompleted++;
            }
          }
        }
      }

      // Count bonus stars from old week
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
  const todayDow = getDayOfWeek();

  const todayProgress: DayProgress = useMemo(
    () => ensuredState.currentWeek.days.find((d) => d.date === today) ?? { date: today, completedTaskIds: [], skippedTaskIds: [] },
    [ensuredState, today],
  );

  // ── Today's scheduled tasks ──

  const todayScheduledIds = useMemo(
    () => ensuredState.weeklySchedule[todayDow] || [],
    [ensuredState.weeklySchedule, todayDow],
  );

  const todayTasks = useMemo(
    () =>
      todayScheduledIds
        .map((id) => ensuredState.tasks.find((t) => t.id === id))
        .filter((t): t is Task => t != null && !t.isBonus),
    [todayScheduledIds, ensuredState.tasks],
  );

  const activeTodayTasks = useMemo(
    () => todayTasks.filter((t) => !todayProgress.skippedTaskIds.includes(t.id)),
    [todayTasks, todayProgress],
  );

  const bonusTasks = useMemo(() => ensuredState.tasks.filter((t) => t.isBonus), [ensuredState.tasks]);

  // ── Helpers ──

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

        const dayDate = todayStr();
        const days = migrated.currentWeek.days.map((d) => {
          if (d.date !== dayDate) return d;
          const wasCompleted = d.completedTaskIds.includes(taskId);
          const completed = wasCompleted
            ? d.completedTaskIds.filter((id) => id !== taskId)
            : [...d.completedTaskIds, taskId];
          return { ...d, completedTaskIds: completed };
        });

        // Track bonus stars (permanently earned)
        let newBonusStars = migrated.bonusStars;
        if (task.isBonus) {
          const dayProgress = migrated.currentWeek.days.find((d) => d.date === dayDate);
          const wasCompleted = dayProgress?.completedTaskIds.includes(taskId) ?? false;
          if (!wasCompleted) newBonusStars += 1;
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

  // ── Parent actions: Schedule management ──

  const addTaskToDay = useCallback(
    (title: string, emoji: string, day: DayOfWeek) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const task: Task = { id: uid(), title, emoji, isBonus: false, createdAt: new Date().toISOString() };
        const daySchedule = migrated.weeklySchedule[day] || [];

        return {
          ...migrated,
          tasks: [...migrated.tasks, task],
          weeklySchedule: {
            ...migrated.weeklySchedule,
            [day]: [...daySchedule, task.id],
          },
        };
      });
    },
    [setState],
  );

  const addBonusTask = useCallback(
    (title: string, emoji: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const task: Task = { id: uid(), title, emoji, isBonus: true, createdAt: new Date().toISOString() };
        return { ...migrated, tasks: [...migrated.tasks, task] };
      });
    },
    [setState],
  );

  const addExistingTaskToDay = useCallback(
    (taskId: string, day: DayOfWeek) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const daySchedule = migrated.weeklySchedule[day] || [];
        if (daySchedule.includes(taskId)) return migrated;

        return {
          ...migrated,
          weeklySchedule: {
            ...migrated.weeklySchedule,
            [day]: [...daySchedule, taskId],
          },
        };
      });
    },
    [setState],
  );

  const removeTaskFromDay = useCallback(
    (taskId: string, day: DayOfWeek) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        return {
          ...migrated,
          weeklySchedule: {
            ...migrated.weeklySchedule,
            [day]: (migrated.weeklySchedule[day] || []).filter((id) => id !== taskId),
          },
        };
      });
    },
    [setState],
  );

  const removeTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const newTasks = migrated.tasks.filter((t) => t.id !== id);
        const newSchedule = { ...migrated.weeklySchedule };
        for (const day of ALL_DAYS) {
          newSchedule[day] = (newSchedule[day] || []).filter((tid) => tid !== id);
        }
        return { ...migrated, tasks: newTasks, weeklySchedule: newSchedule };
      });
    },
    [setState],
  );

  const editTask = useCallback(
    (id: string, updates: Partial<Pick<Task, 'title' | 'emoji'>>) => {
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

  const copyDay = useCallback(
    (fromDay: DayOfWeek, toDays: DayOfWeek[]) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const fromSchedule = migrated.weeklySchedule[fromDay] || [];
        const newSchedule = { ...migrated.weeklySchedule };
        for (const toDay of toDays) {
          newSchedule[toDay] = [...fromSchedule];
        }
        return { ...migrated, weeklySchedule: newSchedule };
      });
    },
    [setState],
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

  // ── Template actions ──

  const saveTemplate = useCallback(
    (name: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const schedule = {} as WeeklyTemplate['schedule'];

        for (const day of ALL_DAYS) {
          const taskIds = migrated.weeklySchedule[day] || [];
          schedule[day] = taskIds
            .map((id) => migrated.tasks.find((t) => t.id === id))
            .filter((t): t is Task => t != null && !t.isBonus)
            .map((t) => ({ title: t.title, emoji: t.emoji }));
        }

        const template: WeeklyTemplate = {
          id: uid(),
          name,
          schedule,
          createdAt: new Date().toISOString(),
        };

        return { ...migrated, templates: [...migrated.templates, template] };
      });
    },
    [setState],
  );

  const loadTemplate = useCallback(
    (templateId: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        const template = migrated.templates.find((t) => t.id === templateId);
        if (!template) return migrated;

        let newTasks = [...migrated.tasks];
        const newSchedule: WeeklySchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

        for (const day of ALL_DAYS) {
          const templateTasks = template.schedule[day] || [];
          for (const tt of templateTasks) {
            // Find existing task by title or create new one
            let existing = newTasks.find((t) => t.title === tt.title && !t.isBonus);
            if (!existing) {
              existing = { id: uid(), title: tt.title, emoji: tt.emoji, isBonus: false, createdAt: new Date().toISOString() };
              newTasks = [...newTasks, existing];
            }
            if (!newSchedule[day].includes(existing.id)) {
              newSchedule[day].push(existing.id);
            }
          }
        }

        return {
          ...migrated,
          tasks: newTasks,
          weeklySchedule: newSchedule,
          currentWeek: emptyWeek(getMonday()),
        };
      });
    },
    [setState],
  );

  const deleteTemplate = useCallback(
    (templateId: string) => {
      setState((prev) => {
        const migrated = migrateState(prev);
        return { ...migrated, templates: migrated.templates.filter((t) => t.id !== templateId) };
      });
    },
    [setState],
  );

  // ── Derived values ──

  const completedTodayCount = useMemo(
    () => activeTodayTasks.filter((t) => todayProgress.completedTaskIds.includes(t.id)).length,
    [activeTodayTasks, todayProgress],
  );

  const totalActiveCount = activeTodayTasks.length;
  const allDailyDone = totalActiveCount > 0 && completedTodayCount === totalActiveCount;

  const todayBonusCompleted = useMemo(
    () => bonusTasks.filter((t) => todayProgress.completedTaskIds.includes(t.id)).length,
    [bonusTasks, todayProgress],
  );

  // Streak calculation (consecutive 100% weeks)
  const currentStreak = useMemo(() => {
    const history = ensuredState.weekHistory || [];
    if (history.length === 0) return 0;
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].completionPct === 100) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [ensuredState.weekHistory]);

  // Get tasks for a specific day (for parent view)
  const getTasksForDay = useCallback(
    (day: DayOfWeek): Task[] => {
      const ids = ensuredState.weeklySchedule[day] || [];
      return ids
        .map((id) => ensuredState.tasks.find((t) => t.id === id))
        .filter((t): t is Task => t != null && !t.isBonus);
    },
    [ensuredState],
  );

  // Get non-bonus tasks not yet on a specific day (for "add existing" UI)
  const getUnscheduledTasksForDay = useCallback(
    (day: DayOfWeek): Task[] => {
      const scheduledIds = new Set(ensuredState.weeklySchedule[day] || []);
      return ensuredState.tasks.filter((t) => !t.isBonus && !scheduledIds.has(t.id));
    },
    [ensuredState],
  );

  return {
    state: ensuredState,
    syncStatus,
    today,
    todayDow,
    todayProgress,
    todayTasks,
    activeTodayTasks,
    bonusTasks,
    completedCount: completedTodayCount,
    totalActiveCount,
    allDailyDone,
    todayBonusCompleted,
    currentStreak,
    getTasksForDay,
    getUnscheduledTasksForDay,
    toggleTask,
    addTaskToDay,
    addBonusTask,
    addExistingTaskToDay,
    removeTaskFromDay,
    removeTask,
    editTask,
    toggleSkip,
    copyDay,
    resetWeek,
    changePin,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
