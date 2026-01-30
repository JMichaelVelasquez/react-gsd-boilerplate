import { useState } from 'react';
import type { Task, WeekData, DayProgress } from '../types';
import { DAY_NAMES, weekDates, todayStr } from '../utils/dates';

interface Props {
  tasks: Task[];
  dailyTasks: Task[];
  bonusTasks: Task[];
  currentWeek: WeekData;
  todayProgress: DayProgress;
  onAddTask: (title: string, emoji: string, isBonus: boolean) => void;
  onEditTask: (id: string, updates: Partial<Pick<Task, 'title' | 'emoji' | 'isBonus'>>) => void;
  onRemoveTask: (id: string) => void;
  onToggleSkip: (taskId: string, date?: string) => void;
  onResetWeek: () => void;
  onBack: () => void;
}

// ── Small sub-components ────────────────────────────────────────

function TaskRow({
  task,
  isSkipped,
  onEdit,
  onRemove,
  onToggleSkip,
}: {
  task: Task;
  isSkipped: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleSkip: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-2xl">{task.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{task.title}</p>
        <p className="text-xs text-gray-400">{task.isBonus ? '⭐ Bonus' : '📋 Daily'}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleSkip}
          className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
            isSkipped ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500 hover:bg-amber-50'
          }`}
          title={isSkipped ? 'Unskip' : 'Skip today'}
        >
          {isSkipped ? '⏭️ Skipped' : 'Skip'}
        </button>
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

// ── Add/Edit form ───────────────────────────────────────────────

function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; emoji: string; isBonus: boolean };
  onSubmit: (title: string, emoji: string, isBonus: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📝');
  const [isBonus, setIsBonus] = useState(initial?.isBonus ?? false);

  const EMOJI_PICKS = ['📚', '🔢', '✍️', '🏃', '🎨', '🎵', '🧹', '🧪', '💻', '📝', '🌍', '🎯'];

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
              className={`text-2xl p-1 rounded-lg transition-all ${emoji === e ? 'bg-purple-100 ring-2 ring-purple-400 scale-110' : 'hover:bg-gray-100'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isBonus}
          onChange={(e) => setIsBonus(e.target.checked)}
          className="w-5 h-5 rounded accent-purple-500"
        />
        <span className="text-sm text-gray-700">⭐ Bonus task (optional extra)</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => title.trim() && onSubmit(title.trim(), emoji, isBonus)}
          disabled={!title.trim()}
          className="flex-1 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {initial ? 'Save Changes' : 'Add Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Weekly progress grid ────────────────────────────────────────

function WeekGrid({ week, tasks }: { week: WeekData; tasks: Task[] }) {
  const today = todayStr();
  const dates = weekDates(week.weekStart);

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-2 text-gray-500 font-medium">Task</th>
            {DAY_NAMES.map((d, i) => (
              <th
                key={d}
                className={`px-1 py-2 text-center font-medium ${dates[i] === today ? 'text-purple-600' : 'text-gray-400'}`}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-gray-100">
              <td className="py-2 pr-2 font-medium text-gray-700 whitespace-nowrap">
                {task.emoji} {task.title}
              </td>
              {dates.map((date, i) => {
                const day = week.days.find((d) => d.date === date);
                const done = day?.completedTaskIds.includes(task.id);
                const skipped = day?.skippedTaskIds.includes(task.id);
                return (
                  <td key={i} className="px-1 py-2 text-center">
                    {skipped ? (
                      <span className="text-amber-400" title="Skipped">⏭️</span>
                    ) : done ? (
                      <span className="text-green-500" title="Done">✅</span>
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
  );
}

// ── Main Parent View ────────────────────────────────────────────

export default function ParentView({
  tasks,
  dailyTasks,
  bonusTasks,
  currentWeek,
  todayProgress,
  onAddTask,
  onEditTask,
  onRemoveTask,
  onToggleSkip,
  onResetWeek,
  onBack,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const editingTask = editingId ? tasks.find((t) => t.id === editingId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-purple-600 font-medium text-sm hover:text-purple-800 transition-colors"
          >
            ← Back to Caleb
          </button>
          <h1 className="font-bold text-gray-800">🔒 Parent Mode</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-8">
        {/* ── Manage Tasks ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">📋 Daily Tasks</h2>
            <button
              type="button"
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="text-sm px-3 py-1.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              + Add Task
            </button>
          </div>

          {showAddForm && !editingId && (
            <div className="mb-4">
              <TaskForm
                onSubmit={(title, emoji, isBonus) => {
                  onAddTask(title, emoji, isBonus);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          <div className="space-y-2">
            {dailyTasks.map((task) =>
              editingId === task.id && editingTask ? (
                <TaskForm
                  key={task.id}
                  initial={{ title: editingTask.title, emoji: editingTask.emoji, isBonus: editingTask.isBonus }}
                  onSubmit={(title, emoji, isBonus) => {
                    onEditTask(task.id, { title, emoji, isBonus });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSkipped={todayProgress.skippedTaskIds.includes(task.id)}
                  onEdit={() => { setEditingId(task.id); setShowAddForm(false); }}
                  onRemove={() => onRemoveTask(task.id)}
                  onToggleSkip={() => onToggleSkip(task.id)}
                />
              ),
            )}
          </div>
        </section>

        {/* ── Bonus Tasks ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">⭐ Bonus Tasks</h2>
          <div className="space-y-2">
            {bonusTasks.length === 0 && (
              <p className="text-sm text-gray-400 italic">No bonus tasks yet — add one above and tick "Bonus task".</p>
            )}
            {bonusTasks.map((task) =>
              editingId === task.id && editingTask ? (
                <TaskForm
                  key={task.id}
                  initial={{ title: editingTask.title, emoji: editingTask.emoji, isBonus: editingTask.isBonus }}
                  onSubmit={(title, emoji, isBonus) => {
                    onEditTask(task.id, { title, emoji, isBonus });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSkipped={todayProgress.skippedTaskIds.includes(task.id)}
                  onEdit={() => { setEditingId(task.id); setShowAddForm(false); }}
                  onRemove={() => onRemoveTask(task.id)}
                  onToggleSkip={() => onToggleSkip(task.id)}
                />
              ),
            )}
          </div>
        </section>

        {/* ── Weekly Progress ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 This Week</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <WeekGrid week={currentWeek} tasks={tasks} />
          </div>
        </section>

        {/* ── Week Reset ── */}
        <section className="pb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔄 Reset</h2>
          {confirmReset ? (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center space-y-3">
              <p className="text-red-700 font-medium">Clear all progress for this week?</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => { onResetWeek(); setConfirmReset(false); }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Reset Week Progress
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
