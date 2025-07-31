import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

import { generatePlanEventPrompt } from "@/lib/ai/prompts/planEventPrompt";
import { generateSmartEventPlannerPrompt } from "@/lib/ai/prompts/smartEventPlannerPrompt";



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode, userInput, currentEvents: events, lastResponse, userFeedback } = body;

  if (!userInput && !userFeedback) {
    return NextResponse.json({ error: "No userInput provided" }, { status: 400 });
  }

  let prompt = "";

  if (mode === "parse") {
    prompt = generatePlanEventPrompt({
      userInput,
      currentEvents: events,
      lastResponse,
      userFeedback,
    });
  } else if (mode === "plan") {
    prompt = generateSmartEventPlannerPrompt({
      userInput,
      currentEvents: events,
    });
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = completion.choices[0].message?.content || "";

    console.log('Mode:', mode);
    console.log('User input:', userInput);
    console.log('OpenAI result:', result);


    return NextResponse.json({ result });
  } catch (error) { 
    console.error("OpenAI API error:", error);
    return NextResponse.json({ error: "OpenAI request failed" }, { status: 500 });
  }
}
