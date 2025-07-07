'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar/Calendar';
import AppNavbar from '@/components/layout/AppNavbar';

export default function CalendarPage() {
  return (
    <div className="min-h-screen p-4 bg-white">
      <AppNavbar />
      <div className="mt-16 h-[800px] bg-white rounded-lg shadow-lg p-4">
        <Calendar />
      </div>
    </div>
  );
} 