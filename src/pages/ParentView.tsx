import { useState } from 'react';
import type { Task, DayOfWeek, WeeklyTemplate } from '../types';
import { ALL_DAYS, DAY_LABELS, DAY_FULL_LABELS } from '../types';
import { DAY_NAMES, weekDates, todayStr, getDayOfWeek, dateToDayOfWeek } from '../utils/dates';
import type { AppStore } from '../store/useAppStore';

interface Props {
  store: AppStore;
  onBack: () => void;
}

// ── Emoji picker constant ───────────────────────────────────────

const EMOJI_PICKS = ['📚', '🔢', '✍️', '🏃', '🎨', '🎵', '🧹', '🧪', '💻', '📝', '🌍', '🎯'];

// ── Task Form (for add/edit) ────────────────────────────────────

function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: { title: string; emoji: string };
  submitLabel: string;
  onSubmit: (title: string, emoji: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📝');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Task name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read for 30 mins"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_PICKS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-2xl md:text-3xl p-1 md:p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-purple-100 ring-2 ring-purple-400 scale-110' : 'hover:bg-gray-100'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => title.trim() && onSubmit(title.trim(), emoji)}
          disabled={!title.trim()}
          className="flex-1 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full py-2 text-red-500 text-sm font-medium hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
        >
          🗑️ Delete this task from all days
        </button>
      )}
    </div>
  );
}

// ── Scheduled Task Row (for day planner) ────────────────────────

function ScheduledTaskRow({
  task,
  onEdit,
  onRemoveFromDay,
}: {
  task: Task;
  onEdit: () => void;
  onRemoveFromDay: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-2xl md:text-3xl">{task.emoji}</span>
      <p className="flex-1 font-semibold text-gray-800 truncate">{task.title}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs px-2 py-1 rounded-lg bg-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Edit task"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onRemoveFromDay}
          className="text-xs px-2 py-1 rounded-lg bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Remove from this day"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Bonus Task Row ──────────────────────────────────────────────

function BonusTaskRow({
  task,
  onEdit,
  onRemove,
}: {
  task: Task;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-yellow-50 rounded-xl px-4 py-3 border border-yellow-200">
      <span className="text-2xl md:text-3xl">{task.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{task.title}</p>
        <p className="text-xs text-yellow-600">⭐ Bonus — available every day</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs px-2 py-1 rounded-lg bg-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs px-2 py-1 rounded-lg bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Copy Day Modal ──────────────────────────────────────────────

function CopyDayModal({
  fromDay,
  onCopy,
  onClose,
}: {
  fromDay: DayOfWeek;
  onCopy: (toDays: DayOfWeek[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<DayOfWeek[]>([]);

  const toggle = (day: DayOfWeek) => {
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 space-y-3">
      <p className="font-semibold text-purple-800 text-sm">
        Copy {DAY_FULL_LABELS[fromDay]}&apos;s tasks to:
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_DAYS.filter((d) => d !== fromDay).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              selected.includes(d)
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (selected.length > 0) onCopy(selected);
          }}
          disabled={selected.length === 0}
          className="flex-1 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
            disabled:opacity-40 transition-colors text-sm"
        >
          Copy to {selected.length} day{selected.length !== 1 ? 's' : ''}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-300 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Templates Section ───────────────────────────────────────────

function TemplatesSection({
  templates,
  onSave,
  onLoad,
  onDelete,
}: {
  templates: WeeklyTemplate[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [confirmLoadId, setConfirmLoadId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* Save current schedule as template */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name (e.g. Term Time)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm text-gray-800"
        />
        <button
          type="button"
          onClick={() => {
            if (name.trim()) {
              onSave(name.trim());
              setName('');
            }
          }}
          disabled={!name.trim()}
          className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
            disabled:opacity-40 transition-colors text-sm whitespace-nowrap"
        >
          💾 Save
        </button>
      </div>

      {/* Template list */}
      {templates.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No templates yet — save your current week&apos;s schedule as a template to quickly set up future weeks.
        </p>
      )}
      {templates.map((template) => {
        const date = new Date(template.createdAt);
        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const totalTasks = ALL_DAYS.reduce((sum, d) => sum + (template.schedule[d]?.length || 0), 0);

        return (
          <div
            key={template.id}
            className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{template.name}</p>
              <p className="text-xs text-gray-400">
                {totalTasks} tasks across week · Saved {dateStr}
              </p>
            </div>

            {confirmLoadId === template.id ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-700 font-medium mr-1">Replace schedule?</span>
                <button
                  type="button"
                  onClick={() => {
                    onLoad(template.id);
                    setConfirmLoadId(null);
                  }}
                  className="text-xs px-2 py-1 bg-purple-500 text-white rounded-lg font-medium"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLoadId(null)}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-lg font-medium"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmLoadId(template.id)}
                  className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                >
                  📥 Load
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(template.id)}
                  className="text-xs px-2 py-1.5 bg-gray-200 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Week At A Glance (desktop-only overview) ────────────────────

function WeekAtAGlance({
  store,
  selectedDay,
  onSelectDay,
}: {
  store: AppStore;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}) {
  const todayDow = getDayOfWeek();

  return (
    <div className="hidden lg:block mb-6">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">Week at a Glance</h3>
      <div className="grid grid-cols-7 gap-2">
        {ALL_DAYS.map((day) => {
          const taskIds = (store.state.weeklySchedule[day] || []).filter((id) => {
            const t = store.state.tasks.find((task) => task.id === id);
            return t && !t.isBonus;
          });
          const tasks = taskIds
            .map((id) => store.state.tasks.find((t) => t.id === id))
            .filter((t): t is Task => t != null);
          const isSelected = day === selectedDay;
          const isToday = day === todayDow;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`rounded-xl p-3 text-left transition-all border-2 min-h-[120px] ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : isToday
                    ? 'border-purple-300 bg-white hover:bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
              }`}
            >
              <p className={`text-xs font-bold mb-2 ${isSelected ? 'text-purple-700' : isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                {DAY_LABELS[day]}
              </p>
              {tasks.length === 0 ? (
                <p className="text-xs text-gray-300 italic">No tasks</p>
              ) : (
                <div className="space-y-1">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-1">
                      <span className="text-sm">{task.emoji}</span>
                      <span className="text-xs text-gray-600 truncate">{task.title}</span>
                    </div>
                  ))}
                  {tasks.length > 4 && (
                    <p className="text-xs text-gray-400">+{tasks.length - 4} more</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Weekly Progress Grid ────────────────────────────────────────

function WeekGrid({ store }: { store: AppStore }) {
  const { state } = store;
  const today = todayStr();
  const dates = weekDates(state.currentWeek.weekStart);

  // Get all unique task IDs across the week
  const allTaskIds: string[] = [];
  const seen = new Set<string>();
  for (const day of ALL_DAYS) {
    for (const id of state.weeklySchedule[day] || []) {
      if (!seen.has(id)) {
        const task = state.tasks.find((t) => t.id === id);
        if (task && !task.isBonus) {
          allTaskIds.push(id);
          seen.add(id);
        }
      }
    }
  }

  const allTasks = allTaskIds
    .map((id) => state.tasks.find((t) => t.id === id))
    .filter((t): t is Task => t != null);

  // Calculate overall week completion
  let totalExpected = 0;
  let totalCompleted = 0;
  for (const day of state.currentWeek.days) {
    const dow = dateToDayOfWeek(day.date);
    const scheduledIds = state.weeklySchedule[dow] || [];
    for (const taskId of scheduledIds) {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || task.isBonus) continue;
      if (!day.skippedTaskIds.includes(taskId)) {
        totalExpected++;
        if (day.completedTaskIds.includes(taskId)) {
          totalCompleted++;
        }
      }
    }
  }
  const overallPct = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  if (allTasks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 italic text-sm">
        No tasks scheduled yet — set up your week in the planner above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">
          Week: {totalCompleted}/{totalExpected} tasks
        </span>
        <span
          className={`font-bold ${
            overallPct === 100 ? 'text-green-600' : overallPct >= 50 ? 'text-amber-600' : 'text-gray-500'
          }`}
        >
          {overallPct}%
        </span>
      </div>
      <div className="w-full h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${overallPct}%`,
            background:
              overallPct === 100
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : overallPct >= 50
                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
          }}
        />
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-2 text-gray-500 font-medium">Task</th>
              {DAY_NAMES.map((d, i) => (
                <th
                  key={d}
                  className={`px-1 md:px-2 py-2 text-center font-medium ${
                    dates[i] === today ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTasks.map((task) => (
              <tr key={task.id} className="border-t border-gray-100">
                <td className="py-2 pr-2 font-medium text-gray-700 whitespace-nowrap">
                  {task.emoji} {task.title}
                </td>
                {dates.map((date, i) => {
                  const dow = ALL_DAYS[i];
                  const isScheduled = (state.weeklySchedule[dow] || []).includes(task.id);
                  if (!isScheduled) {
                    return (
                      <td key={i} className="px-1 md:px-2 py-2 text-center">
                        <span className="text-gray-200">—</span>
                      </td>
                    );
                  }
                  const day = state.currentWeek.days.find((d) => d.date === date);
                  const done = day?.completedTaskIds.includes(task.id);
                  const skipped = day?.skippedTaskIds.includes(task.id);
                  return (
                    <td key={i} className="px-1 md:px-2 py-2 text-center">
                      {skipped ? (
                        <span className="text-amber-400" title="Skipped">
                          ⏭️
                        </span>
                      ) : done ? (
                        <span className="text-green-500" title="Done">
                          ✅
                        </span>
                      ) : date <= today ? (
                        <span className="text-gray-300">○</span>
                      ) : (
                        <span className="text-gray-200">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── History View ────────────────────────────────────────────────

function HistoryView({ history, currentStreak }: { history: { weekStart: string; completionPct: number; totalTasks: number; completedTasks: number; bonusStarsEarned: number }[]; currentStreak: number }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 italic text-sm">
        No history yet — complete a week to see it here!
      </div>
    );
  }

  const reversed = [...history].reverse();

  return (
    <div className="space-y-3">
      {currentStreak > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 md:p-4 text-center">
          <span className="text-2xl md:text-3xl">🔥</span>
          <p className="font-bold text-orange-700 md:text-lg">
            {currentStreak} week{currentStreak > 1 ? 's' : ''} streak!
          </p>
          <p className="text-xs md:text-sm text-orange-500">Consecutive weeks with 100% completion</p>
        </div>
      )}
      {reversed.map((week) => {
        const date = new Date(week.weekStart + 'T00:00:00');
        const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const isPerfect = week.completionPct === 100;
        return (
          <div
            key={week.weekStart}
            className={`rounded-xl p-3 md:p-4 border ${
              isPerfect ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm md:text-base">Week of {label}</p>
                <p className="text-xs md:text-sm text-gray-400">
                  {week.completedTasks}/{week.totalTasks} tasks · {week.bonusStarsEarned} bonus ⭐
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg md:text-xl font-black ${isPerfect ? 'text-green-600' : week.completionPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}
                >
                  {week.completionPct}%
                </p>
                {isPerfect && <span className="text-xs md:text-sm">🏆 Perfect!</span>}
              </div>
            </div>
            <div className="mt-2 w-full h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${week.completionPct}%`,
                  background: isPerfect
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : week.completionPct >= 50
                      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(90deg, #f87171, #ef4444)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Parent View ────────────────────────────────────────────

export default function ParentView({ store, onBack }: Props) {
  const todayDow = getDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDow);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBonus, setShowAddBonus] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  const [showCopyDay, setShowCopyDay] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dayTasks = store.getTasksForDay(selectedDay);
  const unscheduledTasks = store.getUnscheduledTasksForDay(selectedDay);
  const editingTask = editingId ? store.state.tasks.find((t) => t.id === editingId) : null;

  const handleSelectDay = (day: DayOfWeek) => {
    setSelectedDay(day);
    setShowAddForm(false);
    setEditingId(null);
    setShowExisting(false);
    setShowCopyDay(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-purple-600 font-medium text-sm md:text-base hover:text-purple-800 transition-colors"
          >
            ← Back to Caleb
          </button>
          <h1 className="font-bold text-gray-800 md:text-lg">🔒 Parent Mode</h1>
          <div className="w-20 md:w-28" />
        </div>
      </header>

      <main className="max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-8 space-y-8">
        {/* ── Stats overview ── */}
        <section>
          <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-5 text-center shadow-sm">
              <p className="text-2xl md:text-3xl lg:text-4xl">🔥</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-orange-600">{store.currentStreak}</p>
              <p className="text-xs md:text-sm text-gray-400">Week Streak</p>
            </div>
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-5 text-center shadow-sm">
              <p className="text-2xl md:text-3xl lg:text-4xl">⭐</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-yellow-600">{store.state.bonusStars || 0}</p>
              <p className="text-xs md:text-sm text-gray-400">Bonus Stars</p>
            </div>
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-5 text-center shadow-sm">
              <p className="text-2xl md:text-3xl lg:text-4xl">📊</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-black text-purple-600">{(store.state.weekHistory || []).length}</p>
              <p className="text-xs md:text-sm text-gray-400">Weeks Tracked</p>
            </div>
          </div>
        </section>

        {/* ── Desktop 2-column layout: Planner + Bonus/Templates ── */}
        <div className="space-y-8 lg:grid lg:grid-cols-5 lg:gap-8 lg:space-y-0">

          {/* Left column: Weekly Planner */}
          <div className="lg:col-span-3 space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">📅 Weekly Planner</h2>

              {/* Desktop: Week at a Glance overview */}
              <WeekAtAGlance store={store} selectedDay={selectedDay} onSelectDay={handleSelectDay} />

              {/* Day tabs (mobile/tablet primary nav, desktop secondary) */}
              <div className="flex gap-1 md:gap-2 mb-4 overflow-x-auto pb-1 lg:hidden">
                {ALL_DAYS.map((day) => {
                  const taskCount = (store.state.weeklySchedule[day] || []).filter((id) => {
                    const t = store.state.tasks.find((task) => task.id === id);
                    return t && !t.isBonus;
                  }).length;
                  const isSelected = day === selectedDay;
                  const isToday = day === todayDow;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`flex-1 min-w-[48px] py-2.5 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-white shadow-md'
                          : isToday
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <span className="block text-xs font-bold">{DAY_LABELS[day]}</span>
                      <span className={`block text-lg font-black ${isSelected ? 'text-white' : taskCount > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                        {taskCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected day's tasks */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-700 text-sm md:text-base">
                  {DAY_FULL_LABELS[selectedDay]}&apos;s Tasks
                </h3>

                {dayTasks.length === 0 && !showAddForm && (
                  <p className="text-sm text-gray-400 italic py-2">
                    No tasks on {DAY_FULL_LABELS[selectedDay]} — add some below!
                  </p>
                )}

                {/* Task list */}
                <div className="space-y-2">
                  {dayTasks.map((task) =>
                    editingId === task.id && editingTask ? (
                      <TaskForm
                        key={task.id}
                        initial={{ title: editingTask.title, emoji: editingTask.emoji }}
                        submitLabel="Save Changes"
                        onSubmit={(title, emoji) => {
                          store.editTask(task.id, { title, emoji });
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                        onDelete={() => {
                          store.removeTask(task.id);
                          setEditingId(null);
                        }}
                      />
                    ) : confirmDeleteId === task.id ? (
                      <div key={task.id} className="bg-red-50 rounded-xl border border-red-200 p-3 space-y-2">
                        <p className="text-sm text-red-700 font-medium">
                          Remove &quot;{task.title}&quot; from {DAY_FULL_LABELS[selectedDay]}?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              store.removeTaskFromDay(task.id, selectedDay);
                              setConfirmDeleteId(null);
                            }}
                            className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ScheduledTaskRow
                        key={task.id}
                        task={task}
                        onEdit={() => {
                          setEditingId(task.id);
                          setShowAddForm(false);
                        }}
                        onRemoveFromDay={() => setConfirmDeleteId(task.id)}
                      />
                    ),
                  )}
                </div>

                {/* Add task form */}
                {showAddForm && (
                  <TaskForm
                    submitLabel={`Add to ${DAY_LABELS[selectedDay]}`}
                    onSubmit={(title, emoji) => {
                      store.addTaskToDay(title, emoji, selectedDay);
                      setShowAddForm(false);
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}

                {/* Add existing tasks dropdown */}
                {showExisting && unscheduledTasks.length > 0 && (
                  <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-3 space-y-2">
                    <p className="text-sm font-medium text-indigo-700">
                      Add existing task to {DAY_LABELS[selectedDay]}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unscheduledTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            store.addExistingTaskToDay(task.id, selectedDay);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-indigo-200
                            hover:border-indigo-400 hover:bg-indigo-100 transition-all text-sm font-medium text-gray-700"
                        >
                          <span>{task.emoji}</span>
                          <span>{task.title}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExisting(false)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Copy day modal */}
                {showCopyDay && (
                  <CopyDayModal
                    fromDay={selectedDay}
                    onCopy={(toDays) => {
                      store.copyDay(selectedDay, toDays);
                      setShowCopyDay(false);
                    }}
                    onClose={() => setShowCopyDay(false)}
                  />
                )}

                {/* Action buttons */}
                {!showAddForm && !showCopyDay && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(true);
                        setEditingId(null);
                        setShowExisting(false);
                      }}
                      className="text-sm px-3 py-1.5 md:px-4 md:py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                    >
                      + New Task
                    </button>
                    {unscheduledTasks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowExisting(!showExisting);
                          setShowAddForm(false);
                        }}
                        className="text-sm px-3 py-1.5 md:px-4 md:py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                      >
                        + From Library ({unscheduledTasks.length})
                      </button>
                    )}
                    {dayTasks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCopyDay(true);
                          setShowAddForm(false);
                          setShowExisting(false);
                        }}
                        className="text-sm px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        📋 Copy to…
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column: Bonus Tasks + Templates */}
          <div className="lg:col-span-2 space-y-8">
            {/* ── Bonus Tasks ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">⭐ Bonus Tasks</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBonus(true);
                    setEditingId(null);
                  }}
                  className="text-sm px-3 py-1.5 md:px-4 md:py-2 bg-yellow-400 text-yellow-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                >
                  + Add Bonus
                </button>
              </div>

              {showAddBonus && (
                <div className="mb-3">
                  <TaskForm
                    submitLabel="Add Bonus Task"
                    onSubmit={(title, emoji) => {
                      store.addBonusTask(title, emoji);
                      setShowAddBonus(false);
                    }}
                    onCancel={() => setShowAddBonus(false)}
                  />
                </div>
              )}

              <div className="space-y-2">
                {store.bonusTasks.length === 0 && !showAddBonus && (
                  <p className="text-sm text-gray-400 italic">
                    No bonus tasks yet — add optional challenges that earn stars!
                  </p>
                )}
                {store.bonusTasks.map((task) =>
                  editingId === task.id && editingTask ? (
                    <TaskForm
                      key={task.id}
                      initial={{ title: editingTask.title, emoji: editingTask.emoji }}
                      submitLabel="Save Changes"
                      onSubmit={(title, emoji) => {
                        store.editTask(task.id, { title, emoji });
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => {
                        store.removeTask(task.id);
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <BonusTaskRow
                      key={task.id}
                      task={task}
                      onEdit={() => {
                        setEditingId(task.id);
                        setShowAddForm(false);
                        setShowAddBonus(false);
                      }}
                      onRemove={() => store.removeTask(task.id)}
                    />
                  ),
                )}
              </div>
            </section>

            {/* ── Templates ── */}
            <section>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">📋 Templates</h2>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
                <TemplatesSection
                  templates={store.state.templates || []}
                  onSave={store.saveTemplate}
                  onLoad={store.loadTemplate}
                  onDelete={store.deleteTemplate}
                />
              </div>
            </section>
          </div>
        </div>

        {/* ── Desktop 2-column: Progress + History ── */}
        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
          {/* ── Weekly Progress ── */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">📊 This Week</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
              <WeekGrid store={store} />
            </div>
          </section>

          {/* ── History ── */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">📜 Past Weeks</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
              <HistoryView history={store.state.weekHistory || []} currentStreak={store.currentStreak} />
            </div>
          </section>
        </div>

        {/* ── Week Reset ── */}
        <section className="pb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">🔄 Reset</h2>
          {confirmReset ? (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 md:p-5 text-center space-y-3 max-w-lg">
              <p className="text-red-700 font-medium">Clear all progress for this week?</p>
              <p className="text-red-500 text-xs md:text-sm">This resets task completions only. Your schedule stays the same.</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    store.resetWeek();
                    setConfirmReset(false);
                  }}
                  className="px-4 py-2 md:px-6 md:py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 md:px-6 md:py-2.5 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full md:w-auto py-3 md:px-8 bg-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Reset Week Progress
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
