import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/lib/advisory-types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: "AI assistant not configured" }, { status: 503 });
  }

  let body: ChatRequest;
  try {
    body = await req.json() as ChatRequest;
  } catch {
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: "invalid_json" }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: "empty_message" }, { status: 400 });
  }

  const edgeFnUrl = `${supabaseUrl}/functions/v1/ai-mobile-assistant`;

  let edgeRes: Response;
  try {
    edgeRes = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        message: body.message,
        history: body.history ?? [],
        environment: process.env.TRADING_ENVIRONMENT ?? "paper",
      }),
    });
  } catch (err) {
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: `edge_fn_unreachable: ${String(err)}` }, { status: 502 });
  }

  if (!edgeRes.ok) {
    const text = await edgeRes.text().catch(() => "");
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: `edge_fn_${edgeRes.status}: ${text}` }, { status: 502 });
  }

  const data = await edgeRes.json() as { reply?: string; error?: string };

  if (!data.reply) {
    return NextResponse.json<ChatResponse>({ ok: false, reply: "", error: data.error ?? "no_reply" }, { status: 502 });
  }

  return NextResponse.json<ChatResponse>({ ok: true, reply: data.reply });
}
