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
  user_id: string;
  group_id?: string;
  title: string;
  description?: string;
  start: string | Date;
  end: string | Date;
  location?: string;
  reminder?: string;
  tag?: string;
  color?: string;
  backgroundColor?: string;
  isStructural?: boolean;
  isNonNegotiable?: boolean;
  repeat?: string;
  repeatUntil?: string;
  byDay?: string[];
  extendedProps?: {
    description?: string;
    location?: string;
    reminder?: string;
    tag?: string;
    color?: string;
    isStructural?: boolean;
    isNonNegotiable?: boolean;
    repeat?: string;
    repeatUntil?: string | null;
    byDay?: string[];
    createdByAI?: boolean;
    isCompleted?: boolean;
    isReviewed?: boolean;
    reviewData?: {
      actualDurationMinutes: number;
      productivityRating: number;
      userNotes: string;
      feedbackTimestamp: string | null;
    };
    createdAt?: string | null;
    updatedAt?: string | null;
    groupId?: string | null;
  };
}

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  clearAllEvents: () => Promise<void>;
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
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  // --- fetch events once user is available ---
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading events from Supabase:', error);
        return;
      }

      const defaultTagColors: Record<string, string> = {
        deadline: '#dc2626',
        meeting: '#8b5cf6',
        class:   '#1d4ed8',
        focus:   '#ede8d0',
        workout: '#03c04a',
        social:  '#ff8da1',
        personal:'#6b7280',
      };
      
      const formattedEvents: Event[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        start: row.start_time,
        end: row.end_time,
        group_id: row.group_id ?? null,
        backgroundColor: row.background_color ?? defaultTagColors[row.tag as keyof typeof defaultTagColors] ?? '#dc2626',
        extendedProps: {
          description: row.description ?? '',
          location: row.location ?? '',
          tag: row.tag ?? 'deadline',
          color: row.color ?? defaultTagColors[row.tag as keyof typeof defaultTagColors] ?? '#dc2626',
          isStructural: !!row.is_structural,
          isNonNegotiable: !!row.is_non_negotiable,
          repeat: row.repeat ?? 'none',
          repeatUntil: row.repeat_until ?? null,
          byDay: row.by_day ?? [],
          createdByAI: !!row.created_by_ai,
          isCompleted: !!row.is_completed,
          isReviewed: !!row.is_reviewed,
          reviewData: {
            actualDurationMinutes: row.actual_duration_minutes ?? 0,
            productivityRating: row.productivity_rating ?? 0,
            userNotes: row.user_notes ?? '',
            feedbackTimestamp: row.feedback_timestamp ?? null,
          },
          createdAt: row.created_at ?? null,
          updatedAt: row.updated_at ?? null,
        },
      }));

      setEvents(formattedEvents);
    };

    fetchEvents();
  }, [user]);

  const clearAllEvents = async () => {
    const { error } = await supabase.from('events').delete().eq('user_id', user?.id ?? '');
    if (error) {
      console.error('Error clearing events:', error);
    }
    setEvents([]);
  };


  return (
    <EventContext.Provider value={{ events, setEvents, clearAllEvents }}>
      {children}
    </EventContext.Provider>
  );
}

