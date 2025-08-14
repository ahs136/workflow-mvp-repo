'use client';

import Home from '@/app/page';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppNavbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-nav">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-[1.8rem] font-bold text-primary tracking-tight">
            WorkFlow
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <button className="home-btn" onClick={() => router.push('/home')}>
              <span className="house"></span>
            </button>
            <style jsx>{`.home-btn {
                      background: #4f46e5; /* Blue */
                      border: none;
                      padding: 12px;
                      border-radius: 10px;
                      cursor: pointer;
                      transition: background 0.2s ease, transform 0.1s ease;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }

                    .home-btn:hover {
                      background: #2563eb; /* Darker blue */
                      transform: translateY(-2px);
                    }

                    .house {
                      position: relative;
                      width: 20px;
                      height: 20px;
                      background: #fff;
                      clip-path: polygon(
                        50% 0%, 
                        0% 40%, 
                        0% 100%, 
                        100% 100%, 
                        100% 40%
                      );
                    }

                    .house::before {
                      content: '';
                      position: absolute;
                      bottom: 0;
                      left: 25%;
                      width: 50%;
                      height: 50%;
                      background: #3b82f6;
                    }`}</style>
              
            <Link 
              href="/calendar"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Calendar
            </Link>
            <Link 
              href="/plan"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Plan
            </Link>
            <Link 
              href="/productivity"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Productivity
            </Link>
            <Link 
              href="/profile"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              Profile
            </Link>
            <Link 
              href="/about"
              className="text-text font-medium px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              About
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