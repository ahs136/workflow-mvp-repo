'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DatesSetArg } from '@fullcalendar/core';

export default function Calendar() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Please enter a title for your event');
    if (title) {
      const newEvent = {
        id: String(Date.now()),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      };
      setEvents([...events, newEvent]);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== clickInfo.event.id));
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    console.log('datesSet fired:', arg.start);
    setCurrentDate(arg.start);
  };

  console.log('Rendering month-year:', currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));


  return (
    <div className="h-full w-full p-4 bg-white rounded-lg shadow-lg">
    

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
  );
}
