import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AppState, Task, WeeklySchedule, DayProgress, WeekHistory, WeeklyTemplate, DayOfWeek } from '../types';
import { ALL_DAYS } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

const HOUSEHOLD_ID = 'default';

// ── Helpers: convert between app types and DB rows ──────────────

function taskToRow(task: Task) {
  return {
    id: task.id,
    household_id: HOUSEHOLD_ID,
    title: task.title,
    emoji: task.emoji,
    is_bonus: task.isBonus,
    created_at: task.createdAt,
  };
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    emoji: row.emoji as string,
    isBonus: row.is_bonus as boolean,
    createdAt: row.created_at as string,
  };
}

// ── The sync hook ───────────────────────────────────────────────

export function useSupabaseSync(
  state: AppState,
  setState: (updater: (prev: AppState) => AppState) => void,
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSyncingFromRemote = useRef(false);
  const lastPushTimestamp = useRef(0);
  const initialLoadDone = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pull: fetch full state from Supabase ──

  const pullFromSupabase = useCallback(async (): Promise<AppState | null> => {
    try {
      const [tasksRes, schedulesRes, progressRes, historyRes, appStateRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('household_id', HOUSEHOLD_ID),
        supabase.from('weekly_schedules').select('*').eq('household_id', HOUSEHOLD_ID),
        supabase.from('day_progress').select('*').eq('household_id', HOUSEHOLD_ID),
        supabase.from('week_history').select('*').eq('household_id', HOUSEHOLD_ID),
        supabase.from('app_state').select('*').eq('household_id', HOUSEHOLD_ID).single(),
      ]);

      // If any critical query fails, return null
      if (tasksRes.error || schedulesRes.error || progressRes.error || historyRes.error) {
        console.warn('[Sync] Pull failed:', tasksRes.error || schedulesRes.error || progressRes.error || historyRes.error);
        return null;
      }

      const tasks: Task[] = (tasksRes.data || []).map(rowToTask);

      // Rebuild weekly schedule
      const weeklySchedule: WeeklySchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
      for (const row of (schedulesRes.data || [])) {
        const day = row.day_of_week as DayOfWeek;
        if (ALL_DAYS.includes(day)) {
          weeklySchedule[day] = (row.task_ids as string[]) || [];
        }
      }

      // Rebuild week history
      const weekHistory: WeekHistory[] = (historyRes.data || []).map((row) => ({
        weekStart: row.week_start as string,
        completionPct: row.completion_pct as number,
        totalTasks: row.total_tasks as number,
        completedTasks: row.completed_tasks as number,
        bonusStarsEarned: row.bonus_stars_earned as number,
      }));

      // App state
      const appStateRow = appStateRes.data;
      const bonusStars = appStateRow?.bonus_stars ?? 0;
      const templates: WeeklyTemplate[] = (appStateRow?.templates as WeeklyTemplate[]) ?? [];
      const currentWeekStart = appStateRow?.current_week_start as string | null;

      // Rebuild current week days from day_progress
      const dayProgressRows = progressRes.data || [];
      const days: DayProgress[] = dayProgressRows.map((row) => ({
        date: row.date as string,
        completedTaskIds: (row.completed_task_ids as string[]) || [],
        skippedTaskIds: (row.skipped_task_ids as string[]) || [],
      }));

      // Get the household PIN
      const householdRes = await supabase.from('households').select('pin').eq('id', HOUSEHOLD_ID).single();
      const pin = (householdRes.data?.pin as string) || '1234';

      const pulled: AppState = {
        tasks,
        weeklySchedule,
        currentWeek: {
          weekStart: currentWeekStart || state.currentWeek.weekStart,
          days,
        },
        parentPin: pin,
        weekHistory,
        bonusStars,
        templates,
      };

      return pulled;
    } catch (err) {
      console.warn('[Sync] Pull error:', err);
      return null;
    }
  }, [state.currentWeek.weekStart]);

  // ── Push: write full state to Supabase ──

  const pushToSupabase = useCallback(async (appState: AppState) => {
    const now = Date.now();
    lastPushTimestamp.current = now;

    try {
      setSyncStatus('syncing');

      // 1. Upsert household (PIN)
      await supabase.from('households').upsert({
        id: HOUSEHOLD_ID,
        name: 'Default Household',
        pin: appState.parentPin,
      });

      // 2. Upsert tasks — delete removed ones, upsert current ones
      const taskRows = appState.tasks.map(taskToRow);
      const taskIds = appState.tasks.map((t) => t.id);

      // Delete tasks not in current state
      await supabase.from('tasks')
        .delete()
        .eq('household_id', HOUSEHOLD_ID)
        .not('id', 'in', `(${taskIds.length > 0 ? taskIds.map((id) => `"${id}"`).join(',') : '"__none__"'})`);

      // Upsert current tasks
      if (taskRows.length > 0) {
        await supabase.from('tasks').upsert(taskRows);
      }

      // 3. Upsert weekly schedules
      const scheduleRows = ALL_DAYS.map((day) => ({
        id: `${HOUSEHOLD_ID}-${day}`,
        household_id: HOUSEHOLD_ID,
        day_of_week: day,
        task_ids: appState.weeklySchedule[day] || [],
      }));
      await supabase.from('weekly_schedules').upsert(scheduleRows);

      // 4. Upsert day progress for current week
      const dayRows = appState.currentWeek.days.map((d) => ({
        id: `${HOUSEHOLD_ID}-${d.date}`,
        household_id: HOUSEHOLD_ID,
        date: d.date,
        completed_task_ids: d.completedTaskIds,
        skipped_task_ids: d.skippedTaskIds,
      }));
      if (dayRows.length > 0) {
        await supabase.from('day_progress').upsert(dayRows);
      }

      // 5. Upsert week history
      const historyRows = appState.weekHistory.map((h) => ({
        id: `${HOUSEHOLD_ID}-${h.weekStart}`,
        household_id: HOUSEHOLD_ID,
        week_start: h.weekStart,
        completion_pct: h.completionPct,
        total_tasks: h.totalTasks,
        completed_tasks: h.completedTasks,
        bonus_stars_earned: h.bonusStarsEarned,
      }));
      if (historyRows.length > 0) {
        await supabase.from('week_history').upsert(historyRows);
      }

      // 6. Upsert app state
      await supabase.from('app_state').upsert({
        id: HOUSEHOLD_ID,
        household_id: HOUSEHOLD_ID,
        bonus_stars: appState.bonusStars,
        templates: appState.templates,
        current_week_start: appState.currentWeek.weekStart,
        updated_at: new Date().toISOString(),
      });

      setSyncStatus('synced');
    } catch (err) {
      console.warn('[Sync] Push error:', err);
      setSyncStatus('error');
    }
  }, []);

  // ── Initial load: pull from Supabase, fallback to localStorage ──

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      const remote = await pullFromSupabase();
      if (remote && remote.tasks.length > 0) {
        // Remote has data — use it
        isSyncingFromRemote.current = true;
        setState(() => remote);
        isSyncingFromRemote.current = false;
        setSyncStatus('synced');
      } else {
        // No remote data — push local state up
        await pushToSupabase(state);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Watch state changes and push (debounced) ──

  const prevStateJSON = useRef('');

  useEffect(() => {
    if (isSyncingFromRemote.current) return;

    const json = JSON.stringify(state);
    if (json === prevStateJSON.current) return;
    prevStateJSON.current = json;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pushToSupabase(state);
    }, 500);
  }, [state, pushToSupabase]);

  // ── Realtime subscriptions ──

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `household_id=eq.${HOUSEHOLD_ID}` }, () => {
        handleRemoteChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedules', filter: `household_id=eq.${HOUSEHOLD_ID}` }, () => {
        handleRemoteChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_progress', filter: `household_id=eq.${HOUSEHOLD_ID}` }, () => {
        handleRemoteChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state', filter: `household_id=eq.${HOUSEHOLD_ID}` }, () => {
        handleRemoteChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_history', filter: `household_id=eq.${HOUSEHOLD_ID}` }, () => {
        handleRemoteChange();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Sync] Realtime connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setSyncStatus('offline');
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced remote change handler — ignore changes we just pushed
  const remoteChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemoteChange = useCallback(() => {
    // Ignore events that are echoes of our own push (within 2 seconds)
    if (Date.now() - lastPushTimestamp.current < 2000) return;

    if (remoteChangeTimer.current) clearTimeout(remoteChangeTimer.current);
    remoteChangeTimer.current = setTimeout(async () => {
      const remote = await pullFromSupabase();
      if (remote) {
        isSyncingFromRemote.current = true;
        setState(() => remote);
        isSyncingFromRemote.current = false;
        setSyncStatus('synced');
      }
    }, 500);
  }, [pullFromSupabase, setState]);

  // ── Online/offline detection ──

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      pushToSupabase(state);
    };
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) setSyncStatus('offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state, pushToSupabase]);

  return { syncStatus };
}
