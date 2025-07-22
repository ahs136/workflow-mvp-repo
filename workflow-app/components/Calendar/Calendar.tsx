'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DatesSetArg } from '@fullcalendar/core';
import { nanoid } from 'nanoid';

export default function Calendar() {


  const calendarRef = useRef<FullCalendar>(null);

  const defaultTagColors: Record<string, string> = {
    deadline: '#dc2626',  // red
    meeting: '#8b5cf6',   // purple
    class: '#1d4ed8',     // blue
    focus: '#ede8d0',     // beige
    workout: '#03c04a',   // green
    social: '#ff8da1',    // pink
    personal: '#6b7280',  // gray
  };

  const [events, setEvents] = useState<EventInput[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [calendarHeight, setCalendarHeight] = useState(650);
  const [selectedTag, setSelectedTag] = useState('all');
  const [structuralViewOn, setStructuralViewOn] = useState(false);
  const [parseInput, setParseInput] = useState('');

  const [formData, setFormData] = useState({
    id: nanoid(),
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    reminder: 'none',
    tag: 'deadline',
    color: defaultTagColors['deadline'],
    isStructural: false,
    isNonNegotiable: false, /* EDIT IN DEVTOOLS: let events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    events.forEach(e => {
      if(e.title === 'My Event Name') {
        e.extendedProps = e.extendedProps || {};
        e.extendedProps.isNonNegotiable = !e.extendedProps.isNonNegotiable;
      }
    });
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    */
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCalendarHeight(window.innerHeight * 0.7);
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('calendarEvents');
    if (stored) {
      const parsedEvents = JSON.parse(stored).map((event: any) => {
        const tagColor = defaultTagColors[event.extendedProps?.tag] || '#3b82f6';
  
        // If old events don’t have `id`, generate one now
        const eventWithId = {
          id: event.id || nanoid(),
          ...event,
          start: new Date(event.start),
          end: event.end ? new Date(event.end) : undefined,
          backgroundColor: event.backgroundColor || tagColor,
          color: '#fff',
        };
  
        return eventWithId;
      });
  
      // Save updated events (with IDs) back to localStorage
      localStorage.setItem('calendarEvents', JSON.stringify(parsedEvents));
      setEvents(parsedEvents);
    }
  }, []);

  function scheduleReminder(event: EventInput) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const reminderMap: Record<string, number> = {
      none: 0,
      '10m': 10 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '2d': 2 * 24 * 60 * 60 * 1000,

      // GPT-style keys:
      '10 minutes before': 10 * 60 * 1000,
      '1 hour before': 60 * 60 * 1000,
      '1 day before': 24 * 60 * 60 * 1000,
      '2 days before': 2 * 24 * 60 * 60 * 1000,
    };

    const reminderBefore = reminderMap[event.extendedProps?.reminder || 'none'];
    if (!reminderBefore || !event.start) return;

    const startDate = event.start instanceof Date ? event.start : new Date(event.start as string);
    const notifyTime = startDate.getTime() - reminderBefore;
    const delay = notifyTime - Date.now();

    if (delay <= 0) return;

    setTimeout(() => {
      new Notification(`Reminder: ${event.title}`, {
        body: `Starts at ${startDate.toLocaleString()}`,
      });
    }, delay);
  }

  const formatDateForInput = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const resetForm = () => {
    setFormData({
      id: nanoid(),
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      reminder: 'none',
      tag: 'deadline',
      color: defaultTagColors['deadline'],
      isStructural: false,
      isNonNegotiable: false,
    });
    setSelectedEvent(null);
    setIsFormOpen(false);
    calendarRef.current?.getApi().unselect();
  };

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start;
    const end = selectInfo.end || new Date(start.getTime() + 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      start: formatDateForInput(start),
      end: formatDateForInput(end),
    }));
    setIsFormOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (!event) return;
    setSelectedEvent(event);
    setFormData({
      id: event.id || nanoid(),
      title: event.title as string,
      description: event.extendedProps?.description || '',
      start: typeof event.start === 'string' ? event.start : formatDateForInput(new Date(event.start as any)),
      end: event.end
        ? typeof event.end === 'string'
          ? event.end
          : formatDateForInput(new Date(event.end as any))
        : '',
      location: event.extendedProps?.location || '',
      reminder: event.extendedProps?.reminder || 'none',
      tag: event.extendedProps?.tag || 'deadline',
      color: event.backgroundColor || defaultTagColors[event.extendedProps?.tag] || '#3b82f6',
      isStructural: event.extendedProps?.isStructural || false,
      isNonNegotiable: event.extendedProps?.isNonNegotiable || false,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.title || !formData.start) {
      alert('Title and start time are required');
      return;
    }

    // If user changed tag but not color, sync color to tag color
    const tagColor = defaultTagColors[formData.tag];
    const eventColor = formData.color === defaultTagColors[selectedEvent?.extendedProps?.tag || ''] ? tagColor : formData.color;

    const newEvent: EventInput = {
      id: nanoid(),
      title: formData.title,
      start: new Date(formData.start),
      end: formData.end ? new Date(formData.end) : undefined,
      backgroundColor: eventColor,
      color: '#fff',
      extendedProps: {
        description: formData.description,
        location: formData.location,
        reminder: formData.reminder,
        tag: formData.tag,
        color: eventColor,
        isStructural: formData.isStructural,
        isNonNegotiable: formData.isNonNegotiable,
      },
    };

    setEvents(prev => {
      const filtered = selectedEvent ? prev.filter(ev => ev.id !== selectedEvent.id) : prev;
      const updated = [...filtered, newEvent];
      saveEventsToLocalStorage(updated);
      return updated;
    });

    scheduleReminder(newEvent);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    const updated = events.filter(event => event.id !== selectedEvent.id);
    setEvents(updated);
    saveEventsToLocalStorage(updated);
    resetForm();
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
  };

  const handleEventDrop = (info: any) => {
    const updatedEvent: EventInput = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      backgroundColor: info.event.backgroundColor,
      color: info.event.textColor || '#fff',
      extendedProps: {
        ...info.event.extendedProps,
      },
    };

    const updatedEvents = events.map(ev => (ev.id === info.event.id ? updatedEvent : ev));
    setEvents(updatedEvents);
    saveEventsToLocalStorage(updatedEvents);
    scheduleReminder(updatedEvent);
  };

  function saveEventsToLocalStorage(events: EventInput[]) {
    const cleaned = events.map(ev => ({
      ...ev,
      start: ev.start instanceof Date ? ev.start.toISOString() : ev.start,
      end: ev.end instanceof Date ? ev.end.toISOString() : ev.end,
    }));
    localStorage.setItem('calendarEvents', JSON.stringify(cleaned));
  }

  // JSON Parsing Function
  async function handleParseEvent() {
    if (!parseInput.trim()) {

      setFormData({
        id: nanoid(),
        title: '',
        description: '',
        start: '',
        end: '',
        location: '',
        reminder: 'none',
        tag: 'deadline',
        color: defaultTagColors['deadline'],
        isStructural: false,
        isNonNegotiable: false,
      });
      setSelectedEvent(null);
      setIsFormOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/assistant/parse-events', {
        method: 'POST',
        body: JSON.stringify({ userInput: parseInput }),
      });
  
      const { result } = await res.json();

      setFormData({
        id: nanoid(),
        title: result.title,
        description: result.description || '',
        start: result.start.slice(0, 16),
        end: result.end.slice(0, 16),
        location: result.location || '',
        reminder: result.reminder || 'none',
        tag: result.tag.toLowerCase(),
        color: defaultTagColors[result.tag.toLowerCase()] || '#3b82f6',
        isStructural: result.isStructural || false,
        isNonNegotiable: result.isNonNegotiable || false,
      });
  
      setSelectedEvent(null);
      setIsFormOpen(true);
      setParseInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to parse event. Please try again.');
    }
  }
  

  // Calendar rendering
  function renderEventContent(eventInfo: any) {
    const { event } = eventInfo;
    const description = event.extendedProps.description || '';
    const title = event.title || '';
    const tag = event.extendedProps.tag || 'general';
    const bgColor = event.backgroundColor || '#3b82f6';
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
            {tag}
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

  const filteredEvents = structuralViewOn
  ? events.filter(ev => ev.extendedProps?.isStructural)
  : selectedTag === 'all'
    ? events
    : events.filter(ev => ev.extendedProps?.tag === selectedTag);






  //DOM RENDERING STARTS HERE
  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-lg h-[750px] flex flex-col">
      {/* Top toolbar */}
      <div className="flex justify-between items-center mb-4">
        {/* Left side: Filter dropdown + toggle */}
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

          {/* Add 10px padding between dropdown and toggle */}
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

        {/* Right side: Both buttons */}
        <div className="flex items-center gap-2"> 
          {/* Quick‐parse bar */}
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
              localStorage.removeItem("calendarEvents");
              window.location.reload();
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
            timeGridDay: { minTime: '08:00:00', maxTime: '20:00:00', allDaySlot: false },
          }}
          eventContent={renderEventContent}
        />
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
            <form id="event-form" onSubmit={handleFormSubmit} className="flex gap-6 flex-col">
              <div className="flex space-x-6">
                {/* Left column */}
                <div className="flex-1 space-y-4">
                  {[
                    { label: 'Event Name *', key: 'title', required: true, type: 'text' },
                    { label: 'Event Description', key: 'description', type: 'text' },
                    { label: 'Start Time *', key: 'start', required: true, type: 'datetime-local' },
                    { label: 'End Time (optional)', key: 'end', type: 'datetime-local' },
                  ].map(({ label, key, required, type }) => (
                    <div key={key}>
                      <label className="block mb-1 font-medium">{label}</label>
                      <input
                        type={type || 'text'}
                        className="w-full border border-gray-300 rounded p-2"
                        value={formData[key as keyof typeof formData] as string}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        required={required}
                      />
                    </div>
                  ))}
                </div>

                {/* Right column */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Location</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded p-2"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Reminder</label>
                    <select
                      className="w-full border border-gray-300 rounded p-2"
                      value={formData.reminder}
                      onChange={e => setFormData({ ...formData, reminder: e.target.value })}
                    >
                      {['none', '10m', '1h', '1d', '2d'].map(val => (
                        <option key={val} value={val}>
                          {val === 'none'
                            ? 'None'
                            : `${val.replace('m', ' minutes').replace('h', ' hour').replace('d', ' day')} before`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Tag</label>
                    <select
                      className="w-full border border-gray-300 rounded p-2"
                      value={formData.tag}
                      onChange={e => {
                        const newTag = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          tag: newTag,
                          color: defaultTagColors[newTag], // always sync color with tag change
                        }));
                      }}
                    >
                      {Object.keys(defaultTagColors).map(tag => (
                        <option key={tag} value={tag}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Color</label>
                    <input
                      type="color"
                      className="w-full border border-gray-300 rounded p-2 h-10"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isStructural}
                      onChange={e => setFormData(prev => ({ ...prev, isStructural: e.target.checked }))}
                    />
                    <label className="font-medium">This is a structural event</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isNonNegotiable}
                      onChange={e => setFormData(prev => ({ ...prev, isNonNegotiable: e.target.checked }))}
                    />
                    <label className="font-medium">This is a non-negotiable event</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                {selectedEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
