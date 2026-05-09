import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { alcoholRowToRecord, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import type { AlcoholRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, records: [] });
  }

  const weekKey = request.nextUrl.searchParams.get("weekKey");
  const user = await getCurrentUser();
  const supabase = getSupabaseAdmin()!;
  let query = supabase.from("alcohol_records").select("participant, week_key, status, updated_at").order("week_key", { ascending: true });

  if (weekKey) {
    query = query.eq("week_key", weekKey);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, records: [] }, { status: 500 });
  }

  return NextResponse.json({ configured: true, records: data.map(alcoholRowToRecord) });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const body = (await request.json()) as AlcoholRecord;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  if (!user.isSuperAdmin && body.participant !== user.fullName) {
    return NextResponse.json({ error: "Voce so pode alterar o seu proprio status." }, { status: 403 });
  }

  if (body.status !== "ok" && body.status !== "broke") {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data: existing, error: existingError } = await supabase
    .from("alcohol_records")
    .select("status")
    .eq("participant", body.participant)
    .eq("week_key", body.weekKey)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!user.isSuperAdmin && existing?.status === "broke" && body.status !== "broke") {
    return NextResponse.json({ error: "Status Vish Bebi fica travado ate virar a semana." }, { status: 409 });
  }

  const { error } = await supabase.from("alcohol_records").upsert(
    {
      participant: body.participant,
      week_key: body.weekKey,
      status: body.status,
      updated_at: new Date().toISOString()
    },
    { onConflict: "participant,week_key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
