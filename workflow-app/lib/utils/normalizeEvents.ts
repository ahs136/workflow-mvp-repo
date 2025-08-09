import { EventInput } from "@fullcalendar/core";

export function normalizeEvents(rawEvents: EventInput[]): EventInput[] {
    const now = new Date().getTime();
  
    return rawEvents.map(event => {
      const startTs = new Date(event.start as string).getTime();
      const endTs = event.end
        ? new Date(event.end as string).getTime()
        : startTs + 60 * 60 * 1000; // fallback: 1h after start
  
      if (now > endTs && !event.extendedProps?.isCompleted) {
        const tag = event.tag || event.extendedProps?.tag || '';
        const autoReviewed = ['class', 'social'].includes(tag.toLowerCase());
  
        return {
          ...event,
          extendedProps: {
            ...event.extendedProps,
            isCompleted: true,
            isReviewed: autoReviewed
              ? true
              : event.extendedProps?.isReviewed ?? false,
          },
        };
      }
  
      return event;
    });
  }