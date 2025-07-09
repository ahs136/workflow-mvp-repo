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

  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    reminder: 'none',
    tag: 'general',
    color: '#3b82f6',
  });

  useEffect(() => {
    const stored = localStorage.getItem('calendarEvents');
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const formatDateForInput = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
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
      start: typeof event.start === 'string' ? event.start : formatDateForInput(new Date(event.start as any)),
      end: event.end ? (typeof event.end === 'string' ? event.end : formatDateForInput(new Date(event.end as any))) : '',
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
      extendedProps: {
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

  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-lg min-h-screen">
      {/* Add Event Button */}
      <div className="flex justify-end mb-4">
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

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {[
                { label: 'Event Name *', value: formData.title, key: 'title', required: true },
                { label: 'Start Time *', value: formData.start, key: 'start', type: 'datetime-local', required: true },
                { label: 'End Time (optional)', value: formData.end, key: 'end', type: 'datetime-local' },
                { label: 'Location', value: formData.location, key: 'location' },
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
              {/* Select Fields */}
              <div>
                <label className="block mb-1 font-medium">Reminder</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={formData.reminder}
                  onChange={e => setFormData({ ...formData, reminder: e.target.value })}
                >
                  {['none', '10m', '1h', '1d', '2d'].map(val => (
                    <option key={val} value={val}>{val === 'none' ? 'None' : `${val.replace('m', ' minutes').replace('h', ' hour').replace('d', ' day')} before`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Tag</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={formData.tag}
                  onChange={e => setFormData({ ...formData, tag: e.target.value })}
                >
                  {['general', 'focus', 'meeting', 'workout', 'personal'].map(tag => (
                    <option key={tag} value={tag}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</option>
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
              {/* Buttons */}
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

      {/* Calendar Container */}
      <div className="rounded border border-gray-300 shadow-md">
        <div className="max-h-[800px] overflow-y-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            initialView="timeGridWeek"
            editable
            selectable
            selectMirror
            weekends
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            datesSet={handleDatesSet}
            slotDuration="01:00:00"
            scrollTime="08:00:00"  // <--- make sure this is here!
            slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
            views={{
              timeGridWeek: {
                minTime: '00:00:00',
                maxTime: '24:00:00',
                allDaySlot: false,
              },
              timeGridDay: {
                minTime: '00:00:00',
                maxTime: '24:00:00',
                allDaySlot: false,
              },
            }}
          />
        </div>
      </div>
    </div>  
  );
} 