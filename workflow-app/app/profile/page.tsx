'use client';

import Profile from '@/components/Profile/Profile';
import AppNavbar from '@/components/layout/AppNavbar';

export default function ProfilePage() {
  return (
    <div className="min-h-screen p-4 bg-white">
      <AppNavbar />
      <div className="mt-16 h-auto bg-white rounded-lg shadow-lg p-4">
        <Profile />
      </div>
    </div>
  );
} 