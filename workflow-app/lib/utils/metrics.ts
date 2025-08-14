import { Event } from "@/app/context/EventContext";
import { supabase } from "@/lib/utils/supabaseClient";

interface Metrics {
  totalEvents: number;
  completedEvents: number;
  completionRate: number;
  currentStreak: number;
  upcomingDeadlines: number;
}

// Your existing pure function stays the same
export function calculateMetrics(events: Event[], daysAhead = 7): Metrics {
  const now = new Date();

  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.extendedProps?.isCompleted).length;
  const completionRate = totalEvents ? (completedEvents / totalEvents) * 100 : 0;

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

// NEW async helper to pull from DB
export async function fetchMetricsFromDb(userId: string, daysAhead = 7) {
  if (!userId) throw new Error("User ID is required to fetch metrics");

  const { data: rows, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  // Map DB rows into your Event shape
  const events: Event[] = rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    tag: row.tag,
    extendedProps: {
      isCompleted: row.is_completed,
      tag: row.tag,
      ...row.extended_props,
    },
  }));

  return calculateMetrics(events, daysAhead);
}
