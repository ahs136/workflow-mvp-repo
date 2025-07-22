// app/api/parse-events/route.ts
import { generateParseEventPrompt } from "@/lib/ai/prompts/parseEventPrompt";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const now = new Date().toISOString();

export async function POST(req: Request) {
  try {
    const { userInput } = await req.json();

    const prompt = generateParseEventPrompt(userInput, now, "calendar-event");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;

    let parsed: any;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch (e) {
      console.error("GPT returned invalid JSON:", e);
      throw new Error("Invalid JSON from AI");
    }

    const reminderMap: Record<string, string> = {
      "10 minutes before": "10m",
      "1 hour before": "1h",
      "1 day before": "1d",
      "2 days before": "2d",
      "none": "none",
    };

    parsed.reminder = reminderMap[parsed.reminder] || "none";

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error("GPT error:", error);
    return NextResponse.json({ error: "Failed to parse event" }, { status: 500 });
  }
}
