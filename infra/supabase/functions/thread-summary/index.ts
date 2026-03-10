import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type SummaryRequest = {
  thread_id: string;
};

type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!openAiApiKey) {
  throw new Error("Missing OPENAI_API_KEY secret.");
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secret.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: SummaryRequest;
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!payload?.thread_id) {
    return new Response("thread_id is required", { status: 400 });
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, content, created_at, user_id")
    .eq("thread_id", payload.thread_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load messages", error);
    return new Response("Failed to load messages", { status: 500 });
  }

  if (!messages || messages.length === 0) {
    return new Response("No messages found for thread", { status: 404 });
  }

  const threadText = (messages as MessageRow[])
    .map((message) => `${message.created_at} ${message.user_id}: ${message.content}`)
    .join("\n");

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize the following message thread for quick context.",
        },
        {
          role: "user",
          content: threadText,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    console.error("OpenAI error", errorText);
    return new Response("Failed to summarize thread", { status: 500 });
  }

  const openAiPayload = await openAiResponse.json();
  const summary = openAiPayload?.choices?.[0]?.message?.content?.trim();

  if (!summary) {
    return new Response("OpenAI returned empty summary", { status: 500 });
  }

  const { error: upsertError } = await supabase.from("thread_summaries").upsert(
    {
      thread_id: payload.thread_id,
      summary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "thread_id" },
  );

  if (upsertError) {
    console.error("Failed to store summary", upsertError);
    return new Response("Failed to store summary", { status: 500 });
  }

  return new Response(
    JSON.stringify({
      thread_id: payload.thread_id,
      summary,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
