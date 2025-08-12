"use client";

import { useEffect, useState } from "react";
import { Event, useEventContext } from "@/app/context/EventContext";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { calculateMetrics } from "@/lib/utils/metrics";
import { supabase } from "@/lib/utils/supabaseClient";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";


export default function Home() {
  const { events, setEvents } = useEventContext();
  const [today, setToday] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.push('/');
      } else {
      setUser(data.session?.user ?? null);
      }
    });
  }, []);

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

  useEffect(() => {
    async function createProfile() {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!data) {
        await supabase.from('profiles').insert({
          id: user.id,
          display_name: user.user_metadata.full_name || '',
          avatar_url: user.user_metadata.avatar_url || '',
        });
      }
    }
    createProfile();
  }, [user]);
  

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
  const tag = e.tag || e.extendedProps?.tag || 'untagged';
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

// #8 logic
const pastWeekEvents = events.filter(e => {
  const eventDate = new Date(e.start);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  return (
    eventDate >= oneWeekAgo &&
    eventDate <= today &&
    e.extendedProps?.isCompleted === true &&
    e.extendedProps?.isReviewed === true
  );
});

const dayMap = {
  Mon: { total: 0, count: 0 },
  Tue: { total: 0, count: 0 },
  Wed: { total: 0, count: 0 },
  Thu: { total: 0, count: 0 },
  Fri: { total: 0, count: 0 },
  Sat: { total: 0, count: 0 },
  Sun: { total: 0, count: 0 },
};

pastWeekEvents.forEach(e => {
  const day = new Date(e.start).toLocaleDateString('en-US', { weekday: 'short' });
  const prod = e.extendedProps?.reviewData?.productivityRating ?? 3;
  if(dayMap[day as keyof typeof dayMap]) {
    dayMap[day as keyof typeof dayMap].total += prod;
    dayMap[day as keyof typeof dayMap].count += 1;
  }
});

// Prepare data for chart
const productivityData = Object.entries(dayMap).map(([day, { total, count }]) => ({
  day,
  productivity: count > 0 ? total / count : 0
}));

// AI insight
const highestDay = productivityData.reduce((max, d) => d.productivity > max.productivity ? d : max, productivityData[0]);
const oldAiInsight = highestDay.productivity > 0
  ? `Your highest productivity score this week was on ${highestDay.day}. Consider protecting that time for important work.`
  : "Complete more events with reviews to unlock insights!";


// #9 logic
const metrics = calculateMetrics(events);
function useAiSummary(metrics: any) {
  const [summary, setSummary] = useState("Loading AI summary...");

  useEffect(() => {
    const cacheKey = "aiSummaryCache";
    const cacheExpiryMs = 1000 * 60 * 60; // 1 hour

    async function fetchSummary() {
      try {
        const res = await fetch("/api/assistant/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metrics),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const now = Date.now();
        // Save to localStorage with timestamp
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ summary: data.summary, timestamp: now })
        );
        setSummary(data.summary || "No summary available.");
      } catch (e) {
        setSummary("Failed to load AI summary.");
      }
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { summary: cachedSummary, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < cacheExpiryMs) {
        // Use cached summary
        setSummary(cachedSummary);
        return;
      }
    }

    // If no valid cache, fetch new summary
    fetchSummary();
  }, [metrics]);

  return summary;
}
const aiSummary = useAiSummary(metrics);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Home Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Upcoming / Live Tracker */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Next Event</h2>
          {upcomingEvent && !upcomingEvent.extendedProps?.isCompleted ? (
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
          {eventsForDate(today).filter((e: any) => !e.extendedProps?.isCompleted).length > 0 ? (
            <ul className="space-y-2">
              {eventsForDate(new Date(today))
                .filter((e: any) => !e.extendedProps?.isCompleted)
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
            {events.filter((e: any) => isSameDay(new Date(e.start), today) && !e.extendedProps?.isCompleted && (e.extendedProps?.reminder || e.reminder) !== 'none').length > 0 ? (
            events
                .filter((e: any) => isSameDay(new Date(e.start), today) && !e.extendedProps?.isCompleted && (e.extendedProps?.reminder || e.reminder) !== 'none')
                .map((e: any) => (
                <li key={e.id}>
                    ⏰ {e.title} - {(e.extendedProps?.reminder || e.reminder)} before
                </li>
                ))
            ) : (
            <li className="text-gray-500">No reminders today.</li>
            )}
        </ul>
        </div>


        {/* 5. Busiest Day of the Week */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">This Week's Peak</h2>
          <p className="text-sm text-gray-700">📅 {busiestDay}</p>
        </div>


        {/* 6. Productivity Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Weekly Load</h2>
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




                {/* 8. AI Insights */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">AI Insights</h2>
          <p className="text-sm text-gray-700 mb-4">{oldAiInsight}</p>

          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="productivity" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 9. Smart Summary */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Smart Summary</h2>
          <p className="text-sm text-gray-700 mb-4">{aiSummary}</p>
        </div>
      </div>
    </div>
  );
}
