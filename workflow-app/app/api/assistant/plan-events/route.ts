import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let chatHistory: { role: 'system'|'user'|'assistant', content: string }[] = [
  {
    role: 'system',
    content: `You are a helpful and curious planning assistant. Use current calendar events (provided by the user) to suggest plans, identify conflicts, and manage deadlines.`,
  },
];

export async function POST(req: Request) {
  try {
    const { userMessage, currentEvents } = await req.json();

    // Only insert currentEvents once if not already added
    const alreadyHasEvents = chatHistory.some(m =>
      m.content.includes('"title"') && m.role === 'user'
    );
    if (!alreadyHasEvents && currentEvents) {
      chatHistory.push({
        role: 'user',
        content: `Here are my current events:\n\n${JSON.stringify(currentEvents, null, 2)}`,
      });
    }

    // Add the new user message
    chatHistory.push({ role: 'user', content: userMessage });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatHistory,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    chatHistory.push({ role: 'assistant', content: reply });

    return new NextResponse(reply, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[PLAN_EVENTS_ERROR]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
