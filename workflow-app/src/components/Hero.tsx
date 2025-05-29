'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-secondary to-primary text-white px-4 overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse"
        style={{
          animation: 'pulse 8s infinite',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-3xl text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Transform Your Workflow
        </h1>
        <p className="text-xl md:text-2xl mb-10 opacity-90">
          Streamline your processes and boost productivity with our innovative platform
        </p>
        <Link
          href="/calendar"
          className="inline-block px-8 py-4 text-lg font-semibold text-primary bg-white rounded-full shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
        >
          Get Started Today
        </Link>
      </div>
    </section>
  );
}

// Add this to your globals.css
/*
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
}
*/ 