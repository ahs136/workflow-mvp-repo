'use client';

import AppNavbar from '@/components/AppNavbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      
      {/* Main content - pushed down by navbar height */}
      <main className="pt-20 px-6">
        <div className="max-w-[1300px] mx-auto">
          {/* Grid layout for the four main sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Events */}
            <section className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-2xl font-bold text-text mb-4">Today & Tomorrow</h2>
              <div className="space-y-4">
                {/* Placeholder for events */}
                <p className="text-gray-600">No upcoming events</p>
              </div>
            </section>

            {/* Reminders */}
            <section className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-2xl font-bold text-text mb-4">Reminders</h2>
              <div className="space-y-4">
                {/* Placeholder for reminders */}
                <p className="text-gray-600">No active reminders</p>
              </div>
            </section>

            {/* Live Activity Tracking */}
            <section className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-2xl font-bold text-text mb-4">Live Activity</h2>
              <div className="space-y-4">
                {/* Placeholder for live activity */}
                <p className="text-gray-600">No active tasks</p>
              </div>
            </section>

            {/* Productivity Analytics */}
            <section className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-2xl font-bold text-text mb-4">Analytics</h2>
              <div className="space-y-4">
                {/* Placeholder for analytics */}
                <p className="text-gray-600">Start tracking to see your analytics</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 