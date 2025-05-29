'use client';

import Link from 'next/link';

export default function Hero() {
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
          Streamline your processes and boost productivity with our innovative platform
        </p>
        <Link
          href="/home"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-white rounded-full shadow-lg hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
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