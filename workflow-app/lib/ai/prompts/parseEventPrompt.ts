// lib/ai/prompts/parseEventPrompt.ts
export function generateParseEventPrompt(userInput: string, now: string, type: string = "calendar-event"): string {
    return `
    Parse the following ${type} description into a JSON object with the exact fields:
    {
      "title": string,              // required, brief event name (don't include the date or time in the title)
      "description": string,        // optional, details about the event
      "start": string,              // required, start date/time in ISO 8601 format if possible
      "end": string,                // optional, end date/time in ISO 8601 format, if not specified, assume 1 hour after start
      "location": string,           // optional
      "reminder": string,           // required, choose from: "10 minutes before", "1 hour before", "1 day before", "2 days before", or "none"
                                    // Set to "none" ONLY if the user gives no clear request or hint. If the user uses phrases like:
                                    // "remind me", "set an alert", "don't let me forget", "wake me up", "warn me before", or mentions a time to be reminded,
                                    // then choose the best matching option. If it's unclear but a reminder feels implied (like for early meetings, deadlines, etc.), choose "1 hour before" or "1 day before" by default.
      "tag": string,                // required, event category, choose from "deadline", "meeting", "class", "focus", "workout", "social", "personal"
      "color": string,              // required, hex or color name matching tag
      "isStructural": boolean,      // optional, true/false, for recurring events built into schedule that can't be missed or changed like classes, meetings, etc.
      "isNonNegotiable": boolean    // optional, true/false, for events that are important to the user and need to be prioritized. 
                                    // These can be workouts or hobbies that are goal oriented or strictly scheduled (not just a random workout or just for fun). 
                                    // Also praying, social obligations (like calling family), nap time, focus time for deepwork etc. 
                                    // (usually not related to work or school). anything the user indicates as important should be true. 
                                    // If the user doesn't indicate anything as important, default to false. If the user indicates something as important, default to true.
                                    // Clarify common misconceptions:
                                    // Do NOT assume all workouts are non-negotiable. Only mark isNonNegotiable as true if user uses strong language (e.g., "must", "need to", "important", "can't skip", "goal", etc.)
                                    // If user casually mentions "go to the gym" or "do a workout", without urgency or importance, set isNonNegotiable to false.
    }   
  
    Only respond with the raw JSON object, no explanation or extra text.
  
    For the "color" field, use the following hex codes based on the "tag":
      deadline: #dc2626  
      meeting: #8b5cf6  
      class: #1d4ed8  
      focus: #ede8d0  
      workout: #03c04a  
      social: #ff8da1  
      personal: #6b7280  
  
    The current date/time is: ${now}.
    If the description only contains a weekday, interpret it as the next upcoming weekday from today's date. Use current date and year.
    Assume timezone Eastern Standard Time (EST). Format dates in ISO 8601 with timezone offset -04:00 UTC.
    If the description contains a time (later than ${now}), but no date, assume the event is happening today.
  
    Here are some example outputs:
  
    User: "Doctor appointment at 3pm tomorrow, remind me 10 minutes before"  
    Output: {
      "title": "Doctor appointment",
      "start": "...",
      ...
      "reminder": "10 minutes before",
      ...
    }
  
    User: "Quick massage at 10am"  
    Output: {
      ...
      "tag": "personal",
      "reminder": "1 day before"
    }
  
    User: "Morning run on Sunday at 8am"  
    Output: {
      ...
      "tag": "workout",
      "reminder": "1 hour before"
    }
  
    User: "Project deadline Friday at 6pm"  
    Output: {
      ...
      "tag": "deadline",
      "reminder": "1 day before"
    }
  
    User: "hang out with Sarah"  
    Output: {
      ...
      "tag": "social",
      "reminder": "none"
    }
  
    User: "call dad for 15 minutes at 10pm"  
    Output: {
      ...
      "tag": "social",
      "reminder": "none"
    }
  
    Event description: "${userInput}"
    `;
  }
  