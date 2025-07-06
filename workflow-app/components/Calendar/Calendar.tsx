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
  });


  const formatDateForInput = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes())
    );
  };

  const resetForm = () => {
    setFormData({ title: '', start: '', end: '', location: '', reminder: 'none' });
    setSelectedEvent(null);
    setIsFormOpen(false);
    if (calendarRef.current) {
      calendarRef.current.getApi().unselect();
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    let start: Date = selectInfo.start;
    let end: Date = selectInfo.end;

    if (!end || end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    setFormData({
      ...formData,
      start: formatDateForInput(start),
      end: formatDateForInput(end),
    });
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title as string,
        start:
          typeof event.start === 'string'
            ? event.start
            : formatDateForInput(new Date(event.start as any)),
        end:
          event.end
            ? typeof event.end === 'string'
              ? event.end
              : formatDateForInput(new Date(event.end as any))
            : '',
        location: event.extendedProps?.location || '',
        reminder: event.extendedProps?.reminder || 'none',
      });
      setIsFormOpen(true);
    }
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.title || !formData.start) {
      alert('Title and start time are required');
      return;
    }

    // Convert start and end to Date objects here
    const startDate = new Date(formData.start);
    const endDate = formData.end ? new Date(formData.end) : undefined;

    const newEvent = {
      id: selectedEvent?.id || String(Date.now()),
      title: formData.title,
      start: new Date(formData.start),  // convert ISO string to Date
      end: formData.end ? new Date(formData.end) : undefined,
      extendedProps: {
        location: formData.location,
        reminder: formData.reminder,
      },
    };

    console.log('Adding/updating event:', newEvent);
    console.log(events);

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
    <div className="relative w-full p-4 bg-white rounded-lg shadow-lg">
      <button
        className="absolute top-4 right-4 z-10 px-4 py-3 mb-6 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => {
          setSelectedEvent(null);
          setFormData({ title: '', start: '', end: '', location: '', reminder: 'none' });
          setIsFormOpen(true);
        }}
      >
        Add Event
      </button>

      <div className="flex flex-col mt-20">
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
              <h2 className="text-xl font-bold mb-4">{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Event Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Start Time *</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.start}
                    onChange={e => setFormData({ ...formData, start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">End Time (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded p-2"
                    value={formData.end}
                    onChange={e => setFormData({ ...formData, end: e.target.value })}
                  />
                </div>
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
                    <option value="none">None</option>
                    <option value="10m">10 minutes before</option>
                    <option value="1h">1 hour before</option>
                    <option value="1d">1 day before</option>
                    <option value="2d">2 days before</option>
                  </select>
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

      <div className="h-[700px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          datesSet={handleDatesSet}
          slotDuration="01:00:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
        />
      </div>
    </div>
  );
}
