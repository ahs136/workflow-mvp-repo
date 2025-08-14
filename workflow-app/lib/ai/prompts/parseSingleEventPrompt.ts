

export function generateParseEventPrompt(userInput: string, now: string, type: string = "calendar-event"): string {
    return `
Parse the following ${type} description into a JSON object with these exact fields:

RESPOND WITH ONLY JSON, NO UNECESSARY PARANTHESIS OR COMMENTS.

{
  "id": string,                 // required — a unique non-empty id (e.g. "e0c9s2a1" or "9f87ghk2"), do not leave id blank or null.
  "title": string,              // required — A short, clear title (do not include any date/time here)
  "description": string,        // optional — Extra details about the event
  "start": string,              // required — ISO 8601 datetime format (e.g., "2025-07-25T14:00:00-04:00")
  "end": string,                // optional — ISO 8601 datetime (default to 1 hour after start if not provided)
  "location": string,           // optional — e.g., "Zoom", "Library", "Gym". Look for the word "location" or "at" in the user input to determine if this is a location dependent event.
  "reminder": string,           // required — One of: "10 minutes before", "1 hour before", "1 day before", "2 days before", or "none"
  "tag": string,                // required — One of: "deadline", "meeting", "class", "focus", "workout", "social", "personal"
  "color": string,              // required — HEX color code based on tag:
                                //   - "deadline": "#FF6B6B"
                                //   - "meeting": "#1E90FF"
                                //   - "class": "#6A5ACD"
                                //   - "focus": "#20B2AA"
                                //   - "workout": "#FF8C00"
                                //   - "social": "#DA70D6"
                                //   - "personal": "#32CD32"
  "repeat": string,             // required — One of: 'none'|'daily'|'weekdays'|'weekly'|'customDays'
                                // if the user hints at a recurring event you must set "repeat" to one of the above to access the "byDay" field. otherwise set to "none" and do not include "byDay", choosing the date by selecting a start string.
  "repeatUntil": string,        // optional — ISO 8601 end date for recurrence (e.g., "2025-08-30")
  "byDay": string[],            // optional — Array of weekday codes for weekly repeat (e.g., ["MO", "WE", "FR"])
  "isStructural": boolean,      // optional — true if this is a fixed recurring event like a class or meeting
  "isNonNegotiable": boolean    // optional — true if this is a personal obligation you will not reschedule (like a personal workout or family dinner)
}

Only return valid JSON. If any required information is missing, make a reasonable assumption or clearly state the missing fields in a separate "note" field at the end of the JSON.
NEVER RETURN ANYTHING OTHER THAN VALID JSON. do not include any markdown or code blocks that would break the formatting.
  
  Timezone: Eastern (EST). Dates should use ISO 8601 with -04:00 offset.
  Use today's date/time as reference: ${now}
  
  ---
  
  ### Reminder Parsing
  
  If the user mentions:
  - "remind me", "set an alert", "don't let me forget", or urgency: choose appropriate reminder.
  - No mention: default to "none" unless the event feels important (early morning, deadlines, etc.).
  
  ---
  
  ### Recurrence Rules
  
  1. If the event is recurring:
     - Set "repeat" to either "daily" or "weekly"
     - Set "repeatUntil" if the user says "until", "through", or gives an end date.
     - Always include "byDay" **only when** "repeat": "weekly"
     - If "repeat": "weekly" → must include "byDay" → must set "isStructural": true
  
  2. If user says:
     - "every day", "daily", or "each day" → set "repeat": "daily", no "byDay"
     - "weekdays", "every weekday" → set "repeat": "weekly", "byDay": ["MO", "TU", "WE", "TH", "FR"]
     - "MWF", "Mon/Wed/Fri" → parse those days into "byDay"
     - "weekly" only (no days) → set "byDay" based on the weekday of "start" date
     - "every Monday and Wednesday" → parse as ["MO", "WE"]
     - If recurrence mentioned, but ambiguous → err toward "weekly" with inferred "byDay"
  
  ---
  
  ### Color Tags
  
  Use these colors based on tag:
  - deadline: #dc2626  
  - meeting: #8b5cf6  
  - class: #1d4ed8  
  - focus: #ede8d0  
  - workout: #03c04a  
  - social: #ff8da1  
  - personal: #6b7280  
  
  ---
  
  ### Examples
  
  User: "CS class on MWF at 2pm until Dec 1"  
  →
  {
    "id": "", // leave blank, it will be generated later
  "title": "CS Class",
    "start": "2025-07-24T14:00:00-04:00",
    "end": "2025-07-24T15:00:00-04:00",
    "repeat": "weekly",
    "byDay": ["MO", "WE", "FR"],
    "repeatUntil": "2025-12-01",
    "isStructural": true,
    ...
  }
  
  User: "Run every weekday at 7am"  
  →
  {
    "id": "", // leave blank, it will be generated later
    "title": "Run",
    "start": "...",
    "repeat": "weekly",
    "byDay": ["MO", "TU", "WE", "TH", "FR"],
    ...
  }
  
  User: "Team sync every week at 10am starting Thursday"  
  →
  {
    "id": "", // leave blank, it will be generated later
    "title": "Team Sync",
    "start": "...",
    "repeat": "weekly",
    "byDay": ["TH"],
    "isStructural": true,
    ...
  }
  
  ---
  
  Event description: "${userInput}"
    `;
  }
  