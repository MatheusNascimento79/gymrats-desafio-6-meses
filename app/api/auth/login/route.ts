import { NextRequest, NextResponse } from "next/server";
import { createSession, isSuperAdminName, verifyPassword } from "@/lib/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const body = (await request.json()) as { gymratsId?: string; password?: string };

  if (!body.gymratsId || !body.password) {
    return NextResponse.json({ error: "Preencha participante e senha." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  let { data: participant, error } = await supabase
    .from("participants")
    .select("gymrats_id, full_name, role, password_hash, password_salt")
    .eq("gymrats_id", body.gymratsId)
    .single();

  if ((error || !participant) && body.gymratsId.startsWith("name:")) {
    const fullName = body.gymratsId.replace(/^name:/, "");
    const result = await supabase
      .from("participants")
      .select("gymrats_id, full_name, role, password_hash, password_salt")
      .eq("full_name", fullName)
      .single();

    participant = result.data;
    error = result.error;
  }

  if (error || !participant) {
    return NextResponse.json({ error: "Participante nao encontrado." }, { status: 404 });
  }

  if (!participant.password_hash || !participant.password_salt) {
    return NextResponse.json({ error: "Primeiro acesso pendente. Crie sua senha." }, { status: 409 });
  }

  if (!verifyPassword(body.password, participant.password_hash, participant.password_salt)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
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
