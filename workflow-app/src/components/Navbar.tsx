'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/98 shadow-md backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="text-2xl font-bold text-primary">WorkFlow</div>
          
          <div className="hidden md:flex space-x-8">
            <Link 
              href="/calendar"
              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg font-medium transition-all"
            >
              Calendar
            </Link>
            <Link 
              href="/productivity"
              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg font-medium transition-all"
            >
              Productivity
            </Link>
            <Link 
              href="/settings"
              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg font-medium transition-all"
            >
              Settings
            </Link>
            <Link 
              href="/profile"
              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg font-medium transition-all"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 