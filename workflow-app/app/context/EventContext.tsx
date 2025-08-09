"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { normalizeEvents } from "@/lib/utils/normalizeEvents";

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;
  location?: string;
  reminder?: string;
  tag?: string;
  color?: string;
  isStructural?: boolean;
  isNonNegotiable?: boolean;
  repeat?: string;
  repeatUntil?: string;
  byDay?: string[];
  // Also allow extendedProps-style extras
  extendedProps?: {
    isCompleted?: boolean;
    isReviewed?: boolean;
    tag?: string;
  };
}

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  clearAllEvents: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within EventProvider");
  }
  return context;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("calendarEvents");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    // One function that fetches + normalizes
    const updateEvents = () => {
      const stored = localStorage.getItem("calendarEvents");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const normalized = normalizeEvents(parsed);

      localStorage.setItem("calendarEvents", JSON.stringify(normalized));
      setEvents(normalized as Event[]);
    };

    updateEvents(); // run once immediately
    const interval = setInterval(updateEvents, 60 * 1000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const clearAllEvents = () => {
    localStorage.removeItem("calendarEvents");
    setEvents([]);
    console.log("Cleared all events from localStorage and React state.");
  };

  return (
    <EventContext.Provider value={{ events, setEvents, clearAllEvents }}>
      {children}
    </EventContext.Provider>
  );
}
