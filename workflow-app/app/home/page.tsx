'use client';

import { useState } from 'react';
import Home from '@/components/Home/Home';
import AppNavbar from '@/components/layout/AppNavbar';
import useRequireAuth from '@/lib/utils/useRequireAuth';

export default function HomePage() {
  const { loading } = useRequireAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-white">
      <AppNavbar />
      <div className="mt-16 h-auto bg-white rounded-lg shadow-lg p-4">
        <Home />
      </div>
    </div>
  );
} 