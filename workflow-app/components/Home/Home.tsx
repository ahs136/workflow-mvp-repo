"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const stored = localStorage.getItem("calendarEvents");
    if (stored) {
      const parsed = JSON.parse(stored).map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: e.end ? new Date(e.end) : null,
      }));
      setEvents(parsed);
    }
  }, []);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const eventsForDate = (date: Date) =>
    events.filter(e => isSameDay(e.start, date));

  const upcomingEvent = events
    .filter(e => e.start > new Date())
    .sort((a, b) => a.start - b.start)[0];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Home Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Upcoming / Live Tracker */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Next Event</h2>
          {upcomingEvent ? (
            <div>
              <div className="text-lg font-bold">{upcomingEvent.title}</div>
              <div className="text-sm text-gray-600">
                Starts at: {upcomingEvent.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No upcoming events today.</div>
          )}
        </div>

        {/* 2. Today's Events */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Today's Events</h2>
          {eventsForDate(today).length > 0 ? (
            <ul className="space-y-2">
              {eventsForDate(today).map(e => (
                <li key={e.id} className="text-sm bg-gray-100 p-2 rounded">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-gray-500">
                    {e.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {e.end?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No events today.</div>
          )}
        </div>

        {/* 3. Tomorrow's Events */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Tomorrow's Events</h2>
          {eventsForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)).length > 0 ? (
            <ul className="space-y-2">
              {eventsForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)).map(e => (
                <li key={e.id} className="text-sm bg-gray-100 p-2 rounded">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-gray-500">
                    {e.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {e.end?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No events tomorrow.</div>
          )}
        </div>

        {/* 4. Reminders (Today Only) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Reminders</h2>
          <ul className="text-sm space-y-2">
            {events
              .filter(e => isSameDay(e.start, today) && e.extendedProps?.reminder !== 'none')
              .map(e => (
                <li key={e.id}>
                  ⏰ {e.title} - {e.extendedProps.reminder} before
                </li>
              ))}
          </ul>
        </div>

        {/* 5. Non-Negotiables Placeholder */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Weekly Non-Negotiables</h2>
          <ul className="text-sm list-disc pl-4">
            <li>🏋️‍♂️ Workout — M/W/F 7:00 AM</li>
            <li>📞 Team Sync — Mon 11:00 AM</li>
            <li>🧠 Focus Time — Daily 2–4 PM</li>
          </ul>
        </div>

        {/* 6. Productivity Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Productivity Analytics</h2>
          <div className="text-sm text-gray-700">
            Total Events This Week: {events.length}
            <br />
            Avg Events Per Day: {(events.length / 7).toFixed(1)}
          </div>
        </div>

        {/* 7. Weekly Insights (Tag Trends) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Weekly Tag Insights</h2>
          <ul className="text-sm">
            {['general', 'focus', 'meeting', 'workout', 'personal'].map(tag => {
              const count = events.filter(e => e.extendedProps?.tag === tag).length;
              return (
                <li key={tag}>
                  <span className="capitalize">{tag}</span>: {count} event{count !== 1 && 's'}
                </li>
              );
            })}
          </ul>
        </div>

        {/* 8. AI Assistant Placeholder */}
        <div className="bg-white p-4 rounded-lg shadow text-gray-500">
          <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
          <p>🧠 Coming soon: Get suggestions, reschedule conflicts, and optimize your week.</p>
        </div>
      </div>
    </div>
  );
}
