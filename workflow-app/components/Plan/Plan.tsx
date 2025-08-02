// File: app/plan/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toZonedTime, format } from 'date-fns-tz';
import { useEventContext } from '@/app/context/EventContext';
import { EventInput } from '@fullcalendar/core';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // changed from Date for JSON serialization
}

const STORAGE_SESSIONS_KEY = 'planningChatSessions';

export default function Plan() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { events, setEvents } = useEventContext();
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackValue, setFeedbackValue] = useState('');
  const [mode, setMode] = useState<'parse' | 'plan'>('parse');
  const STORAGE_KEY = 'calendarEvents';

  const defaultTagColors: Record<string, string> = {
    deadline: '#dc2626',
    meeting: '#8b5cf6',
    class:   '#1d4ed8',
    focus:   '#ede8d0',
    workout: '#03c04a',
    social:  '#ff8da1',
    personal:'#6b7280',
  };

  interface Session {
    title: string;
    messages: Message[];
  }
  
  useEffect(() => {
    console.log("Events from context:", events);
  }, [events]);

  const [sessions, setSessions] = useState<Record<string, Session>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("planner_sessions");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("planner_current_session_id") || null;
    }
    return null;
  });
  

  useEffect(() => {
    localStorage.setItem("planner_sessions", JSON.stringify(sessions));
  }, [sessions]);
  

  useEffect(() => {
    localStorage.setItem("planner_current_session_id", currentSessionId || "");
  }, [currentSessionId]);
  

  function tryApplyEventsFromResponse(text: string) {
    try {
      const parsed = JSON.parse(text);
  
      if (parsed?.action === 'add' && Array.isArray(parsed.events)) {
        const eventsWithIds = parsed.events.map((event: EventInput) => {
            const id = nanoid();
            console.log('🤖 [Plan Parsed Event] Received parsedEvent, assigning id:', id, event);
            const tag = event.tag || 'deadline'; // fallback tag
            const color = event.color || defaultTagColors[tag];
  
            return {
                ...event,
                id,
                createdByAI: true,
                tag,
                color,
            };
        });
  
        setEvents(prev => {
          const updated = [...prev, ...eventsWithIds];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
  
      if (parsed?.action === 'delete') {
        setEvents(prev => {
          let filtered = prev;
      
          if (Array.isArray(parsed.eventIds) && parsed.eventIds.length > 0) {
            // Delete by IDs (legacy or direct)
            filtered = prev.filter(e => !parsed.eventIds.includes(e.id));
          } else if (parsed.match && parsed.value) {
            // Delete by matching criteria
            function eventMatches(event: EventInput): boolean {
              switch (parsed.match) {
                case 'title':
                  return event.title?.toLowerCase() === parsed.value.toLowerCase();
                case 'tag':
                  return event.tag === parsed.value;
                case 'date':
                  const eventDate = new Date(event.start as string).toISOString().slice(0,10);
                  return eventDate === parsed.value;
                default:
                  return false;
              }
            }
      
            if (parsed.scope === 'single') {
              const index = prev.findIndex(event => eventMatches(event));
              if (index === -1) return prev;
              filtered = [...prev.slice(0, index), ...prev.slice(index + 1)];
            } else {
              // default to removing all matching events
              filtered = prev.filter(event => !eventMatches(event));
            }
          } else {
            // No recognizable deletion criteria, no change
            return prev;
          }
      
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          return filtered;
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
    const session = sessions[currentSessionId!];
    const timestamp = new Date().toISOString();
  
    const correctionMessage: Message = {
      id: nanoid(),
      content: userMessage,
      role: 'user',
      timestamp
    };
  
    const updatedMessages = [...session.messages, correctionMessage];
    const updatedSession = { ...session, messages: updatedMessages };
  
    setSessions(prev => ({
        ...prev,
        [currentSessionId!]: {
          ...prev[currentSessionId!],
          lastUpdated: Date.now(),
          messages: [...prev[currentSessionId!].messages, correctionMessage],
        }
      }));
      
  
    try {
      const res = await fetch('/api/assistant/plan-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userCorrection,
          userFeedback: userCorrection,
          currentEvents: events,
          lastResponse: session.messages[session.messages.length - 1].content,
          mode
        }),
      });
  
      const assistantText = await res.text();
  
      const assistantMessage: Message = {
        id: nanoid(),
        content: assistantText,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
  
      setSessions(prev => ({
        ...prev,
        [currentSessionId!]: {
          ...prev[currentSessionId!],
          messages: [...prev[currentSessionId!].messages, assistantMessage],
        },
      }));
  
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

  const saveToLocalStorage = (updatedSessions: typeof sessions) => {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
  };


  // get current events from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
  
    try {
      const parsed: any[] = JSON.parse(raw);
  
      // Time zone string for Eastern Time (handles EST/EDT automatically)
      const timeZone = 'America/New_York';
  
      const estEvents = parsed.map(e => {
        // Convert UTC ISO -> Date in target zone
        const zonedStart = toZonedTime(e.start, timeZone);
        const startISO = format(zonedStart, 'yyyy-MM-dd HH:mm:ss', { timeZone });
  
        let endISO: string | undefined;
        if (e.end) {
          const zonedEnd = toZonedTime(e.end, timeZone);
          endISO = format(zonedEnd, 'yyyy-MM-dd HH:mm:ss', { timeZone });
        }
  
        return {
          ...e,
          start: startISO,
          end: endISO,
        };
      });
  
      setEvents(estEvents);
    } catch (err) {
      console.warn('Could not parse calendarEvents', err);
    }
  }, []);
  

  // --- INIT ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        const first = Object.keys(parsed)[0];
        if (first) setCurrentSessionId(first);
      } catch (err) {
        console.error('Failed to parse sessions from storage', err);
      }
    } else {
      const id = nanoid();
      const initial = {
        [id]: {
          title: 'New Plan',
          messages: [
            {
              id: nanoid(),
              content:
                "Hi! I'm your AI planning assistant. I can help you create study schedules, set goals, organize tasks, and develop productivity strategies. What would you like to plan today?",
              role: 'assistant',
              timestamp: new Date().toISOString()
            }
          ]
        }
      };
      setSessions(initial as any);
      setCurrentSessionId(id);
    }
  }, []);

  useEffect(() => {
    saveToLocalStorage(sessions);
  }, [sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const createNewSession = () => {
    const id = nanoid();
    const newSession = {
      title: `New Plan ${Object.keys(sessions).length + 1}`,
      messages: [
        {
          id: nanoid(),
          content:
            "Hi! I'm your AI planning assistant. What would you like to plan today?",
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ]
    };
    setSessions({ ...sessions, [id]: newSession as any });
    setCurrentSessionId(id);
  };

  const deleteSession = (id: string) => {
    const updated = { ...sessions };
    delete updated[id];
    setSessions(updated);
    const remaining = Object.keys(updated);
    setCurrentSessionId(remaining[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
  
    const id = currentSessionId || nanoid();
    const newTitle = inputValue.trim().split(/\s+/).slice(0, 5).join(' ');  
    const timestamp = new Date().toISOString();
  
    const userMessage: Message = {
      id: nanoid(),
      content: inputValue,
      role: 'user',
      timestamp
    };
  
    const session = sessions[id] || { title: 'New Plan', messages: [] };
    const updatedMessages = [...session.messages, userMessage];
    const updatedSession = {
      title: session.title.startsWith('New Plan') ? newTitle : session.title,
      messages: updatedMessages
    };
  
    const newSessions = { ...sessions, [id]: updatedSession };
    setSessions(newSessions);
    setCurrentSessionId(id);
    setInputValue('');
    setIsLoading(true);
  
    try {
      // First fetch the response from the API
      const res = await fetch('/api/assistant/plan-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: inputValue, currentEvents: events, mode, lastResponse: session.messages[session.messages.length - 1].content }),
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
  
      setSessions(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          messages: [...prev[id].messages, assistantMessage],
        },
      }));
  
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
          {Object.entries(sessions).map(([id, session]) => (
            <li
              key={id}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between ${
                id === currentSessionId ? 'bg-primary/10 font-semibold' : ''
              }`}
              onClick={() => setCurrentSessionId(id)}
            >
              <span className="truncate w-40">{session.title}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteSession(id);
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
            {(currentSessionId ? sessions[currentSessionId]?.messages || [] : []).map(msg => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-black'  // assistant messages always gray bg + black text
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
            ))}
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
