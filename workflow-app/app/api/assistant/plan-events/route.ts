import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

import { generatePlanPageSchedulingPrompt } from "@/lib/ai/prompts/planPageSchedulingPrompt";
import { generatePlanPageAssistantPrompt } from "@/lib/ai/prompts/planPageAssistantPrompt";

import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/utils/supabaseClient";
import { useEffect, useState } from "react";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode, userInput, currentEvents: events, lastResponse, userFeedback, user_id } = body;

  if (!userInput && !userFeedback) {
    return NextResponse.json({ error: "No userInput provided" }, { status: 400 });
  }

  const byTag: Record<string, any> = {};
  const byTitle: Record<string, any> = {};

  (events || []).forEach((e: any) => {
    const rd = e.extendedProps?.reviewData;
    if (!rd || !rd.actualDurationMinutes) return;

    // compute allotted minutes from start/end
    const start = e.start ? new Date(e.start).getTime() : null;
    const end = e.end ? new Date(e.end).getTime() : null;
    const allotted = start && end ? Math.max(1, Math.round((end - start) / 60000)) : null; // minutes

    const tagKey = (e.tag || e.extendedProps?.tag || "untagged").toLowerCase();
    const titleKey = e.title || "untitled";

    // helper to init
    const initBucket = (bucket: any, key: string) => {
      if (!bucket[key]) bucket[key] = { count: 0, totalAllotted: 0, totalActual: 0, totalRating: 0, notes: [] };
    };

    initBucket(byTag, tagKey);
    initBucket(byTitle, titleKey);

    if (allotted) byTag[tagKey].totalAllotted += allotted;
    byTag[tagKey].totalActual += rd.actualDurationMinutes;
    byTag[tagKey].totalRating += (rd.productivityRating ?? 0);
    if (rd.userNotes) byTag[tagKey].notes.push(rd.userNotes);
    byTag[tagKey].count++;

    if (allotted) byTitle[titleKey].totalAllotted += allotted;
    byTitle[titleKey].totalActual += rd.actualDurationMinutes;
    byTitle[titleKey].totalRating += (rd.productivityRating ?? 0);
    if (rd.userNotes) byTitle[titleKey].notes.push(rd.userNotes);
    byTitle[titleKey].count++;
  });

  // Build readable summary string
  const buildSummary = (bucket: Record<string, any>, label: string) => {
    const lines: string[] = [];
    lines.push(`${label} feedback summary:`);
    Object.entries(bucket).forEach(([key, stats]: any) => {
      const avgAllot = stats.totalAllotted && stats.count ? Math.round(stats.totalAllotted / stats.count) : null;
      const avgActual = stats.count ? Math.round(stats.totalActual / stats.count) : null;
      const avgRating = stats.count ? (stats.totalRating / stats.count).toFixed(2) : "N/A";
      const sampleNotes = stats.notes.slice(0, 3).join(" | ") || "none";
      lines.push(`- ${key}: count=${stats.count}, avgAllotted=${avgAllot ?? "n/a"} min, avgActual=${avgActual} min, avgRating=${avgRating}, sampleNotes=${sampleNotes}`);
    });
    if (Object.keys(bucket).length === 0) lines.push(`- None`);
    return lines.join("\n");
  };

  const feedbackSummary = `${buildSummary(byTag, "By tag")}\n\n${buildSummary(byTitle, "By title")}`;

  let prompt = "";

  if (mode === "parse") {
    prompt = generatePlanPageSchedulingPrompt({
      userInput,
      currentEvents: events,
      lastResponse,
      userFeedback,
      feedbackSummary,
      user_id,
    });
  } else if (mode === "plan") {
    prompt = generatePlanPageAssistantPrompt({
      userInput,
      currentEvents: events,
      lastAssistantMessage: lastResponse,
      feedbackSummary,
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
