"use client";

import { useEffect, useState } from "react";
import { Event, useEventContext } from "@/app/context/EventContext";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export default function Home() {
  const { events, setEvents } = useEventContext();
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

  // #5 logic
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const thisWeekEvents = events.filter(e => {
    const start = typeof e.start === 'string' ? parseISO(e.start) : e.start;
    return isWithinInterval(start, { start: weekStart, end: weekEnd });
  });

  const numEvents = thisWeekEvents.length;
  const uniqueTags = new Set(thisWeekEvents.map(e => e.extendedProps?.tag || 'untagged'));

  const productivityText = `You have ${numEvents} events scheduled this week across ${uniqueTags.size} different focus areas.`;

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const eventsForDate = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.start), date));

  const upcomingEvent = events
    .filter(e => new Date(e.start) > new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  const tagThresholds: Record<string, { low: number; high: number }> = {
    class: { low: 5, high: 12 },
    workout: { low: 3, high: 6 },
    social: { low: 1, high: 3 },
    focus: { low: 3, high: 7 },
    meeting: { low: 2, high: 5 },
    deadline: { low: 0, high: 2 },
    personal: { low: 1, high: 3 },
  };

  const classify = (tag: string, count: number) => {
    const { low, high } = tagThresholds[tag] || { low: 1, high: 3 };
    if (count > high) return 'Overloaded';
    if (count < low) return 'Underloaded';
    return 'Balanced';
  };

  const emojiMap: Record<string, string> = {
    Overloaded: '⚠️',
    Balanced: '✅',
    Underloaded: '🔻',
  };

  const busiestDay = (() => {
    const dayTotals: Record<string, number> = {};
    thisWeekEvents.forEach(e => {
      const date = new Date(e.start).toDateString();
      const duration = e.end ? (new Date(e.end).getTime() - new Date(e.start).getTime()) / (1000 * 60 * 60) : 1;
      dayTotals[date] = (dayTotals[date] || 0) + duration;
    });
    const busiest = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    return busiest ? `${busiest[0]} — ${busiest[1].toFixed(1)} hrs scheduled` : 'No events this week';
  })();
  
// #7 logic


const tagCounts: Record<string, number> = {};
thisWeekEvents.forEach(e => {
  const tag = e.extendedProps?.tag || 'untagged';
  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
});

const tagSummaries = Object.entries(tagCounts).map(([tag, count]) => {
  const status = classify(tag, count);
  return {
    tag,
    count,
    status,
    emoji: emojiMap[status],
  };
});

const highlightSummary = () => {
  const overloaded = tagSummaries.filter(s => s.status === 'Overloaded').map(s => s.tag);
  const underloaded = tagSummaries.filter(s => s.status === 'Underloaded').map(s => s.tag);
  const highlights = [];

  if (overloaded.length) highlights.push(`⚠️ High load in ${overloaded.join(', ')}`);
  if (underloaded.length) highlights.push(`🔻 Low activity in ${underloaded.join(', ')}`);
  if (!highlights.length) return "✅ You're well-balanced across all categories this week.";

  return highlights.join('. ') + '.';
};



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
                Starts at: {new Date(upcomingEvent.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
              {eventsForDate(new Date(today))
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map(e => (
                  <li key={e.id} className="text-sm bg-gray-100 p-2 rounded">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {e.end ? new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ''}
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
            {eventsForDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map(e => (
                <li key={e.id} className="text-sm bg-gray-100 p-2 rounded">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {e.end ? new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ''}
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
        <h2 className="text-xl font-semibold mb-2">Upcoming Reminders</h2>
        <ul className="text-sm space-y-2">
            {events.filter(e => isSameDay(new Date(e.start), today) && e.extendedProps?.reminder !== 'none').length > 0 ? (
            events
                .filter(e => isSameDay(new Date(e.start), today) && e.extendedProps?.reminder !== 'none')
                .map(e => (
                <li key={e.id}>
                    ⏰ {e.title} - {e.extendedProps?.reminder} before
                </li>
                ))
            ) : (
            <li className="text-gray-500">No reminders today.</li>
            )}
        </ul>
        </div>


        {/* 5. Busiest Day of the Week */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">This Week’s Peak</h2>
          <p className="text-sm text-gray-700">📅 {busiestDay}</p>
        </div>


        {/* 6. Productivity Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Productivity Analytics</h2>
          <div className="text-sm text-gray-700">
            {productivityText}
            <br />
            Avg Events Per Day: {(numEvents / 7).toFixed(1)}
          </div>
        </div>

        {/* 7. Weekly Tag Insights */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Weekly Tag Insights</h2>

          <div className="text-sm text-gray-700 italic mb-2">{highlightSummary()}</div>

          <ul className="text-sm space-y-1">
            {tagSummaries.map(({ tag, count, status, emoji }) => (
              <li key={tag} className="flex justify-between">
                <span className="capitalize">{tag}</span>
                <span>
                  {count} event{count !== 1 && 's'} — {emoji} {status}
                </span>
              </li>
            ))}
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
