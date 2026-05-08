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

  if (body.mode === "replace") {
    const { data: existingActivities, error: listError } = await supabase.from("activities").select("id");

    if (listError) {
      return NextResponse.json({ error: `Erro ao listar atividades antigas: ${listError.message}` }, { status: 500 });
    }

    const existingIds = (existingActivities ?? []).map((activity) => activity.id);

    for (let index = 0; index < existingIds.length; index += 500) {
      const chunk = existingIds.slice(index, index + 500);
      const { error: deleteError } = await supabase.from("activities").delete().in("id", chunk);

      if (deleteError) {
        return NextResponse.json({ error: `Erro ao limpar atividades antigas: ${deleteError.message}` }, { status: 500 });
      }
    }
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

    for (let index = 0; index < newRows.length; index += 500) {
      const chunk = newRows.slice(index, index + 500);
      const { data, error } = await supabase.from("activities").insert(chunk).select("id");

      if (error) {
        return NextResponse.json({ error: `Erro ao inserir atividades: ${error.message}` }, { status: 500 });
      }

      saved += data?.length ?? 0;
    }
  }

  await supabase.from("import_batches").insert({
    mode: body.mode ?? "replace",
    received_records: checkIns.length,
    saved_records: saved,
    duplicate_records: duplicates
  });

  return NextResponse.json({
    ok: true,
    participants: memberRows.length,
    received: checkIns.length,
    saved,
    duplicates
  });
}
