import { NextRequest, NextResponse } from "next/server";
import { dedupeActivities } from "@/lib/dedupe";
import { activityRecordToRow, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import type { ActivityRecord } from "@/lib/types";

type ImportBody = {
  password?: string;
  mode?: "replace" | "merge";
  records?: ActivityRecord[];
};

function isAuthorized(password?: string) {
  return password && password === process.env.IMPORT_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const body = (await request.json()) as ImportBody;

  if (!isAuthorized(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const mode = body.mode ?? "replace";
  const incoming = body.records ?? [];
  const deduped = dedupeActivities(incoming);
  const supabase = getSupabaseAdmin()!;

  if (mode === "replace") {
    const { error: deleteError } = await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const rows = deduped.records.map(activityRecordToRow);
  let saved = 0;
  let ignored = deduped.duplicates;

  if (rows.length) {
    const { data, error } = await supabase.from("activities").upsert(rows, { onConflict: "dedup_key", ignoreDuplicates: true }).select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    saved = data?.length ?? 0;
    ignored += rows.length - saved;
  }

  await supabase.from("import_batches").insert({
    mode,
    received_records: incoming.length,
    saved_records: saved,
    duplicate_records: ignored
  });

  return NextResponse.json({
    ok: true,
    mode,
    received: incoming.length,
    saved,
    duplicates: ignored
  });
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const body = (await request.json()) as { password?: string };

  if (!isAuthorized(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { error } = await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
