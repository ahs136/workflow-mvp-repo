// lib/ai/usage.ts
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase env variables missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Server-side Supabase client
const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface CheckDailyLimitParams {
  userId: string;
  route: string;
  maxCalls: number;
  maxTokens?: number; // optional for future use
}

// Returns true if the user can call this route, false if limit reached
export async function checkDailyLimit({ userId, route, maxCalls }: CheckDailyLimitParams) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1️⃣ Check existing usage
  const { data: existing, error } = await supabaseServer
    .from("ai_usage")
    .select("id, calls")
    .eq("user_id", userId)
    .eq("route", route)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching usage:", error);
    return false;
  }

  // 2️⃣ If no record exists, insert new
  if (!existing) {
    const { error: insertError } = await supabaseServer.from("ai_usage").insert({
      user_id: userId,
      route,
      date: today,
      calls: 1,
    });
    if (insertError) {
      console.error("Error inserting usage:", insertError);
      return false;
    }
    return true;
  }

  // 3️⃣ If existing record exceeds maxCalls, reject
  if (existing.calls >= maxCalls) return false;

  // 4️⃣ Increment usage
  const { error: updateError } = await supabaseServer
    .from("ai_usage")
    .update({ calls: existing.calls + 1 })
    .eq("id", existing.id);

  if (updateError) {
    console.error("Error updating usage:", updateError);
    return false;
  }

  return true;
}
