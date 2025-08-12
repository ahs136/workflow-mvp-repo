"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { normalizeEvents } from "@/lib/utils/normalizeEvents";
import { supabase } from "@/lib/utils/supabaseClient";
import { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);
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

  async function clearAllEvents() {
    localStorage.removeItem("calendarEvents");
    
    if (!user?.id) {
      console.error('No user logged in');
      return;
    }
    
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('user_id', user.id);  // delete ALL events for this user
    
    if (error) {
      console.error('Error deleting events:', error);
    } else {
      console.log('All events deleted successfully');
      setEvents([]);
    }
  }
  

  return (
    <EventContext.Provider value={{ events, setEvents, clearAllEvents }}>
      {children}
    </EventContext.Provider>
  );
}
