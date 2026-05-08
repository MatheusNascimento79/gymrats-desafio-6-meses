import { NextRequest, NextResponse } from "next/server";
import { createSession, hashPassword, isSuperAdminName } from "@/lib/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const body = (await request.json()) as { gymratsId?: string; password?: string; confirmPassword?: string };

  if (!body.gymratsId || !body.password || body.password.length < 4) {
    return NextResponse.json({ error: "Preencha participante e senha com pelo menos 4 caracteres." }, { status: 400 });
  }

  if (body.password !== body.confirmPassword) {
    return NextResponse.json({ error: "A confirmacao de senha nao confere." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  let { data: participant, error } = await supabase
    .from("participants")
    .select("gymrats_id, full_name, role, password_hash")
    .eq("gymrats_id", body.gymratsId)
    .single();

  if ((error || !participant) && body.gymratsId.startsWith("name:")) {
    const fullName = body.gymratsId.replace(/^name:/, "");
    const { data: activity } = await supabase.from("activities").select("participant, team").eq("participant", fullName).limit(1).single();

    if (activity?.participant) {
      const { data: created, error: createError } = await supabase
        .from("participants")
        .upsert(
          {
            gymrats_id: body.gymratsId,
            full_name: activity.participant,
            role: activity.team || "member",
            updated_at: new Date().toISOString()
          },
          { onConflict: "gymrats_id" }
        )
        .select("gymrats_id, full_name, role, password_hash")
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      participant = created;
      error = null;
    }
  }

  if (error || !participant) {
    return NextResponse.json({ error: "Participante nao encontrado nos dados GymRats importados." }, { status: 404 });
  }

  if (participant.password_hash) {
    return NextResponse.json({ error: "Senha ja criada. Use o login de retorno." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(body.password);
  const { error: updateError } = await supabase
    .from("participants")
    .update({
      password_hash: hash,
      password_salt: salt,
      password_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("gymrats_id", body.gymratsId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await createSession(participant);

  return NextResponse.json({
    user: {
      gymratsId: participant.gymrats_id,
      fullName: participant.full_name,
      role: participant.role,
      isSuperAdmin: isSuperAdminName(participant.full_name)
    }
  });
}
