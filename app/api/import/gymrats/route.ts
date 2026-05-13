import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { mapCheckInsToActivities, type GymRatsCheckInRow, type GymRatsMemberRow } from "@/lib/gymrats-import";
import { activityRecordToRow, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type ImportBody = {
  mode?: "replace" | "merge";
  members?: GymRatsMemberRow[];
  checkIns?: GymRatsCheckInRow[];
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) {
    return NextResponse.json({ error: "Apenas o super admin pode importar dados." }, { status: 403 });
  }

  const body = (await request.json()) as ImportBody;
  const members = body.members ?? [];
  const checkIns = body.checkIns ?? [];

  if (!members.length || !checkIns.length) {
    return NextResponse.json({ error: "Envie members.csv e check_ins.csv." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  const memberRows = members
    .filter((member) => member.id && member.full_name)
    .map((member) => ({
      gymrats_id: member.id,
      uuid: member.uuid || null,
      role: member.role || "member",
      full_name: member.full_name,
      profile_picture_url: member.profile_picture_url || null,
      updated_at: new Date().toISOString()
    }));

  const { error: memberError } = await supabase.from("participants").upsert(memberRows, { onConflict: "gymrats_id" });

  if (memberError) {
    return NextResponse.json({ error: `Erro ao salvar participantes: ${memberError.message}` }, { status: 500 });
  }

  let removed = 0;

  if (body.mode === "replace") {
    const { count: existingCount, error: countError } = await supabase.from("activities").select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: `Erro ao contar atividades antigas: ${countError.message}` }, { status: 500 });
    }

    const { error: deleteError } = await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      return NextResponse.json({ error: `Erro ao limpar atividades antigas: ${deleteError.message}` }, { status: 500 });
    }

    removed = existingCount ?? 0;
  }

  const mapped = mapCheckInsToActivities(members, checkIns);
  const rows = mapped.records.map((record) => {
    const member = members.find((item) => item.full_name === record.participant);
    return {
      ...activityRecordToRow(record),
      dedup_key: `gymrats-check-in:${record.id}`,
      participant_gymrats_id: member?.id ?? null
    };
  });

  let saved = 0;
  let updated = 0;
  let duplicates = mapped.skipped;

  if (rows.length) {
    const checkInIds = rows.map((row) => row.gymrats_check_in_id).filter((id): id is string => Boolean(id));
    const existingCheckInIds = new Set<string>();

    for (let index = 0; index < checkInIds.length; index += 500) {
      const chunk = checkInIds.slice(index, index + 500);
      const { data: existing, error: existingError } = await supabase
        .from("activities")
        .select("gymrats_check_in_id")
        .in("gymrats_check_in_id", chunk);

      if (existingError) {
        return NextResponse.json({ error: `Erro ao verificar duplicados: ${existingError.message}` }, { status: 500 });
      }

      (existing ?? []).forEach((item) => {
        if (item.gymrats_check_in_id) {
          existingCheckInIds.add(item.gymrats_check_in_id);
        }
      });
    }

    const newRows = rows.filter((row) => !row.gymrats_check_in_id || !existingCheckInIds.has(row.gymrats_check_in_id));
    duplicates += rows.length - newRows.length;
    updated = rows.length - newRows.length;

    for (let index = 0; index < rows.length; index += 500) {
      const chunk = rows.slice(index, index + 500);
      const { data, error } = await supabase.from("activities").upsert(chunk, { onConflict: "dedup_key" }).select("id");

      if (error) {
        return NextResponse.json({ error: `Erro ao salvar atividades: ${error.message}` }, { status: 500 });
      }

      saved += data?.length ?? 0;
    }
  }

  const { count: totalAfter, error: totalError } = await supabase.from("activities").select("id", { count: "exact", head: true });

  if (totalError) {
    return NextResponse.json({ error: `Erro ao contar atividades finais: ${totalError.message}` }, { status: 500 });
  }

  const { data: latestRows, error: latestError } = await supabase
    .from("activities")
    .select("activity_date")
    .order("activity_date", { ascending: false })
    .limit(1);

  if (latestError) {
    return NextResponse.json({ error: `Erro ao verificar ultima atividade: ${latestError.message}` }, { status: 500 });
  }

  await supabase.from("import_batches").insert({
    mode: body.mode ?? "replace",
    received_records: checkIns.length,
    saved_records: body.mode === "merge" ? rows.length - updated : saved,
    duplicate_records: duplicates
  });

  return NextResponse.json({
    ok: true,
    participants: memberRows.length,
    received: checkIns.length,
    mapped: rows.length,
    removed,
    saved: body.mode === "merge" ? rows.length - updated : saved,
    updated,
    duplicates,
    totalAfter: totalAfter ?? 0,
    latestActivityDate: latestRows?.[0]?.activity_date ?? null
  });
}
