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
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (body.mode === "replace") {
    const { error: deleteError } = await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const mapped = mapCheckInsToActivities(members, checkIns);
  const rows = mapped.records.map((record) => {
    const member = members.find((item) => item.full_name === record.participant);
    return {
      ...activityRecordToRow(record),
      participant_gymrats_id: member?.id ?? null
    };
  });

  let saved = 0;
  let duplicates = mapped.skipped;

  if (rows.length) {
    const { data, error } = await supabase.from("activities").upsert(rows, { onConflict: "gymrats_check_in_id", ignoreDuplicates: true }).select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    saved = data?.length ?? 0;
    duplicates += rows.length - saved;
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
