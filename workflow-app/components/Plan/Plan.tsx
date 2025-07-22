// File: app/plan/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toZonedTime, format } from 'date-fns-tz';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // changed from Date for JSON serialization
}

const STORAGE_SESSIONS_KEY = 'planningChatSessions';

export default function Plan() {
  const [sessions, setSessions] = useState<Record<string, { title: string; messages: Message[] }>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvents, setCurrentEvents] = useState<any[]>([]);

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
    const raw = localStorage.getItem('calendarEvents');
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
  
      setCurrentEvents(estEvents);
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
        // inside handleSubmit()
        const res = await fetch('/api/assistant/plan-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage: inputValue, currentEvents }),
        });
        
        // read plain text
        const assistantText = await res.text();
        
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

  const messages = currentSessionId ? sessions[currentSessionId]?.messages || [] : [];

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
          <h1 className="text-2xl font-bold">AI Planning Assistant</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-2xl text-sm ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                <p>{msg.content}</p>
                <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-sm text-gray-500">Assistant is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

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
