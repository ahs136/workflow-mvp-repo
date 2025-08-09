// /lib/metrics.ts

import { Event } from "@/app/context/EventContext";

interface Metrics {
  totalEvents: number;
  completedEvents: number;
  completionRate: number; // Percentage 0–100
  currentStreak: number;   // Days with consecutive completed events
  upcomingDeadlines: number; // Count of deadline events in next X days
}

export function calculateMetrics(events: Event[], daysAhead = 7): Metrics {
  const now = new Date();

  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.extendedProps?.isCompleted).length;
  const completionRate = totalEvents ? (completedEvents / totalEvents) * 100 : 0;

  // Calculate current streak of days with completed events
  const completedDatesSet = new Set(
    events
      .filter(e => e.extendedProps?.isCompleted)
      .map(e => new Date(e.start).toDateString())
  );

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (completedDatesSet.has(date.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  // Count deadlines within next `daysAhead` days
  const upcomingDeadlines = events.filter(e => {
    const tag = e.tag || e.extendedProps?.tag || "";
    if (tag.toLowerCase() !== "deadline") return false;

    const start = new Date(e.start);
    return start >= now && start <= new Date(now.getTime() + daysAhead * 86400000);
  }).length;

  return {
    totalEvents,
    completedEvents,
    completionRate: Math.round(completionRate),
    currentStreak: streak,
    upcomingDeadlines,
  };
}
