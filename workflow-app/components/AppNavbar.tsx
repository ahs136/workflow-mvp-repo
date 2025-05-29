'use client';

import Link from 'next/link';

export default function AppNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-nav">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/home" className="text-[1.8rem] font-bold text-primary tracking-tight">
            WorkFlow
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/calendar"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Calendar
            </Link>
            <Link 
              href="/productivity"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Productivity
            </Link>
            <Link 
              href="/settings"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Settings
            </Link>
            <Link 
              href="/profile"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* Mobile navigation - fixed at bottom */}
          <div className="fixed md:hidden bottom-0 left-0 right-0 bg-white shadow-nav flex justify-around items-center p-4">
            <Link 
              href="/calendar"
              className="text-text/80 text-sm font-medium hover:text-primary transition-colors"
            >
              Calendar
            </Link>
            <Link 
              href="/productivity"
              className="text-text/80 text-sm font-medium hover:text-primary transition-colors"
            >
              Productivity
            </Link>
            <Link 
              href="/settings"
              className="text-text/80 text-sm font-medium hover:text-primary transition-colors"
            >
              Settings
            </Link>
            <Link 
              href="/profile"
              className="text-text/80 text-sm font-medium hover:text-primary transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 