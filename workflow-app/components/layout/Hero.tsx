'use client';

import { supabase } from '@/lib/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  function handleGetStarted() {
    if (user) {
      router.push('/home');
    } else {
      alert('Please sign in first.');
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary" />
      
      {/* Animated radial gradient overlay */}
      <div 
        className="absolute inset-0 w-[150%] h-[150%] animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
          transform: 'translate(-15%, -15%)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-[800px] mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] mb-8">
          Transform Your Workflow
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-[600px] mx-auto">
          Declutter your mind and boost your productivity with AI-driven tools that revolutionize task management through user-centric design
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white rounded-full shadow-lg hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
          >
            Get Started Today
          </button>
          <button
            onClick={() => router.push('/about')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white rounded-full shadow-lg hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
          >
            User Manual
          </button>
          <p className="text-sm md:text-base text-white/90 mt-8 max-w-[600px] mx-auto font-medium">
          Visit our about page for more info about your privacy, the app, and the developer!
        </p>
        </div>
      </div>
    </section>
  );
}

