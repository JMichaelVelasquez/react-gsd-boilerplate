import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Child } from '../types';
import type { User } from '@supabase/supabase-js';
import AuthPage from '../pages/AuthPage';
import OnboardingPage from '../pages/OnboardingPage';

interface Props {
  children: (args: { user: User; child: Child; pin: string }) => React.ReactNode;
}

type GateState = 'loading' | 'unauthenticated' | 'onboarding' | 'ready';

export default function AuthGate({ children }: Props) {
  const [gateState, setGateState] = useState<GateState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [pin, setPin] = useState('1234');

  const checkChildProfiles = useCallback(async (currentUser: User) => {
    try {
      // Check for linked children
      const { data: links, error: linksError } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', currentUser.id);

      if (linksError || !links || links.length === 0) {
        setGateState('onboarding');
        return;
      }

      // Fetch the first child (single-child for now)
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', links[0].child_id)
        .single();

      if (childError || !childData) {
        setGateState('onboarding');
        return;
      }

      // Fetch profile for PIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('pin')
        .eq('id', currentUser.id)
        .single();

      const foundChild: Child = {
        id: childData.id,
        name: childData.name,
        avatarEmoji: childData.avatar_emoji,
        createdAt: childData.created_at,
      };

      setChild(foundChild);
      setPin(profile?.pin || '1234');
      setGateState('ready');
    } catch (err) {
      console.warn('Error checking children:', err);
      setGateState('onboarding');
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkChildProfiles(session.user);
      } else {
        setGateState('unauthenticated');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkChildProfiles(session.user);
      } else {
        setUser(null);
        setChild(null);
        setGateState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, [checkChildProfiles]);

  const handleAuthSuccess = useCallback(() => {
    // Auth state change listener will handle the rest
  }, []);

  const handleOnboardingComplete = useCallback((newChild: Child) => {
    setChild(newChild);

    // Read PIN from onboarding setup
    try {
      const setup = JSON.parse(localStorage.getItem('onboarding-setup') || '{}');
      if (setup.pin) setPin(setup.pin);
    } catch {
      // ignore
    }

    setGateState('ready');
  }, []);

  // Loading state
  if (gateState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <p className="text-white font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (gateState === 'unauthenticated') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Logged in but no children
  if (gateState === 'onboarding' && user) {
    return <OnboardingPage userId={user.id} onComplete={handleOnboardingComplete} />;
  }

  // Ready — render the app
  if (gateState === 'ready' && user && child) {
    return <>{children({ user, child, pin })}</>;
  }

  // Fallback
  return null;
}
