import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { weekKeyFromDate } from "@/lib/challenge";
import { chatMessageRowToRecord, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const maxMessageLength = 500;

async function clearClosedWeeks(currentWeekKey: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase.from("weekly_chat_messages").delete().neq("week_key", currentWeekKey);
}

export async function GET() {
  const currentWeekKey = weekKeyFromDate(new Date());

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, weekKey: currentWeekKey, messages: [] });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio.", messages: [] }, { status: 401 });
  }

  await clearClosedWeeks(currentWeekKey);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("weekly_chat_messages")
    .select("id, participant, message, week_key, created_at")
    .eq("week_key", currentWeekKey)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, weekKey: currentWeekKey, messages: [] }, { status: 500 });
  }

  return NextResponse.json({ configured: true, weekKey: currentWeekKey, messages: data.map(chatMessageRowToRecord) });
}

export async function POST(request: NextRequest) {
  const currentWeekKey = weekKeyFromDate(new Date());

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const message = (body.message ?? "").trim();

  if (!message) {
    return NextResponse.json({ error: "Escreva uma mensagem antes de enviar." }, { status: 400 });
  }

  if (message.length > maxMessageLength) {
    return NextResponse.json({ error: `Mensagem muito longa. Use ate ${maxMessageLength} caracteres.` }, { status: 400 });
  }

  await clearClosedWeeks(currentWeekKey);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("weekly_chat_messages")
    .insert({
      week_key: currentWeekKey,
      participant_gymrats_id: user.gymratsId,
      participant: user.fullName,
      message
    })
    .select("id, participant, message, week_key, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: chatMessageRowToRecord(data) });
}
