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

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);

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
  const { events, setEvents } = useEventContext();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput|null>(null);
  const [calendarHeight, setCalendarHeight] = useState(650);
  const [selectedTag, setSelectedTag]= useState('all');
  const [structuralViewOn, setStructuralViewOn] = useState(false);
  const [parseInput, setParseInput] = useState('');
  const [parsedEvent, setParsedEvent] = useState<EventInput|null>(null);
  const [formData, setFormData] = useState({
    id:          nanoid(),
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
    if (parsedEvent) {
      setIsFormOpen(true);

      setFormData({
        id: nanoid(),
        title: parsedEvent.title || '',
        start: parsedEvent.start ? toDatetimeLocal(parsedEvent.start as string) : '',
        end: parsedEvent.end ? toDatetimeLocal(parsedEvent.end as string) : '',
        // @ts-ignore
        description: parsedEvent.description || '',
        location: parsedEvent.location || '',
        tag: parsedEvent.tag || '',
        color: parsedEvent.color || '#000000',
        repeat: parsedEvent.repeat || 'none',
        byDay: parsedEvent.byDay || [],
        reminder: parsedEvent.reminder || 'none',
        isStructural: parsedEvent.isStructural || false,
        isNonNegotiable: parsedEvent.isNonNegotiable || false,
        repeatUntil: parsedEvent.repeatUntil || '',
      });
      setIsFormOpen(true);
      setParsedEvent(null);
      setParseInput('');
    }
  }, [parsedEvent]);

  // --- Helpers ---
  function saveEventsToLocalStorage(evts: EventInput[]) {
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify(
        evts.map((e) => ({
          ...e,
          start: e.start instanceof Date ? e.start.toISOString() : e.start,
          end:   e.end   instanceof Date ? e.end.toISOString()   : e.end,
        }))
      )
    );
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
    });
    setSelectedEvent(null);
    setIsFormOpen(false);
    calendarRef.current?.getApi().unselect();
  };

  const handleDateSelect = (info: any) => {
    const s = info.start;
    const e = info.end || new Date(s.getTime() + 60*60*1000);
    setFormData((f) => ({
      ...f,
      start: formatDateForInput(s),
      end:   formatDateForInput(e),
    }));
    setIsFormOpen(true);
  };

  const handleEventClick = (info: any) => {
    const ev = events.find((e) => e.id === info.event.id);
    if (!ev) return;
  
    const tag = ev.extendedProps?.tag || 'deadline';
    const color = ev.backgroundColor || defaultTagColors[tag];
  
    setSelectedEvent(ev);
    setFormData({
      id:             ev.id || nanoid(),
      title:          ev.title as string,
      description:    ev.extendedProps?.description || '',
      start:          typeof ev.start === 'string' ? ev.start : formatDateForInput(new Date(ev.start)),
      end:            ev.end ? (typeof ev.end === 'string' ? ev.end : formatDateForInput(new Date(ev.end))) : '',
      location:       ev.extendedProps?.location || '',
      reminder:       ev.extendedProps?.reminder || 'none',
      tag:            tag,
      color:          color,
      isStructural:   ev.extendedProps?.isStructural || false,
      isNonNegotiable:ev.extendedProps?.isNonNegotiable || false,
      repeat:         ev.repeat || 'none',
      repeatUntil:    ev.repeatUntil || '',
      byDay:          ev.byDay || [],
    });
  
    setIsFormOpen(true);
  };
  

  const handleEventDrop = (info: any) => {
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
    saveEventsToLocalStorage(updatedList as EventInput[]);
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
    const baseId = selectedEvent?.id ?? nanoid();
  
    const base: EventInput = {
      id: baseId,
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
      },
      repeat: formData.repeat,
      repeatUntil: formData.repeatUntil,
      byDay: formData.byDay,
    } as any;
  
      // Remove old base + recurrences by filtering events out
  const cleanedEvents = events.filter(
    (e) => e.id !== baseId && e.groupId !== baseId
  );

    // Generate recurrences
    const recurrences = generateRecurringEvents(base as any);

  // Assign groupId to recurrences so they belong to base
  const recurrencesWithGroupId = recurrences.map((e) => ({
    ...e,
    groupId: baseId,
  }));
  
  const updatedEvents = [...cleanedEvents, base, ...recurrencesWithGroupId];

  setEvents(updatedEvents as Event[]);
  saveEventsToLocalStorage(updatedEvents as EventInput[]);
  [base, ...recurrencesWithGroupId].forEach(scheduleReminder);

  resetForm();
};
  

  const handleDelete = () => {
    if (!selectedEvent) return;
    const filtered = events.filter((e) => e.id !== selectedEvent.id);
    setEvents(filtered as Event[]);
    saveEventsToLocalStorage(filtered as EventInput[]);
    resetForm();
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
  };
  // Render event content on calendar
  function renderEventContent(eventInfo: any) {
    const { event } = eventInfo;
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
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</div>
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
    ? events.filter(ev => ev.extendedProps?.isStructural)
    : selectedTag === 'all'
    ? events
    : events.filter(ev => ev.extendedProps?.tag === selectedTag);

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
            onClick={() => {
              localStorage.removeItem('calendarEvents');
              setEvents([] as Event[]);
            }}
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
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          editable={true}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          events={filteredEvents}
          ref={calendarRef}
          datesSet={handleDatesSet}
          height={calendarHeight}
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
              onClick={handleDelete}
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
