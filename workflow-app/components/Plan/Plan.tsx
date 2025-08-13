// File: app/plan/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toZonedTime, format } from 'date-fns-tz';
import { useEventContext } from '@/app/context/EventContext';
import { EventInput } from '@fullcalendar/core';
import { supabase } from '@/lib/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';


interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // changed from Date for JSON serialization
}


export default function Plan() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { events, setEvents } = useEventContext();
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbackValue, setFeedbackValue] = useState('');
  const [mode, setMode] = useState<'parse' | 'plan'>('parse');


  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  const defaultTagColors: Record<string, string> = {
    deadline: '#dc2626',
    meeting: '#8b5cf6',
    class:   '#1d4ed8',
    focus:   '#ede8d0',
    workout: '#03c04a',
    social:  '#ff8da1',
    personal:'#6b7280',
  };

  interface SessionRow {
    id: string;
    user_id: string;
    title: string;
    messages_count: number;
    last_message: string | null;
    updated_at: string;
  }
  
  // Added: client-side shape including messages
  interface SessionWithMessages extends SessionRow {
    messages: Message[];
  }
  
  useEffect(() => {
    console.log("Events from context:", events);
  }, [events]);

  const [sessions, setSessions] = useState<SessionWithMessages[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;
  
  // inside your Plan component, add helper
  async function fetchCurrentEventsFromDb() {
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch events from DB (Plan):', error);
      return [];
    }

    // Map DB rows -> frontend event shape expected by prompts
    return (data || []).map((r: any) => ({
      id: r.id,
      groupId: r.group_id ?? null,
      title: r.title,
      start: r.start_time,
      end: r.end_time,
      tag: r.tag,
      color: r.color,
      extendedProps: {
        description: r.description,
        location: r.location,
        reminder: r.reminder,
        tag: r.tag,
        reviewData: {
          actualDurationMinutes: r.actual_duration_minutes,
          productivityRating: r.productivity_rating,
          userNotes: r.user_notes,
        },
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    }));
  }


  // --- Supabase helpers (mirroring Calendar.tsx) ---
  function sanitizeTimestamp(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d.toISOString();
      return null;  // invalid date string
    }
    if (value instanceof Date) return value.toISOString();
    return null;
  }
  
  const validReminders = [
    'none',
    '10 minutes before',
    '1 hour before',
    '1 day before',
    '2 days before',
  ];
  function sanitizeReminder(reminder: string | undefined | null): string {
    if (!reminder || !validReminders.includes(reminder)) {
      return 'none';
    }
    return reminder;
  }

  async function saveEventsToSupabase(eventList: EventInput[]) {
    if (!user?.id || eventList.length === 0) return;
  
    const validReminders = [
      'none',
      '10 minutes before',
      '1 hour before',
      '1 day before',
      '2 days before',
    ];
  
    const rows = eventList.map((e) => {
      const ep: any = e.extendedProps || {};
  
      // Validate reminder value
      const rawReminder = ep.reminder ?? (e as any).reminder ?? 'none';
      const reminder = validReminders.includes(rawReminder) ? rawReminder : 'none';
  
      return {
        id: e.id,
        group_id: (e as any).groupId ? (e as any).groupId : null,
        user_id: user.id,
        title: e.title,
        description: ep.description ?? (e as any).description ?? null,
        start_time: sanitizeTimestamp(e.start),
        end_time: sanitizeTimestamp(e.end),
        location: ep.location ?? (e as any).location ?? null,
        reminder: sanitizeReminder(ep.reminder ?? (e as any).reminder),
        tag: ep.tag ?? (e as any).tag ?? 'deadline',
        color: ep.color ?? (e as any).color ?? null,
        is_structural: !!(ep.isStructural ?? (e as any).isStructural),
        is_non_negotiable: !!(ep.isNonNegotiable ?? (e as any).isNonNegotiable),
        repeat: ep.repeat ?? (e as any).repeat ?? 'none',
        repeat_until: sanitizeTimestamp(ep.repeatUntil ?? (e as any).repeatUntil) ?? null,
        by_day: ep.byDay ?? (e as any).byDay ?? [],
        created_by_ai: !!(ep.createdByAI ?? (e as any).createdByAI),
        is_completed: !!(ep.isCompleted ?? (e as any).isCompleted),
        is_reviewed: !!(ep.isReviewed ?? (e as any).isReviewed),
        actual_duration_minutes: ep.reviewData?.actualDurationMinutes ?? 0,
        productivity_rating: ep.reviewData?.productivityRating ?? 0,
        user_notes: ep.reviewData?.userNotes ?? null,
        feedback_timestamp: sanitizeTimestamp(ep.reviewData?.feedbackTimestamp) ?? null,
        created_at: sanitizeTimestamp(ep.createdAt) ?? new Date().toISOString(),
        updated_at: sanitizeTimestamp(ep.updatedAt) ?? new Date().toISOString(),
      };
    });
  
    console.log("Reminder values before upsert:", rows.map(r => r.reminder));
  
    const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id' });
    if (error) console.error('Error bulk saving events (Plan):', error);
  }
  

  async function deleteEventsByIdsFromSupabase(ids: string[]) {
    if (!user?.id || ids.length === 0) return;
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids);
    if (error) console.error('Error deleting events by ids (Plan):', error);
  }

  useEffect(() => {
    if (!user) return;
  
    (async () => {
      try {
        console.log("Loading chat data for user:", user.id);
  
        // 1️⃣ Load sessions
        const { data: sessionsRows, error: sessionsError } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
  
        if (sessionsError) throw sessionsError;
  
        // 2️⃣ If no sessions exist, create initial session with welcome message
        if (!sessionsRows || sessionsRows.length === 0) {
          const id = nanoid();
          const welcomeMessage: Message = {
            id: nanoid(),
            content: "Hi! I'm your AI planning assistant. I can help you create study schedules, set goals, organize tasks, and develop productivity strategies. What would you like to plan today?",
            role: 'assistant',
            timestamp: new Date().toISOString()
          };
          
          const initialSession: SessionWithMessages = {
            id,
            user_id: user.id,
            title: 'New Plan 1',
            messages_count: 1,
            last_message: welcomeMessage.content,
            updated_at: new Date().toISOString(),
            messages: [welcomeMessage]
          };

          setSessions([initialSession]);
          setCurrentSessionId(id);

          // Persist to DB
          await upsertChatSession(id, initialSession.messages.length, initialSession.last_message);
          await insertMessageToDb(id, welcomeMessage);
          return;
        }
  
        // 3️⃣ Load messages for existing sessions
        const sessionIds = sessionsRows.map(s => s.id);
        const { data: messagesRows, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .in("session_id", sessionIds)
          .order("timestamp", { ascending: true });
  
        if (messagesError) throw messagesError;
  
        // 4️⃣ Map messages to their session
        const messagesBySession: Record<string, Message[]> = {};
        (messagesRows || []).forEach(msg => {
          if (!messagesBySession[msg.session_id]) messagesBySession[msg.session_id] = [];
          messagesBySession[msg.session_id].push({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          });
        });
  
        // 5️⃣ Attach messages to sessions
        const sessionsWithMessages = sessionsRows.map((s: any) => ({
          ...s,
          messages: messagesBySession[s.id] || []
        }));
  
        console.log("Sessions with messages:", sessionsWithMessages);
  
        setSessions(sessionsWithMessages);
  
        // 6️⃣ Set current session to the most recently updated one
        if (sessionsWithMessages.length) setCurrentSessionId(sessionsWithMessages[0].id);
  
      } catch (err) {
        console.error("Failed to load chat data:", err);
      }
    })();
  }, [user]);
  
  
  
  // --- Chat DB helpers ---
  async function upsertChatSession(sessionId: string, messagesCount: number, lastMessage: string | null) {
    if (!user?.id) return;
  
    try {
      const newSessionId = sessionId;
  
      const { error: createError } = await supabase
        .from('chat_sessions')
        .upsert([
          {
            id: newSessionId,
            user_id: user.id,
            title: 'New Chat ' + (sessions.length + 1),
            messages_count: messagesCount,
            last_message: lastMessage,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });

      if (createError) {
        console.error('Error creating/updating session:', createError);
      } else {
        setCurrentSessionId(newSessionId);
      }
    } catch (error) {
      console.error('upsertChatSession error:', error);
    }
  }
  
  async function insertMessageToDb(sessionId: string, message: Message) {
    if (!user?.id) return;
  
    try {
      // Insert the new message
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert([{
          id: uuidv4(),
          session_id: sessionId,
          user_id: user.id,
          role: message.role,  // use the role from the message object
          content: message.content,
          timestamp: new Date().toISOString()
        }]);

      if (msgError) {
        console.error('Error inserting message:', msgError);
        return;
      }
  
      // Get the current count from the session
      const { data: sessionData, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('messages_count')
        .eq('id', sessionId)
        .single();
  
      if (fetchError) {
        console.error('Error fetching session count:', fetchError);
        return;
      }
  
      const newCount = (sessionData?.messages_count || 0) + 1;
  
      // Update the session metadata with the last message content
      const { error: sessError } = await supabase
        .from('chat_sessions')
        .update({
          last_message: message.content,
          messages_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
  
      if (sessError) {
        console.error('Error updating session:', sessError);
      }
    } catch (err) {
      console.error('insertMessageToDb error:', err);
    }
  }
  

  function tryApplyEventsFromResponse(text: string) {
    try {
      const parsed = JSON.parse(text);
  
      if (parsed?.action === 'add' && Array.isArray(parsed.events)) {
        const eventsWithIds: EventInput[] = parsed.events.map((event: EventInput) => {
            const id = nanoid();
            console.log('🤖 [Plan Parsed Event] Received parsedEvent, assigning id:', id, event);

            const rawTag = (event as any).tag || (event as any).extendedProps?.tag || 'deadline';
            const color = (event as any).color || (event as any).extendedProps?.color || defaultTagColors[rawTag] || defaultTagColors['deadline'];

            const extendedProps = {
              description: (event as any).description ?? (event as any).extendedProps?.description ?? '',
              location: (event as any).location ?? (event as any).extendedProps?.location ?? '',
              reminder: (event as any).reminder ?? (event as any).extendedProps?.reminder ?? 'none',
              tag: rawTag,
              color,
              isStructural: !!((event as any).isStructural ?? (event as any).extendedProps?.isStructural),
              isNonNegotiable: !!((event as any).isNonNegotiable ?? (event as any).extendedProps?.isNonNegotiable),
              repeat: (event as any).repeat ?? (event as any).extendedProps?.repeat ?? 'none',
              repeatUntil: (event as any).repeatUntil ?? (event as any).extendedProps?.repeatUntil ?? null,
              byDay: Array.isArray((event as any).byDay ?? (event as any).extendedProps?.byDay) ? ((event as any).byDay ?? (event as any).extendedProps?.byDay) : [],
              createdByAI: true,
              isCompleted: !!((event as any).isCompleted ?? (event as any).extendedProps?.isCompleted),
              isReviewed: !!((event as any).isReviewed ?? (event as any).extendedProps?.isReviewed),
              reviewData: (event as any).reviewData ?? (event as any).extendedProps?.reviewData ?? {
                actualDurationMinutes: 0,
                productivityRating: 0,
                userNotes: '',
                feedbackTimestamp: '',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return {
              ...event,
              id,
              user_id: user?.id,
              title: (event as any).title,
              start: (event as any).start,
              end: (event as any).end,
              backgroundColor: color,
              textColor: '#fff',
              extendedProps,
              // Pass through group id if present in parsed data
              groupId: (event as any).groupId ?? null,
              repeat: extendedProps.repeat,
              byDay: extendedProps.byDay,
              repeatUntil: extendedProps.repeatUntil,
            } as any;
        });
  
        setEvents(prev => {
          const updated = [...prev, ...eventsWithIds];
          return updated as any;
        });

        // Persist to Supabase
        saveEventsToSupabase(eventsWithIds).catch(err => console.error('Failed to save events to Supabase from Plan:', err));
      }
  
      if (parsed?.action === 'delete') {
        setEvents(prev => {
          let filtered = prev as any[];
      
          if (Array.isArray(parsed.eventIds) && parsed.eventIds.length > 0) {
            // Delete by IDs
            const idsToDelete = parsed.eventIds as string[];
            filtered = (prev as any[]).filter(e => !idsToDelete.includes(e.id as string));
            // Persist deletion
            deleteEventsByIdsFromSupabase(idsToDelete).catch(err => console.error('Failed to delete events by ids from Supabase (Plan):', err));
          } else if (parsed.match && parsed.value) {
            // Delete by matching criteria
            function eventMatches(event: any): boolean {
              const ext = event.extendedProps || {};
              switch (parsed.match) {
                case 'title':
                  return (event.title || '').toLowerCase() === String(parsed.value).toLowerCase();
                case 'tag':
                  return (ext.tag || event.tag) === parsed.value;
                case 'date':
                  try {
                    const startIso = event.start instanceof Date ? event.start.toISOString() : String(event.start);
                    const eventDate = new Date(startIso).toISOString().slice(0,10);
                    return eventDate === parsed.value;
                  } catch {
                    return false;
                  }
                default:
                  return false;
              }
            }
      
            if (parsed.scope === 'single') {
              const index = (prev as any[]).findIndex(event => eventMatches(event));
              if (index === -1) return prev;
              const removedId = (prev as any[])[index]?.id as string | undefined;
              const newList = [...(prev as any[]).slice(0, index), ...(prev as any[]).slice(index + 1)];
              if (removedId) {
                deleteEventsByIdsFromSupabase([removedId]).catch(err => console.error('Failed to delete single event from Supabase (Plan):', err));
              }
              filtered = newList;
            } else {
              // default to removing all matching events
              const toRemove = (prev as any[]).filter(event => eventMatches(event)).map(e => e.id as string);
              filtered = (prev as any[]).filter(event => !eventMatches(event));
              if (toRemove.length > 0) {
                deleteEventsByIdsFromSupabase(toRemove).catch(err => console.error('Failed to bulk delete from Supabase (Plan):', err));
              }
            }
          } else {
            // No recognizable deletion criteria, no change
            return prev;
          }
      
          return filtered as any;
        });
      }      
    } catch (err) {
      console.warn('Invalid event planning response:', err);
    }
  }
  
  const handleFeedbackClick = (id: string) => {
    setFeedbackTargetId(id);
    setFeedbackValue('');
  };
  
  const handleFeedbackSubmit = async (e: React.FormEvent, msgId: string) => {
    e.preventDefault();
    if (!feedbackValue.trim() || isLoading) return;
  
    const userCorrection = feedbackValue.trim();
    setFeedbackValue('');
    setFeedbackTargetId(null);
    setIsLoading(true);
  
    const userMessage = userCorrection;
    const session = sessions.find(s => s.id === currentSessionId!);
    const timestamp = new Date().toISOString();
  
    const correctionMessage: Message = {
      id: nanoid(),
      content: userMessage,
      role: 'user',
      timestamp
    };
  
    const updatedMessages = session ? [...session.messages, correctionMessage] : [correctionMessage];
    const updatedSession = session ? { ...session, messages: updatedMessages } : null;
  
    setSessions(prev => (
      prev.map(s => s.id === currentSessionId! ? { ...s, messages: [...s.messages, correctionMessage] } : s)
    ));
      // persist user correction
    insertMessageToDb(currentSessionId!, correctionMessage).catch(err => console.error('Failed to insert correction message', err));

  
    try {
      const res = await fetch('/api/assistant/plan-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userCorrection,
          userFeedback: userCorrection,
          currentEvents: events,
          lastResponse: session ? (session.messages[session.messages.length - 1]?.content || '') : '',
          mode,
          user_id: user?.id,
        }),
      });
  
      const assistantText = await res.text();
  
      const assistantMessage: Message = {
        id: nanoid(),
        content: assistantText,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
  
      setSessions(prev => (
        prev.map(s => s.id === currentSessionId! ? { ...s, messages: [...s.messages, assistantMessage] } : s)
      ));
    // persist assistant reply (feedback response)
    insertMessageToDb(currentSessionId!, assistantMessage).catch(err => console.error('Failed to insert assistant feedback message', err));

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to submit correction', err);
      setIsLoading(false);
    }
  };
  

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- UTILITIES ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // load latest events from supabase when user is available (no localStorage)
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const dbEvents = await fetchCurrentEventsFromDb();
        // fetchCurrentEventsFromDb already maps DB rows to event shape
        setEvents(dbEvents as any);
      } catch (err) {
        console.warn('Failed to load events from DB on mount', err);
      }
    })();
  }, [user?.id]);
  



    // load latest events from supabase when user is available (no localStorage)
    useEffect(() => {
      if (!user?.id) return;
  
      (async () => {
        try {
          const dbEvents = await fetchCurrentEventsFromDb();
          // fetchCurrentEventsFromDb already maps DB rows to event shape
          setEvents(dbEvents as any);
        } catch (err) {
          console.warn('Failed to load events from DB on mount', err);
        }
      })();
    }, [user?.id]);
  

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const createNewSession = async () => {
    try {
      const newSessionId = uuidv4();
      
      // Generate a unique title based on existing sessions
      const existingTitles = sessions.map(s => s.title);
      let titleNumber = 1;
      let newTitle = `New Chat ${titleNumber}`;
      while (existingTitles.includes(newTitle)) {
        titleNumber++;
        newTitle = `New Chat ${titleNumber}`;
      }
      
      const { error: createError } = await supabase
        .from('chat_sessions')
        .insert([{
          id: newSessionId,
          user_id: user?.id,
          title: newTitle,
          messages_count: 0,
          last_message: null,
          updated_at: new Date().toISOString()
        }]);
  
      if (createError) {
        console.error('Error creating new session:', createError);
      } else {
        // update UI immediately
        setSessions(prev => ([ 
          {
            id: newSessionId,
            user_id: user?.id || '',
            title: newTitle,
            messages_count: 0,
            last_message: null,
            updated_at: new Date().toISOString(),
            messages: []
          },
          ...prev
        ]));
        setCurrentSessionId(newSessionId);
      }
    } catch (err) {
      console.error('createNewSession error', err);
    }
  };

  

  const deleteSession = async (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      
      // Update current session if we're deleting the active one
      setCurrentSessionId(currentId => {
        if (currentId !== id) return currentId;
        return filtered[0]?.id || null;
      });
      
      return filtered;
    });

    // Delete session and related messages from DB
    try {
      // First delete all messages for this session
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', id);
      
      if (messagesError) console.error('Error deleting messages:', messagesError);

      // Then delete the session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
        
      if (sessionError) console.error('Error deleting session:', sessionError);
    } catch (error) {
      console.error('Error in deleteSession:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
  
    // ensure user session is loaded
    if (!user?.id) {
      // optionally await supabase.auth.getSession() or show an error/UI message
      console.warn('No user session yet — cannot fetch DB events');
    }
  
    setIsLoading(true);

    if (!currentSessionId) {
      // create a new session synchronously if none exists
      const id = nanoid();
      
      // Generate unique title
      const existingTitles = sessions.map(s => s.title);
      let titleNumber = 1;
      let newTitle = `New Chat ${titleNumber}`;
      while (existingTitles.includes(newTitle)) {
        titleNumber++;
        newTitle = `New Chat ${titleNumber}`;
      }
      
      setSessions(prev => ([
        {
          id,
          user_id: user?.id || '',
          title: newTitle,
          messages_count: 0,
          last_message: null,
          updated_at: new Date().toISOString(),
          messages: []
        },
        ...prev
      ]));
      setCurrentSessionId(id);
      await upsertChatSession(id, 0, null);
    }

    // Fetch authoritative events from DB right before calling the AI
    const latestEvents = await fetchCurrentEventsFromDb();
    // Add user message to session & persist
    const userMessage: Message = {
      id: nanoid(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
    };
  
    setSessions(prev => (
      prev.map(s => s.id === currentSessionId! ? { ...s, messages: [...s.messages, userMessage] } : s)
    ));
  
    // persist immediately (non-blocking)
    insertMessageToDb(currentSessionId!, userMessage).catch(err => console.error('Failed to insert user message', err));
  
    // clear input (optional, but UX-friendly)
    setInputValue('');
  
    try {
      const prevSession = sessions.find(s => s.id === currentSessionId!);
      const lastResponseContent = prevSession && prevSession.messages.length > 0
        ? prevSession.messages[prevSession.messages.length - 1].content
        : '';

      const res = await fetch('/api/assistant/plan-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // pass latestEvents instead of context events
        body: JSON.stringify({
          userInput: inputValue,
          currentEvents: latestEvents,
          mode,
          lastResponse: lastResponseContent,
          user_id: user?.id,
        }),
      });
  
      let assistantText = '';
  
      if (mode === 'parse') {
        // The API returns JSON like { result: "stringified JSON" }
        const json = await res.json();
        // Parse the stringified JSON inside `result`
        const parsedInner = JSON.parse(json.result);
        // Pretty-print JSON for display
        assistantText = JSON.stringify(parsedInner, null, 2);
        tryApplyEventsFromResponse(assistantText);
      } else {
        // For 'plan' mode, just get the plain text response
        const json = await res.json();
        assistantText = json.result;
      }
  
      const assistantMessage: Message = {
        id: nanoid(),
        content: assistantText,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
  
      setSessions(prev => (
        prev.map(s => s.id === currentSessionId! ? { ...s, messages: [...s.messages, assistantMessage] } : s)
      ));
      // persist assistant reply
      insertMessageToDb(currentSessionId!, assistantMessage).catch(err => console.error('Failed to insert assistant message', err));
      // persist session to DB (non-blocking)
      const updated = sessions.find(s => s.id === currentSessionId!);
      upsertChatSession(
        currentSessionId!,
        updated ? updated.messages.length : 0,
        updated ? (updated.messages[updated.messages.length - 1]?.content || null) : null
      ).catch(err => console.error('Failed to upsert session', err));

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to parse event', err);
      setIsLoading(false);
    }
  };
  


  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-300 bg-white">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">Plans</h2>
          <button onClick={createNewSession} className="text-primary font-semibold hover:underline">
            + New
          </button>
        </div>
        <ul className="overflow-y-auto">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between ${
                session.id === currentSessionId ? 'bg-primary/10 font-semibold' : ''
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <span className="truncate w-40">{session.title}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Chatbot Assistant</h1>
          <h2 className="mt-2 font-normal">Welcome to the AI Planning Assistant! I'm here to help you plan your day, week, or month. I can help you create study schedules, set goals, organize tasks, and develop productivity strategies. What would you like to plan today?</h2>
          <h2 className="mt-2 font-normal">(Use edit schedule for events and plan for scheduling advice)</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSessionId && sessions.length > 0
          ? sessions
              .find(s => s.id === currentSessionId)
              ?.messages.map((msg: Message) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-black'
                  }`}>
                    <div>
                      {msg.role === 'assistant' && mode === 'plan' ? (
                        <pre className="whitespace-pre-wrap">{msg.content}</pre>
                      ) : (
                        <pre className="whitespace-pre-wrap m-0 font-normal">{msg.content}</pre>
                      )}
                    </div>

                    {msg.role === 'assistant' && (
                      <button
                        className="mt-2 text-xs text-blue-600 hover:underline"
                        onClick={() => handleFeedbackClick(msg.id)}
                      >
                        Give Feedback
                      </button>
                    )}

                    {feedbackTargetId === msg.id && (
                      <form onSubmit={e => handleFeedbackSubmit(e, msg.id)} className="mt-2">
                        <input
                          type="text"
                          value={feedbackValue}
                          onChange={e => setFeedbackValue(e.target.value)}
                          className="w-full p-1 text-sm border rounded"
                          placeholder="What did the assistant get wrong?"
                        />
                        <button type="submit" className="mt-1 text-xs text-green-600 hover:underline">
                          Submit Feedback
                        </button>
                      </form>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ml-1 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
          : <p className="text-gray-500">No messages yet</p>
        }
      </div>


        {isLoading && <div className="text-sm text-gray-500">Assistant is thinking...</div>}
        <div ref={messagesEndRef} />

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              rows={1}
              placeholder="Ask me to help you plan..."
              className="w-full p-3 border rounded-2xl resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              disabled={isLoading}
            />
                  {/* Mode selector */}
            <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "parse" | "plan")}
                className="absolute right-14 bottom-4 rounded border border-gray-300 bg-white p-1 text-sm"
                disabled={isLoading}
                aria-label="Select mode"
            >
                <option value="parse">Edit Schedule</option>
                <option value="plan">Plan</option>
            </select>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 bottom-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center"
            >
              ➤
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
