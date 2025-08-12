'use client';

import Link from 'next/link';
import { supabase } from '@/lib/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Setup auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) console.error('Google sign-in error:', error.message);
  }

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
    else router.push('/');
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-nav">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-[1.8rem] font-bold text-primary tracking-tight">
            WorkFlow
          </Link>

          <div className="hidden md:flex items-center space-x-5">
            {user ? (
              <button onClick={signOut} className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
                Sign Out
              </button>
            ) : (
              <button onClick={signInWithGoogle} className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
                Sign in with Google
              </button>
            )}
            <Link
              href="/about"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>

          {/* Mobile navigation - simplified for landing */}
          <div className="md:hidden flex items-center space-x-1">
            {user ? (
              <button onClick={signOut} className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
                Sign Out
              </button>
            ) : (
              <button onClick={signInWithGoogle} className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
                Sign In
              </button>
            )}
            <Link
              href="/about"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
