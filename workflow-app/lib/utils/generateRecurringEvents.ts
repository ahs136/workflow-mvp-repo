import { nanoid } from "nanoid";

export type EventInput = {
  id?: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  repeat?: "none" | "daily" | "weekly" | "weekdays" | "customDays";
  byDay?: string[]; // e.g. ["MO", "WE"]
  repeatUntil?: string; // ISO string date limit for recurrence
  // other props can be added as needed
};

const WEEKDAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Generates recurring event instances based on a base event with recurrence rules.
 * The base event itself is NOT included in the returned array.
 * Each generated instance will have a new unique id and a recurringBaseId pointing to the base event's id.
 */
export function generateRecurringEvents(event: EventInput): EventInput[] {
  if (!event.id) {
    event.id = nanoid(); // ensure base event has an id
  }

  const events: EventInput[] = [];

  const start = new Date(event.start);
  const end = new Date(event.end);

  // Recurrence end date or default 30 days after start
  const repeatEnd = event.repeatUntil
    ? new Date(event.repeatUntil)
    : new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30);

  // Base event props for recurrences, excluding recurrence-specific fields
  const base: Omit<EventInput, "start" | "end" | "id" | "repeat" | "repeatUntil" | "byDay"> & { recurringBaseId: string } = {
    ...event,
    id: undefined,        // generated per recurrence below
    repeat: undefined,
    repeatUntil: undefined,
    byDay: undefined,
    recurringBaseId: event.id,
  };

  const originalStartISO = start.toISOString();

  if (event.repeat === "daily") {
    let current = new Date(start);
    current.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());

    while (current <= repeatEnd) {
      const isoStart = current.toISOString();
      if (isoStart !== originalStartISO) {
        const newStart = new Date(current);
        const newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()));

        events.push({
          ...base,
          id: nanoid(),
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }

  if (event.repeat === "weekly" && Array.isArray(event.byDay) && event.byDay.length > 0) {
    const validDays = event.byDay
      .map((day) => WEEKDAY_MAP[day])
      .filter((day) => day !== undefined);

    let current = new Date(start);
    current.setHours(0, 0, 0, 0); // normalize to midnight for day comparison

    while (current <= repeatEnd) {
      if (validDays.includes(current.getDay())) {
        const newStart = new Date(current);
        newStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
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
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // You can add other repeat modes like 'weekdays', 'customDays' here as needed

  return events;
}
