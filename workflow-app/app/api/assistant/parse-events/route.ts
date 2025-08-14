// app/api/parse-events/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { nanoid } from "nanoid";


import { generateParseEventPrompt } from "@/lib/ai/prompts/parseSingleEventPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userInput } = body;


    // --- 3. Prepare prompt & call OpenAI ---
    const now = new Date().toISOString();
    const prompt = generateParseEventPrompt(userInput, now, "calendar-event");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = completion.choices[0].message?.content || "{}";

    // --- 4. Parse AI response ---
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("GPT returned invalid JSON:", err);
      parsed = {};
    }

    // --- 5. Assign IDs ---
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (!parsed.id || parsed.id.trim() === "") parsed.id = nanoid();
    }
    if (parsed?.events && Array.isArray(parsed.events)) {
      parsed.events = parsed.events.map((ev: any) => ({
        ...ev,
        id: ev.id && ev.id.trim() !== "" ? ev.id : nanoid(),
      }));
    }

    // --- 6. Map reminders ---
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
      parsed.events = parsed.events.map((ev: any) => ({
        ...ev,
        reminder: reminderMap[ev.reminder] || "none",
      }));
    }

    console.log("Parsed event(s):", parsed);

    return NextResponse.json({ result: parsed });

  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Failed to parse event" }, { status: 500 });
  }
}
