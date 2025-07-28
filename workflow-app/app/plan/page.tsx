'use client';

import Plan from '@/components/Plan/Plan';
import AppNavbar from '@/components/layout/AppNavbar';
import { useEventContext } from '../context/EventContext';

export default function PlanPage() {
  const {events, setEvents} = useEventContext();

  return (
    <div className="min-h-screen p-4 bg-white">
      <AppNavbar />
      <div className="mt-16 h-auto bg-white rounded-lg shadow-lg p-4">
        <Plan />
      </div>
    </div>
  );
} 