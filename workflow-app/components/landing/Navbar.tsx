'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-nav">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-[1.8rem] font-bold text-primary tracking-tight">
            WorkFlow
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/about"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>

          {/* Mobile navigation - simplified for landing */}
          <div className="md:hidden">
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