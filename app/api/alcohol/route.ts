import { NextRequest, NextResponse } from "next/server";
import { alcoholRowToRecord, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import type { AlcoholRecord } from "@/lib/types";

function isAuthorized(password?: string) {
  return password && password === process.env.IMPORT_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, records: [] });
  }

  const weekKey = request.nextUrl.searchParams.get("weekKey");
  const supabase = getSupabaseAdmin()!;
  let query = supabase.from("alcohol_records").select("participant, week_key, status").order("week_key", { ascending: true });

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

  const body = (await request.json()) as AlcoholRecord & { password?: string };

  if (!isAuthorized(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
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
