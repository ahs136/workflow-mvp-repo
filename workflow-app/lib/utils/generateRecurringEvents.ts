import { EventInput } from "@fullcalendar/core";

const WEEKDAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6
};

function toISODateTime(dateLike: string | Date | undefined | null): string | null {
  if (!dateLike) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** deterministic id: baseId + compact ISO (safe for text id column) */
function recurrenceId(baseId: string, isoStart: string) {
  // strip characters that can be problematic
  const compact = isoStart.replace(/[:.]/g, "").replace(/Z$/, "Z");
  return `${baseId}-${compact}`;
}

export function generateRecurringEvents(event: EventInput): EventInput[] {
  if (!event.id) throw new Error("Base event must have an id before generating recurrences.");

  const results: EventInput[] = [];

  const startISO = toISODateTime(event.start as string | Date);
  const endISO = toISODateTime(event.end as string | Date);
  if (!startISO || !endISO) return results; // invalid dates -> nothing to generate

  const start = new Date(startISO);
  const end = new Date(endISO);
  const durationMs = end.getTime() - start.getTime();

  const repeatUntilISO = toISODateTime((event as any).repeatUntil);
  // default: 30 days after start if repeatUntil missing
  const repeatEnd = repeatUntilISO ? new Date(repeatUntilISO) : new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30);

  const originalStartISO = start.toISOString();

  const baseId = String(event.id);

  if (event.repeat === "daily") {
    const current = new Date(start);
    // keep same time-of-day as start
    while (current <= repeatEnd) {
      const currentISO = current.toISOString();
      if (currentISO !== originalStartISO) {
        const newStart = new Date(current);
        const newEnd = new Date(newStart.getTime() + durationMs);

        results.push({
          // spread minimal base props to avoid accidentally copying recurrence fields
          title: event.title,
          extendedProps: (event as any).extendedProps || (event as any),
          id: recurrenceId(baseId, newStart.toISOString()),
          groupId: baseId,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }

  if (event.repeat === "weekly" && Array.isArray((event as any).byDay) && (event as any).byDay.length) {
    const validDays = (event as any).byDay
      .map((d: string) => WEEKDAY_MAP[d])
      .filter((d: number) => d !== undefined);

    // iterate day-by-day from start to repeatEnd
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current <= repeatEnd) {
      if (validDays.includes(current.getDay())) {
        // set time-of-day to original start
        const newStart = new Date(current);
        newStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
        const newEnd = new Date(newStart.getTime() + durationMs);

        const isoStart = newStart.toISOString();
        if (isoStart !== originalStartISO) {
          results.push({
            title: event.title,
            extendedProps: (event as any).extendedProps || (event as any),
            id: recurrenceId(baseId, isoStart),
            groupId: baseId,
            start: isoStart,
            end: newEnd.toISOString(),
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return results;
}
