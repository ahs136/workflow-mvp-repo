// app/api/assistant/plan-events/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generatePlanEventPrompt } from '@/lib/ai/prompts/planEventPrompt';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { userMessage, currentEvents } = await req.json();

    console.log('currentEvents:', JSON.stringify(currentEvents, null, 2));
    
    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage' }, { status: 400 });
    }

    // Build the system prompt
    const prompt = generatePlanEventPrompt({ userInput: userMessage, currentEvents });

    // Ask the model *without* streaming
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    });

    // Extract the assistant’s reply
    const assistantText = completion.choices[0]?.message?.content ?? '';

    // Return it as plain text
    return new NextResponse(assistantText, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[PLAN_EVENTS_ERROR]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
