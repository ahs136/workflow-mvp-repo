'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DatesSetArg } from '@fullcalendar/core';

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarHeight, setCalendarHeight] = useState(650); // default height
  const [selectedTag, setSelectedTag] = useState('all'); // tag filtering


  const defaultTagColors: Record<string, string> = {
    general: '#3b82f6', // blue
    focus: '#f5deb3',   // beige
    meeting: '#ef4444', // red
    workout: '#10b981', // green
    personal: '#8b5cf6', // purple
  };  

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    reminder: 'none',
    tag: 'general',
    color: '#3b82f6',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCalendarHeight(window.innerHeight * 0.7);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('calendarEvents');
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const formatDateForInput = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      reminder: 'none',
      tag: 'general',
      color: '#3b82f6',
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
      title: event.title as string,
      description: event.extendedProps?.description || '',
      start:
        typeof event.start === 'string' ? event.start : formatDateForInput(new Date(event.start as any)),
      end:
        event.end
          ? typeof event.end === 'string'
            ? event.end
            : formatDateForInput(new Date(event.end as any))
          : '',
      location: event.extendedProps?.location || '',
      reminder: event.extendedProps?.reminder || 'none',
      tag: event.extendedProps?.tag || 'general',
      color: event.extendedProps?.color || '#3b82f6',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.title || !formData.start) {
      alert('Title and start time are required');
      return;
    }

    const newEvent: EventInput = {
      id: selectedEvent?.id || String(Date.now()),
      title: formData.title,
      start: new Date(formData.start),
      end: formData.end ? new Date(formData.end) : undefined,
      backgroundColor: formData.color,
      color: '#fff',
      extendedProps: {
        description: formData.description,
        location: formData.location,
        reminder: formData.reminder,
        tag: formData.tag,
        color: formData.color,
      },
    };

    setEvents(prev => {
      const filtered = selectedEvent ? prev.filter(ev => ev.id !== selectedEvent.id) : prev;
      return [...filtered, newEvent];
    });

    resetForm();
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    setEvents(events.filter(event => event.id !== selectedEvent.id));
    resetForm();
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
  };

  // Custom event rendering showing time, title, description
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
          {startTimeStr && (
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{timeRange}</div>
          )}
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              backgroundColor: '#ffffff50',
              padding: '0 6px',
              borderRadius: '6px',
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
  

  //  DOM Rendering
  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-lg h-[750px] flex flex-col">
      {/* Top toolbar: Tag filter + Add Event */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <label className="font-medium">Filter by Tag:</label>
          <select
            className="border border-gray-300 rounded p-2"
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
          >
            <option value="all">All</option>
            {['general', 'focus', 'meeting', 'workout', 'personal'].map(tag => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
        </div>
  
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
        >
          Add Event
        </button>
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
          eventClick={handleEventClick}
          events={selectedTag === 'all' ? events : events.filter(ev => ev.extendedProps?.tag === selectedTag)}
          ref={calendarRef}
          datesSet={handleDatesSet}
          height={calendarHeight}
          views={{
            timeGridWeek: {
              minTime: '08:00:00',
              maxTime: '20:00:00',
              allDaySlot: false,
            },
            timeGridDay: {
              minTime: '08:00:00',
              maxTime: '20:00:00',
              allDaySlot: false,
            },
          }}
          eventContent={renderEventContent}
        />
      </div>
  
      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
            <form id="event-form" onSubmit={handleFormSubmit} className="flex gap-6">
              {/* Left Column */}
              <div className="flex-1 space-y-4">
                {[
                  { label: 'Event Name *', value: formData.title, key: 'title', required: true },
                  { label: 'Event Description', value: formData.description, key: 'description' },
                  { label: 'Start Time *', value: formData.start, key: 'start', type: 'datetime-local', required: true },
                  { label: 'End Time (optional)', value: formData.end, key: 'end', type: 'datetime-local' },
                ].map(({ label, value, key, required, type }) => (
                  <div key={key}>
                    <label className="block mb-1 font-medium">{label}</label>
                    <input
                      type={type || 'text'}
                      className="w-full border border-gray-300 rounded p-2"
                      value={value}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      required={required}
                    />
                  </div>
                ))}
              </div>
  
              {/* Right Column */}
              <div className="flex-1 space-y-4">
                {/* Location */}
                <div>
                  <label className="block mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
  
                {/* Reminder */}
                <div>
                  <label className="block mb-1 font-medium">Reminder</label>
                  <select
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.reminder}
                    onChange={e => setFormData({ ...formData, reminder: e.target.value })}
                  >
                    {['none', '10m', '1h', '1d', '2d'].map(val => (
                      <option key={val} value={val}>
                        {val === 'none' ? 'None' : `${val.replace('m', ' minutes').replace('h', ' hour').replace('d', ' day')} before`}
                      </option>
                    ))}
                  </select>
                </div>
  
                {/* Tag */}
                <div>
                  <label className="block mb-1 font-medium">Tag</label>
                  <select
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.tag}
                    onChange={e => {
                      const newTag = e.target.value;
                      const defaultColor = defaultTagColors[newTag];
                      setFormData(prev => ({
                        ...prev,
                        tag: newTag,
                        color: prev.color === defaultTagColors[prev.tag] ? defaultColor : prev.color,
                      }));
                    }}
                  >
                    {['general', 'focus', 'meeting', 'workout', 'personal'].map(tag => (
                      <option key={tag} value={tag}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
  
                {/* Color */}
                <div>
                  <label className="block mb-1 font-medium">Color</label>
                  <input
                    type="color"
                    className="w-full border border-gray-300 rounded p-2 h-10"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
            </form>
  
            {/* Modal Buttons */}
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
                  form="event-form"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );  
}