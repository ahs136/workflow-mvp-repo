import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { completionRate, currentStreak, upcomingDeadlines } = await request.json();

    const prompt = `
You are a helpful productivity assistant. Given the following metrics about a user's calendar:

- Completion rate of tasks (%): ${completionRate}
- Current productivity streak (days): ${currentStreak}
- Number of upcoming deadlines: ${upcomingDeadlines}

Write a short, clear, encouraging summary highlighting the most important insight.  
Avoid generic statements. Make it personalized and actionable.

Summary:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 100,
    });

    const summary = response.choices[0].message?.content?.trim() || "";

    return new Response(JSON.stringify({ summary }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
