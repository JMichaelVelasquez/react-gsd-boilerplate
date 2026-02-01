import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Child } from '../types';

interface Props {
  userId: string;
  onComplete: (child: Child) => void;
}

const AVATAR_EMOJIS = [
  '👦', '👧', '🦸‍♂️', '🦸‍♀️', '🧑‍🚀', '👻', '🦄', '🐱',
  '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵', '🦋',
];

const DEFAULT_TASKS = [
  { title: 'Read for 30 mins', emoji: '📚' },
  { title: 'TTRS (Maths)', emoji: '🔢' },
  { title: 'Handwriting', emoji: '✍️' },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage({ userId, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('👦');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [customTasks, setCustomTasks] = useState<Array<{ title: string; emoji: string }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEmoji, setNewTaskEmoji] = useState('📝');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TASK_EMOJIS = ['📚', '🔢', '✍️', '🏃', '🎨', '🎵', '🧹', '🧪', '💻', '📝', '🌍', '🎯'];

  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return childName.trim().length > 0;
      case 2: return true; // avatar always selected
      case 3: return pin.length === 4 && pin === pinConfirm;
      case 4: return true; // can use defaults or add custom
      case 5: return true;
      default: return false;
    }
  }, [step, childName, pin, pinConfirm]);

  const handleNext = useCallback(() => {
    if (step === 3) {
      if (pin.length !== 4) {
        setPinError('PIN must be 4 digits');
        return;
      }
      if (pin !== pinConfirm) {
        setPinError('PINs do not match');
        return;
      }
      setPinError('');
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [step, pin, pinConfirm]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    setPinError('');
  }, []);

  const handleUseDefaults = useCallback(() => {
    setCustomTasks(DEFAULT_TASKS);
  }, []);

  const handleAddTask = useCallback(() => {
    if (newTaskTitle.trim()) {
      setCustomTasks((prev) => [...prev, { title: newTaskTitle.trim(), emoji: newTaskEmoji }]);
      setNewTaskTitle('');
      setNewTaskEmoji('📝');
    }
  }, [newTaskTitle, newTaskEmoji]);

  const handleRemoveTask = useCallback((index: number) => {
    setCustomTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFinish = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create child
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({ name: childName.trim(), avatar_emoji: avatarEmoji })
        .select()
        .single();

      if (childError || !childData) {
        setError('Failed to create child profile: ' + (childError?.message || 'Unknown error'));
        setLoading(false);
        return;
      }

      // 2. Link parent to child
      const { error: linkError } = await supabase
        .from('parent_children')
        .insert({ parent_id: userId, child_id: childData.id, role: 'admin' });

      if (linkError) {
        setError('Failed to link parent to child: ' + linkError.message);
        setLoading(false);
        return;
      }

      // 3. Update profile PIN
      const { error: pinUpdateError } = await supabase
        .from('profiles')
        .update({ pin })
        .eq('id', userId);

      if (pinUpdateError) {
        console.warn('Failed to update PIN:', pinUpdateError.message);
        // Non-critical, continue
      }

      // 4. Create tasks for the child (store in local state — the app store will sync them)
      const child: Child = {
        id: childData.id,
        name: childData.name,
        avatarEmoji: childData.avatar_emoji,
        createdAt: childData.created_at,
      };

      // Store tasks + pin in localStorage for initial setup
      const tasksToCreate = customTasks.length > 0 ? customTasks : DEFAULT_TASKS;
      const initialSetup = {
        childId: child.id,
        pin,
        tasks: tasksToCreate,
      };
      localStorage.setItem('onboarding-setup', JSON.stringify(initialSetup));

      onComplete(child);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [childName, avatarEmoji, pin, customTasks, userId, onComplete]);

  // Progress dots
  const ProgressDots = () => (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? 'bg-purple-500 scale-125'
              : i + 1 < step
                ? 'bg-purple-300'
                : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center px-5 py-8">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-lg">
        <ProgressDots />

        {/* Step 1: Child's Name */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="text-5xl">👋</div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-800">
              Welcome!
            </h2>
            <p className="text-gray-500 text-lg">
              Let&apos;s set up your child&apos;s task tracker
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 text-left">
                What&apos;s your child&apos;s name?
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Caleb"
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800 text-lg text-center font-semibold"
              />
            </div>
          </div>
        )}

        {/* Step 2: Avatar */}
        {step === 2 && (
          <div className="text-center space-y-6">
            <div className="text-6xl">{avatarEmoji}</div>
            <h2 className="text-2xl font-black text-gray-800">
              Pick an avatar for {childName}
            </h2>
            <p className="text-gray-500">Choose a fun emoji avatar!</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`text-3xl md:text-4xl p-3 rounded-2xl transition-all ${
                    avatarEmoji === emoji
                      ? 'bg-purple-100 ring-3 ring-purple-400 scale-110 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: PIN */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="text-5xl">🔒</div>
            <h2 className="text-2xl font-black text-gray-800">Set Your Admin PIN</h2>
            <p className="text-gray-500">
              This PIN protects the parent settings. Only you should know it!
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 text-left">
                  4-digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(v);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800 text-2xl text-center tracking-[0.5em] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 text-left">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinConfirm(v);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800 text-2xl text-center tracking-[0.5em] font-mono"
                />
              </div>
              {pinError && (
                <p className="text-red-500 text-sm font-medium">{pinError}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Tasks */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-2">📋</div>
              <h2 className="text-2xl font-black text-gray-800">
                {childName}&apos;s Daily Tasks
              </h2>
              <p className="text-gray-500 mt-1">
                Add tasks or use our defaults to get started
              </p>
            </div>

            {/* Default tasks button */}
            {customTasks.length === 0 && (
              <button
                type="button"
                onClick={handleUseDefaults}
                className="w-full py-3.5 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition-colors border-2 border-dashed border-purple-300"
              >
                ✨ Use Default Tasks (Read, Maths, Handwriting)
              </button>
            )}

            {/* Task list */}
            {customTasks.length > 0 && (
              <div className="space-y-2">
                {customTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-2xl">{task.emoji}</span>
                    <span className="flex-1 font-semibold text-gray-800">{task.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add task form */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <div className="flex flex-wrap gap-1.5">
                {TASK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewTaskEmoji(e)}
                    className={`text-xl p-1 rounded-lg transition-all ${
                      newTaskEmoji === e ? 'bg-purple-100 ring-2 ring-purple-400' : 'hover:bg-gray-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="w-full py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
              >
                + Add Task
              </button>
            </div>
          </div>
        )}

        {/* Step 5: All set! */}
        {step === 5 && (
          <div className="text-center space-y-6 py-4">
            <div className="text-7xl animate-bounce">{avatarEmoji}</div>
            <h2 className="text-3xl font-black text-gray-800">All Set! 🎉</h2>
            <p className="text-gray-500 text-lg">
              <strong className="text-purple-600">{childName}</strong>&apos;s quest tracker is ready to go!
            </p>
            <div className="bg-purple-50 rounded-2xl p-5 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl">{avatarEmoji}</span>
                <span className="font-semibold text-gray-800">{childName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-gray-600">
                  {customTasks.length > 0 ? customTasks.length : DEFAULT_TASKS.length} tasks ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <span className="text-gray-600">Admin PIN set</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && step < 5 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
          )}
          {step < 5 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {step === 4 ? 'Finish Setup →' : 'Next →'}
            </button>
          )}
          {step === 5 && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600
                disabled:opacity-50 transition-colors text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                "Let's Go! 🚀"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
