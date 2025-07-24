import { nanoid } from "nanoid";


type EventInput = {
    title: string;
    start: string; // ISO format
    end: string;
    repeat?: "none" | "daily" | "weekly" | "weekdays" | "customDays";
    byDay?: string[]; // E.g. ["MO", "WE"]
    repeatUntil?: string; // ISO
    id?: string;
  };
  
  const WEEKDAY_MAP = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };
  
  export function generateRecurringEvents(event: EventInput): EventInput[] {
    const events: EventInput[] = [];
  
    const start = new Date(event.start);
    const end = new Date(event.end);
    const repeatEnd = event.repeatUntil
      ? new Date(event.repeatUntil)
      : new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30); // default 30 days
  
    const base: Omit<EventInput, "start" | "end"> = {
      ...event,
      repeat: undefined,
      repeatUntil: undefined,
      byDay: undefined,
    };
  
    const originalStartISO = start.toISOString();
  
    if (event.repeat === "daily") {
      let current = new Date(start);
      while (current <= repeatEnd) {
        const newStart = new Date(current);
        const newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()));
        const isoStart = newStart.toISOString();
        if (isoStart !== originalStartISO) {
          events.push({
            ...base,
            id: nanoid(),
            start: isoStart,
            end: newEnd.toISOString(),
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }
  
    if (event.repeat === "weekly" && Array.isArray(event.byDay)) {
      const validDays = event.byDay.map(day => WEEKDAY_MAP[day as keyof typeof WEEKDAY_MAP]);
  
      let current = new Date(start);
      current.setHours(0, 0, 0, 0);
  
      while (current <= repeatEnd) {
        if (validDays.includes(current.getDay())) {
          const newStart = new Date(current);
          newStart.setHours(start.getHours(), start.getMinutes());
          const newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()));
          const isoStart = newStart.toISOString();
  
          // Only push if it's not the original event (already added)
          if (isoStart !== originalStartISO) {
            events.push({
              ...base,
              id: nanoid(),
              start: isoStart,
              end: newEnd.toISOString(),
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }
  
    return events;
  }
  