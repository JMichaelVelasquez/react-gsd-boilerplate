import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
        } else if (data.user && !data.session) {
          // Email confirmation required
          setConfirmationSent(true);
        } else {
          onAuthSuccess();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
        } else {
          onAuthSuccess();
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center px-5">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-md text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email!</h2>
          <p className="text-gray-500 mb-6">
            We sent a confirmation link to <strong className="text-purple-600">{email}</strong>.
            Click it to activate your account.
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmationSent(false);
              setIsSignUp(false);
            }}
            className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="text-3xl font-black text-gray-800">Caleb&apos;s Quest</h1>
          <p className="text-gray-400 mt-1">Daily tasks made fun</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !isSignUp ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isSignUp ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-gray-800"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isSignUp
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-purple-500 font-medium hover:text-purple-700"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
