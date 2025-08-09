'use client';

import { useEventContext } from '@/app/context/EventContext';
import { useState } from 'react';

export default function Productivity() {
  const { events, setEvents } = useEventContext();
  const now = new Date();

  // Step 1: Filter eligible events
  const eligibleEvents = events.filter(
    (e) =>
      e.extendedProps?.isCompleted &&
      !e.extendedProps?.isReviewed &&
      new Date(e.end) < now
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentEvent = eligibleEvents[currentIndex] || null;

  // Step 2: Manage feedback form state
  const [feedbackData, setFeedbackData] = useState<
    Record<
      string,
      {
        actualDurationMinutes: number;
        productivityRating: number;
        userNotes: string;
      }
    >
  >({});

  // Initialize feedback for the current event
  if (currentEvent && !feedbackData[currentEvent.id]) {
    setFeedbackData((prev) => ({
      ...prev,
      [currentEvent.id]: {
        actualDurationMinutes:
          currentEvent.extendedProps?.reviewData?.actualDurationMinutes || 0,
        productivityRating:
          currentEvent.extendedProps?.reviewData?.productivityRating || 3,
        userNotes:
          currentEvent.extendedProps?.reviewData?.userNotes || '',
      },
    }));
  }

  const handleInputChange = (
    id: string,
    field: 'actualDurationMinutes' | 'productivityRating' | 'userNotes',
    value: any
  ) => {
    setFeedbackData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === 'userNotes' ? value : Number(value),
      },
    }));
  };

  const handleSubmit = (id: string) => {
    if (!currentEvent) return;

    const feedback = feedbackData[currentEvent.id];
    if (!feedback) return;

    const updatedEvents = events.map((event) =>
      event.id === currentEvent.id
        ? {
            ...event,
            extendedProps: {
              ...event.extendedProps,
              isReviewed: true,
              reviewData: {
                actualDurationMinutes: feedback.actualDurationMinutes,
                productivityRating: feedback.productivityRating,
                userNotes: feedback.userNotes,
              },
            },
          }
        : event
    );

    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    setCurrentIndex((prev) => prev + 1);
  };

  if (!currentEvent) {
    return (
      <div className="p-6 max-w-xl mx-auto h-[80vh]">
        <h2 className="text-xl font-bold">No Feedback Needed</h2>
        <p>You've completed all relevant feedback for now. 🎉</p>
      </div>
    );
  }

  const fb = feedbackData[currentEvent.id] || {
    actualDurationMinutes: 0,
    productivityRating: 3,
    userNotes: '',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold">Productivity Feedback</h2>
      <p className="text-muted-foreground">
        Review and reflect on your recently completed events. This feedback helps your planning assistant learn and optimize your schedule.
      </p>

      <div className="border rounded-2xl p-4 space-y-3 shadow-sm bg-white">
        <h3 className="font-semibold text-lg">{currentEvent.title}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(currentEvent.start).toLocaleString()} →{' '}
          {new Date(currentEvent.end).toLocaleString()}
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Actual Duration (min)
          </label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1"
            value={fb.actualDurationMinutes}
            onChange={(e) =>
              handleInputChange(currentEvent.id, 'actualDurationMinutes', parseInt(e.target.value) || 0)
            }
          />

          <label className="block text-sm font-medium mt-2">
            Productivity Rating (1–5)
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={fb.productivityRating}
            onChange={(e) =>
              handleInputChange(currentEvent.id, 'productivityRating', parseInt(e.target.value))
            }
            className="w-full"
          />
          <div className="text-sm text-center text-gray-500">
            {fb.productivityRating}/5
          </div>

          <label className="block text-sm font-medium mt-2">
            Notes (optional)
          </label>
          <textarea
            className="w-full rounded border px-3 py-1"
            rows={2}
            placeholder="How did it go?"
            value={fb.userNotes}
            onChange={(e) =>
              handleInputChange(currentEvent.id, 'userNotes', e.target.value)
            }
          />

          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => handleSubmit(currentEvent.id)}
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
