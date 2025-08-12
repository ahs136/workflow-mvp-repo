'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DatesSetArg } from '@fullcalendar/core';
import { nanoid } from 'nanoid';
import { generateRecurringEvents } from '@/lib/utils/generateRecurringEvents';
import { Event, useEventContext } from '@/app/context/EventContext';
import { supabase } from '@/lib/utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';


export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.push('/');
      } else {
        setUser(data.session?.user ?? null);
      }
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

  // --- State ---
  const { events, setEvents, clearAllEvents } = useEventContext();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput |null>(null);
  const [calendarHeight, setCalendarHeight] = useState(650);
  const [selectedTag, setSelectedTag]= useState('all');
  const [structuralViewOn, setStructuralViewOn] = useState(false);
  const [parseInput, setParseInput] = useState('');
  const [parsedEvent, setParsedEvent] = useState<EventInput|null>(null);
  const STORAGE_KEY = 'calendarEvents';
  const [formData, setFormData] = useState({
    id:          nanoid(),
    user_id:     user?.id,
    title:       '',
    description: '',
    start:       '',
    end:         '',
    location:    '',
    reminder:    'none' as 'none'|'10m'|'1h'|'1d'|'2d',
    tag:         'deadline' as keyof typeof defaultTagColors,
    color:       defaultTagColors['deadline'],
    isStructural:     false,
    isNonNegotiable:  false,
    repeat:      '' as 'none'|'daily'|'weekdays'|'weekly'|'customDays',
    repeatUntil: '',
    byDay:       [] as string[],
    createdByAI: false,
    isCompleted: false,
    isReviewed: false,
    reviewData: {
      actualDurationMinutes: 0,
      productivityRating: 0,
      userNotes: '',
      feedbackTimestamp: '',
    }
  });

  // --- Effects ---
  useEffect(() => {
    // initial height + notifications
    if (typeof window !== 'undefined') {
      setCalendarHeight(window.innerHeight * 0.7);
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return;
  
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });
  
      if (error) {
        console.error('Error loading events:', error);
        return;
      }
  
      const formattedEvents: EventInput[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        // protect against null end_time
        start: row.start_time ? new Date(row.start_time) : undefined,
        end: row.end_time ? new Date(row.end_time) : undefined,
        backgroundColor: row.color || defaultTagColors[row.tag] || undefined,
        textColor: '#fff',
        extendedProps: {
          // put all DB fields inside extendedProps in camelCase form
          description: row.description ?? '',
          location: row.location ?? '',
          reminder: row.reminder ?? 'none',
          tag: row.tag ?? 'deadline',
          color: row.color ?? defaultTagColors[row.tag ?? 'deadline'],
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
          // include groupId if you stored it in DB (if not, ignore)
          groupId: row.group_id ?? null,
        },
      }));
  
      setEvents(formattedEvents as Event[]);
    }
  
    fetchEvents();
  }, [user]);
  

 useEffect(() => {
    if (parsedEvent) {
      const event = {
        ...parsedEvent,
        id: parsedEvent.id && parsedEvent.id.trim() !== '' ? parsedEvent.id : nanoid(),
        ...parsedEvent.extendedProps,
      };

      console.log('🤖 [Calendar Parsed Event] Received parsedEvent, assigning id:', event.id, event);
      setIsFormOpen(true);

      setFormData({
        id: event.id,
        user_id: user?.id,
        title: event.title || '',
        start: event.start ? toDatetimeLocal(event.start as string) : '',
        end: event.end ? toDatetimeLocal(event.end as string) : '',
        description: event.extendedProps?.description || '',
        location: event.extendedProps?.location || '',
        tag: event.tag || 'deadline',
        color: event.color || defaultTagColors[event.tag || 'deadline'],
        repeat: event.repeat || 'none',
        byDay: Array.isArray(event.byDay) ? event.byDay : [],
        reminder: event.reminder || 'none',
        isStructural: !!event.isStructural,
        isNonNegotiable: !!event.isNonNegotiable,
        repeatUntil: event.repeatUntil || '',
        createdByAI: !!event.createdByAI,
        isCompleted: !!event.isCompleted,
        isReviewed: event.isReviewed || false,
        reviewData: event.reviewData,
        updatedAt: event.updatedAt || null,
      });
      
      setIsFormOpen(true);
      setParsedEvent(null);
      setParseInput('');
    }
  }, [parsedEvent]);

  function normalizeTimestamp(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
  
    if (value instanceof Date) return value.toISOString();
  
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
  
    return null;
  }
  

  async function saveEvent(event: EventInput) {
    console.log('🤖 [Calendar Save Event] Received event:', event);

    if (!user) return;
  
    const ep = event.extendedProps || {};
  
    const row = {
      id: event.id,
      group_id: event.groupId ? event.groupId : null,
      user_id: user.id,
      title: event.title,
      description: ep.description || null,
      start_time: normalizeTimestamp(event.start),
      end_time: normalizeTimestamp(event.end),
      location: ep.location || null,
      reminder: ep.reminder || 'none',
      tag: ep.tag || 'deadline',
      color: ep.color || null,
      is_structural: !!ep.isStructural,
      is_non_negotiable: !!ep.isNonNegotiable,
      repeat: ep.repeat || 'none',
      repeat_until: ep.repeatUntil || null,
      by_day: ep.byDay ?? [],
      created_by_ai: !!ep.createdByAI,
      is_completed: !!ep.isCompleted,
      is_reviewed: !!ep.isReviewed,
      actual_duration_minutes: ep.reviewData?.actualDurationMinutes || 0,
      productivity_rating: ep.reviewData?.productivityRating || 0,
      user_notes: ep.reviewData?.userNotes || null,
      feedback_timestamp: ep.reviewData?.feedbackTimestamp || null,
      created_at: ep.createdAt || new Date().toISOString(),
      updated_at: ep.updatedAt || new Date().toISOString(),
    };
  
    const { error } = await supabase.from('events').upsert([row], { onConflict: 'id' });
  
    if (error) {
      console.error('Error saving event:', error);
    } else {
      console.log('Saved event', row.id);
    }
  }
  
  async function saveEvents(eventList: EventInput[]) {
    console.log('🤖 [Calendar Save Events] Received eventList:', eventList);

    if (!user) return;
  
    const rows = eventList.map((e) => {
      const ep = e.extendedProps || {};
      return {
        id: e.id,
        group_id: e.groupId ? e.groupId : null,
        user_id: user.id,
        title: e.title,
        description: ep.description || null,
        start_time: normalizeTimestamp(e.start),
        end_time: normalizeTimestamp(e.end),
        location: ep.location || null,
        reminder: ep.reminder || 'none',
        tag: ep.tag || 'deadline',
        color: ep.color || null,
        is_structural: !!ep.isStructural,
        is_non_negotiable: !!ep.isNonNegotiable,
        repeat: ep.repeat || 'none',
        repeat_until: normalizeTimestamp(ep.repeatUntil) || null,
        by_day: ep.byDay ?? [],
        created_by_ai: !!ep.createdByAI,
        is_completed: !!ep.isCompleted,
        is_reviewed: !!ep.isReviewed,
        actual_duration_minutes: ep.reviewData?.actualDurationMinutes || 0,
        productivity_rating: ep.reviewData?.productivityRating || 0,
        user_notes: ep.reviewData?.userNotes || null,
        feedback_timestamp: ep.reviewData?.feedbackTimestamp || null,
        created_at: ep.createdAt || new Date().toISOString(),
        updated_at: ep.updatedAt || new Date().toISOString(),
      };
    });
  
    const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id' });
  
    if (error) {
      console.error('Error bulk saving events:', error);
    } else {
      console.log('Bulk saved', rows.length, 'events');
    }
  }
  
  
  function scheduleReminder(evt: EventInput) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const map: Record<string, number> = {
      none: 0,
      '10m': 10*60*1000,
      '1h':  60*60*1000,
      '1d':  24*60*60*1000,
      '2d':  2*24*60*60*1000,
    };
    const before = map[evt.extendedProps?.reminder || 'none'];
    if (!before || !evt.start) return;
    const start = evt.start instanceof Date ? evt.start : new Date(evt.start as string);
    const delay = start.getTime() - before - Date.now();
    if (delay <= 0) return;
    setTimeout(() => {
      new Notification(`Reminder: ${evt.title}`, {
        body: `Starts at ${start.toLocaleString()}`,
      });
    }, delay);
  }

  const formatDateForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // --- Handlers ---
  const resetForm = () => {
    setFormData({
      id:          nanoid(),
      user_id:     user?.id,
      title:       '',
      description: '',
      start:       '',
      end:         '',
      location:    '',
      reminder:    'none',
      tag:         'deadline',
      color:       defaultTagColors['deadline'],
      isStructural:false,
      isNonNegotiable:false,
      repeat: 'none',
      repeatUntil: '',
      byDay: [],
      createdByAI: false,
      isCompleted: false,
      isReviewed: false,
      reviewData: {
        actualDurationMinutes: 0,
        productivityRating: 0,
        userNotes: '',
        feedbackTimestamp: '',
      },
    });
    setSelectedEvent(null);
    setIsFormOpen(false);
    calendarRef.current?.getApi().unselect();
  };

  const handleDateSelect = (info: any) => {
    const id = nanoid();
    const s = info.start;
    const e = info.end || new Date(s.getTime() + 60 * 60 * 1000);
  
    setFormData({
      id,
      user_id: user?.id,
      title: '',
      description: '',
      location: '',
      start: formatDateForInput(s),
      end: formatDateForInput(e),
      reminder: 'none',
      tag: 'deadline',
      color: defaultTagColors['deadline'],
      isStructural: info.extendedProps?.isStructural || false,
      isNonNegotiable: info.extendedProps?.isNonNegotiable || false,
      repeat: info.extendedProps?.repeat || 'none',
      repeatUntil: info.extendedProps?.repeatUntil || '',
      byDay: info.extendedProps?.byDay || [],
      createdByAI: false,
      isCompleted: false,
      isReviewed: false,
      reviewData: {
        actualDurationMinutes: 0,
        productivityRating: 0,
        userNotes: '',
        feedbackTimestamp: '',
      },
    });
  
    console.log('📆 [Date Select] Prepared form for new event:', id, info);
    setIsFormOpen(true);
  };
  
  

  const handleEventClick = (info: any) => {
    const fcEvent = info.event;
  
    const tag = fcEvent.extendedProps?.tag || 'deadline';
    const color = fcEvent.backgroundColor || defaultTagColors[tag];
  
    setSelectedEvent({
      id: fcEvent.id,
      title: fcEvent.title,
      start: fcEvent.start,
      end: fcEvent.end ?? undefined,
      backgroundColor: fcEvent.backgroundColor,
      textColor: fcEvent.textColor,
      extendedProps: { ...fcEvent.extendedProps },
    });
  
    setFormData({
      id:             fcEvent.id || nanoid(),
      user_id:        user?.id,
      title:          fcEvent.title || '',
      description:    fcEvent.extendedProps?.description || '',
      start:          formatDateForInput(new Date(fcEvent.start)),
      end:            fcEvent.end ? formatDateForInput(new Date(fcEvent.end)) : '',
      location:       fcEvent.extendedProps?.location || '',
      reminder:       fcEvent.extendedProps?.reminder || 'none',
      tag:            tag,
      color:          color,
      isStructural:   fcEvent.extendedProps?.isStructural || false,
      isNonNegotiable:fcEvent.extendedProps?.isNonNegotiable || false,
      repeat:         fcEvent.extendedProps?.repeat || 'none',
      repeatUntil:    fcEvent.extendedProps?.repeatUntil || '',
      byDay:          fcEvent.extendedProps?.byDay || [],
      createdByAI:    fcEvent.extendedProps?.createdByAI || false,
      isCompleted:    fcEvent.extendedProps?.isCompleted || false,
      isReviewed: fcEvent.extendedProps?.isReviewed || false,
      reviewData: fcEvent.extendedProps?.reviewData || {
        actualDurationMinutes: 0,
        productivityRating: 0,
        userNotes: '',
        feedbackTimestamp: '',
      },
    });
  
    setIsFormOpen(true);
  };
  
  

  const handleEventDrop = async (info: any) => {
    const updated: EventInput = {
      id:             info.event.id,
      title:          info.event.title,
      start:          info.event.start,
      end:            info.event.end,
      backgroundColor:info.event.backgroundColor,
      color:          info.event.textColor || '#fff',
      extendedProps:  { ...info.event.extendedProps },
    };
    const updatedList = events.map((e) => (e.id === updated.id ? updated : e));
    setEvents(updatedList as Event[]);
    await saveEvent(updated);
    scheduleReminder(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start) {
      alert('Title and start are required');
      return;
    }
  
    const bgColor = defaultTagColors[formData.tag] || '#3b82f6';
  
    // Use selectedEvent.id if editing, otherwise generate a new one
    const baseId = selectedEvent?.groupId ? selectedEvent.groupId : selectedEvent?.id ?? nanoid();
  
    // Base event with group_id = baseId (important!)
    const base: EventInput = {
      id: baseId,
      user_id: user?.id,
      title: formData.title,
      start: new Date(formData.start),
      end: formData.end ? new Date(formData.end) : undefined,
      backgroundColor: bgColor,
      color: '#fff',
      extendedProps: {
        description: formData.description,
        location: formData.location,
        reminder: formData.reminder,
        tag: formData.tag,
        color: bgColor,
        isStructural: formData.isStructural,
        isNonNegotiable: formData.isNonNegotiable,
        isCompleted: formData.isCompleted,
        isReviewed: formData.isReviewed,
        reviewData: formData.reviewData,
      },
      repeat: formData.repeat,
      repeatUntil: normalizeTimestamp(formData.repeatUntil),
      byDay: formData.byDay,
    } as any;
  
    console.log('📝 [Form Submit] Created event with id:', baseId, base);
  
    if (!selectedEvent || !selectedEvent.groupId?.trim()) {
      // Editing or creating the base event => remove old base + recurrences, regenerate
  
      // Remove previous base and recurrences from events list
      const cleanedEvents = events.filter(
        (e) => e.id !== baseId && e.groupId !== baseId
      );
  
      // Generate recurrences — these already have group_id = baseId
      const recurrences = generateRecurringEvents(base).map((r) => ({
        ...r,
        group_id: baseId,
      }));
  
      // Recurrences already have group_id, but to be safe:
      const recurrencesWithProps = recurrences.map((e) => ({
        ...e,
        groupId: baseId, 
        backgroundColor: base.backgroundColor,
        color: base.color,
        extendedProps: {
          ...e.extendedProps,
          tag: base.extendedProps?.tag,
          reminder: base.extendedProps?.reminder,
          isStructural: base.extendedProps?.isStructural,
          isNonNegotiable: base.extendedProps?.isNonNegotiable,
          isCompleted: base.extendedProps?.isCompleted,
          isReviewed: base.extendedProps?.isReviewed,
          reviewData: base.extendedProps?.reviewData,
          createdByAI: base.extendedProps?.createdByAI,
          createdAt: base.extendedProps?.createdAt,
          updatedAt: base.extendedProps?.updatedAt,
        },
      }));
    
      // Put base event first, then recurrences
      const updatedEvents = [...cleanedEvents, base, ...recurrencesWithProps];
    
      setEvents(updatedEvents as Event[]);
      saveEvents(updatedEvents as EventInput[]);
      [base, ...recurrencesWithProps].forEach(scheduleReminder);
    } else {
      // Editing a single recurrence => update only that event
      const updatedEvents = events.map((e) =>
        e.id === selectedEvent.id
          ? {
              ...e,
              user_id: user?.id,
              title: formData.title,
              start: new Date(formData.start),
              end: formData.end ? new Date(formData.end) : undefined,
              extendedProps: {
                ...e.extendedProps,
                description: formData.description,
                location: formData.location,
                reminder: formData.reminder,
                tag: formData.tag,
                color: bgColor,
                isStructural: formData.isStructural,
                isNonNegotiable: formData.isNonNegotiable,
                isCompleted: formData.isCompleted,
                isReviewed: formData.isReviewed,
                reviewData: formData.reviewData,
              },
              repeat: formData.repeat,
              repeatUntil: normalizeTimestamp(formData.repeatUntil),
              byDay: formData.byDay,
              group_id: e.groupId || baseId,  // ensure group_id stays intact or fallback
            }
          : e
      );
      setEvents(updatedEvents as Event[]);
      saveEvents(updatedEvents as EventInput[]);
      const updatedEvent = updatedEvents.find((e) => e.id === selectedEvent.id);
      if (updatedEvent) scheduleReminder(updatedEvent);
    }
  
    resetForm();
  };
  
  
  async function deleteEventFromSupabase(groupId: string) {
    if (!user) return;
  
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);
  
    if (error) {
      console.error('Error deleting events by group_id:', error);
      throw error;
    }
  }
  
  async function deleteEventById(id: string) {
    if (!user) return;
  
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  
    if (error) {
      console.error('Error deleting event by id:', error);
      throw error;
    }
  }
  
  const handleDelete = async () => {
    if (!selectedEvent || !user) return;
  
    try {
      if (!selectedEvent.groupId || selectedEvent.groupId.trim() === '') {
        // Base event: delete base + recurrences
        const filtered = events.filter(
          (e) => e.id !== selectedEvent.id && e.groupId !== selectedEvent.id
        );
        setEvents(filtered as Event[]);
        saveEvents(filtered as EventInput[]);
  
        // Delete base event and all recurrences
        await supabase.from('events').delete().or(`id.eq.${selectedEvent.id},group_id.eq.${selectedEvent.id}`).eq('user_id', user.id)

      } else {
        // Recurrence: delete only itself
        const filtered = events.filter((e) => e.id !== selectedEvent.id);
        setEvents(filtered as Event[]);
        saveEvents(filtered as EventInput[]);
  
        await deleteEventById(selectedEvent.id);
      }
  
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error deleting event(s):', error);
      // Optionally show UI error feedback here
    }
  };
  

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
  };
  // Render event content on calendar
  function renderEventContent(eventInfo: any) {
    const { event } = eventInfo;
    const isCreatedByAI = event.extendedProps?.createdByAI || false;
    const description = event.description || '';
    const title = event.title || '';
    const tag = event.tag || 'deadline';
    const bgColor = event.backgroundColor || defaultTagColors[tag];
    const textColor = event.textColor || '#fff';

    const formatTime = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const startTimeStr = formatTime(event.start);
    const endTimeStr = formatTime(event.end);
    const timeRange = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;



    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: textColor,
          padding: '4px 6px',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {startTimeStr && <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{timeRange}</div>}
          <div
            className="tag-box"
            style={{
              fontSize: '0.55rem',
              fontWeight: 500,
              backgroundColor: '#ffffff50',
              padding: '0 4px',
              borderRadius: '4px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {event.extendedProps?.tag}
          </div>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{title} {isCreatedByAI && <span title="AI-created" className="text-xs text-gray-500">🤖</span>}</div>
        {description && (
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={description}
          >
            {description}
          </div>
        )}
      </div>
    );
  }

  // Filter events for display based on tag and structural toggle
  const filteredEvents = structuralViewOn
    ? events.filter((ev: EventInput) => ev.extendedProps?.isStructural)
    : selectedTag === 'all'
    ? events
    : events.filter((ev: EventInput) => ev.extendedProps?.tag === selectedTag);

    const visibleEvents = filteredEvents.filter(
      (e) => !(e.extendedProps?.isCompleted && e.extendedProps?.isReviewed)
    );
    

  // Parse natural language event input (calls your API)
  const handleParseEvent = async () => {
    if (!parseInput.trim()) {
      resetForm();
      setIsFormOpen(true);
      return;
    }
  
    try {
      const res = await fetch('/api/assistant/parse-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: parseInput }),
      });
  
      const { result } = await res.json();
  
      if (!result || !result.title || !result.start) {
        console.error('Invalid event from AI');
        alert('Invalid event from AI, please try again');
        return;
      }
  
      // ✅ Let the useEffect handle opening and filling
      setParsedEvent(result);
  
    } catch (err) {
      console.error('Failed to parse event', err);
    }
  };
  

  function toDatetimeLocal(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  }
  
  

  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-lg h-[750px] flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4">
            <label className="font-medium">Filter:</label>
            <select
              disabled={structuralViewOn}
              className="border border-gray-300 rounded p-2"
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
            >
              <option value="all">All</option>
              {Object.keys(defaultTagColors).map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="pl-[10px]">
            <label className="flex items-center gap-3 cursor-pointer select-none font-medium text-gray-700">
              <span className="text-sm">Structured View</span>

              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0"
                  checked={structuralViewOn}
                  onChange={() => setStructuralViewOn(prev => !prev)}
                />
                <span
                  className={`slider absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${
                    structuralViewOn ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                ></span>
                <span
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${
                    structuralViewOn ? 'translate-x-6' : ''
                  }`}
                ></span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={parseInput}
            onChange={e => setParseInput(e.target.value)}
            placeholder="Type your event naturally, e.g. 'Lunch with Alex at 1pm tomorrow'"
            className="flex-1 border rounded p-2 w-[500px]"
          />
          <button
            onClick={handleParseEvent}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Event
          </button>
          <button
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            onClick={() => clearAllEvents()}
          >
            Clear All Events
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          height={650}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          editable={true}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          events={visibleEvents}
          ref={calendarRef}
          datesSet={handleDatesSet}
          views={{
            timeGridWeek: { minTime: '08:00:00', maxTime: '20:00:00', allDaySlot: false },
            timeGridDay: { minTime: '06:00:00', maxTime: '22:00:00', allDaySlot: false },
          }}
          eventContent={renderEventContent}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }}
        />
      </div>

{/* Event Form Modal */}
{isFormOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    onClick={resetForm} 
  >
    <form
      className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-lg grid grid-cols-2 gap-6"
      onClick={e => e.stopPropagation()}
      onSubmit={handleFormSubmit}
    >
      <h2 className="text-xl font-semibold mb-4 col-span-2">{selectedEvent ? 'Edit Event' : 'New Event'}</h2>

      {/* Left column */}
      <div className="flex flex-col gap-4">
        <label className="block font-medium">
          Title *
          <input
            required
            type="text"
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </label>

        <label className="block font-medium">
          Description
          <textarea
            rows={4}
            className="border border-gray-300 rounded w-full p-2 mt-1 resize-none"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </label>

        <label className="block font-medium">
          Location
          <input
            type="text"
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
          />
        </label>

        <label className="block font-medium">
          Tag
          <select
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.tag}
            onChange={e => {
              setFormData({ ...formData, tag: e.target.value, color: defaultTagColors[e.target.value] });
            }}
          >
            {Object.keys(defaultTagColors).map(tag => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-medium">
          Reminder
          <select
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.reminder}
            onChange={e => setFormData({ ...formData, reminder: e.target.value as 'none' | '10m' | '1h' | '1d' | '2d' })}
          >
            <option value="none">No reminder</option>
            <option value="10m">10 minutes before</option>
            <option value="1h">1 hour before</option>
            <option value="1d">1 day before</option>
            <option value="2d">2 days before</option>
          </select>
        </label>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-4">
        <label className="block font-medium">
          Start *
          <input
            required
            type="datetime-local"
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.start}
            onChange={e => setFormData({ ...formData, start: e.target.value })}
          />
        </label>

        <label className="block font-medium">
          End
          <input
            type="datetime-local"
            className="border border-gray-300 rounded w-full p-2 mt-1"
            value={formData.end}
            onChange={e => setFormData({ ...formData, end: e.target.value })}
          />
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={formData.isStructural}
            onChange={e => setFormData({ ...formData, isStructural: e.target.checked })}
          />
          Structural Event
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={formData.isNonNegotiable}
            onChange={e => setFormData({ ...formData, isNonNegotiable: e.target.checked })}
          />
          Non-Negotiable
        </label>

        <label className="block mb-2 font-medium">Repeat</label>
        <select value={formData.repeat} onChange={(e) => setFormData({ ...formData, 
          repeat: e.target.value as 'none' | 'daily' | 'weekdays' | 'weekly' | 'customDays',
          byDay: e.target.value === 'weekly' ? formData.byDay : []
        })}>
          <option value="">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="weekdays">Weekdays</option>
        </select>

        {/* If weekly-specific, show day checkboxes */}
        {formData.repeat === "weekly" && (
          <div className="flex flex-wrap gap-2 mt-2">
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
              <label key={day} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  value={day}
                  checked={formData.byDay.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, byDay: [...formData.byDay, day] });
                    } else {
                      setFormData({ ...formData, byDay: formData.byDay.filter((d) => d !== day) });
                    }
                  }}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        )}
          <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={formData.isCompleted}
            onChange={e => setFormData({ ...formData, isCompleted: !formData.isCompleted })}
          />
          Completed
        </label>

        {/* Always allow a Repeat‑Until date if any repeat */}
        {formData.repeat !== 'none' && (
          <label className="block mb-3 font-medium">
            Repeat Until
            <input
              type="date"
              className="border p-2 rounded w-full mt-1"
              value={formData.repeatUntil}
              onChange={e => setFormData({ ...formData, repeatUntil: e.target.value })}
              min={formData.start?.split('T')[0]}
            />
          </label>
        )}


        <div className="flex justify-between mt-auto">
          {selectedEvent && (
            <button
              type="button"
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              onClick={() => {
                handleDelete();
                resetForm();
              }}
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              onClick={resetForm}
            >
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    </form>
    </div>
  )}
</div>
  );
}
