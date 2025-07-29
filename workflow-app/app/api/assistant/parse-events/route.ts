// app/api/parse-events/route.ts
import { generateParseEventPrompt } from "@/lib/ai/prompts/parseEventPrompt";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { nanoid } from "nanoid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const now = new Date().toISOString();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userInput } = body;

    const prompt = generateParseEventPrompt(userInput, now, "calendar-event");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = completion.choices[0].message.content;

    let parsed: any;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch (e) {
      console.error("GPT returned invalid JSON:", e);
      throw new Error("Invalid JSON from AI");
    }

    // Assign nanoid if missing id
    // If your parsed object is a single event:
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (!parsed.id || parsed.id.trim() === "") {
        parsed.id = nanoid();
      }
    }

    // Or if parsed is { events: [...] }
    if (parsed?.events && Array.isArray(parsed.events)) {
      parsed.events = parsed.events.map((event: any) => ({
        ...event,
        id: event.id && event.id.trim() !== "" ? event.id : nanoid(),
      }));
    }

    // Reminder mapping (keep your existing logic)
    const reminderMap: Record<string, string> = {
      "10 minutes before": "10m",
      "1 hour before": "1h",
      "1 day before": "1d",
      "2 days before": "2d",
      "none": "none",
    };

    if (parsed.reminder) {
      parsed.reminder = reminderMap[parsed.reminder] || "none";
    } else if (parsed.events) {
      // Also map reminders in events, if present
      parsed.events = parsed.events.map((event: any) => ({
        ...event,
        reminder: reminderMap[event.reminder] || "none",
      }));
    }

    console.log("Received parsed event(s) with IDs:", parsed);

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error("GPT error:", error);
    return NextResponse.json({ error: "Failed to parse event" }, { status: 500 });
  }
}
