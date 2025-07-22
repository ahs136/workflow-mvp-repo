'use client';

import { useEffect, useState } from 'react';
import Plan from '@/components/Plan/Plan';
import AppNavbar from '@/components/layout/AppNavbar';


export default function PlanPage() {
  return (
    <div className="min-h-screen p-4 bg-white">
      <AppNavbar />
      <div className="mt-16 h-auto bg-white rounded-lg shadow-lg p-4">
        <Plan />
      </div>
    </div>
  );
} 