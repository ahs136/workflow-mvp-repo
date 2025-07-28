"use client"; // important to make it client component

import React, { createContext, useState, useContext, ReactNode } from "react";

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
}

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
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
    // initialize from localStorage if you want
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("events");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // optional: sync back to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("events", JSON.stringify(events));
    }
  }, [events]);

  return (
    <EventContext.Provider value={{ events, setEvents }}>
      {children}
    </EventContext.Provider>
  );
}
