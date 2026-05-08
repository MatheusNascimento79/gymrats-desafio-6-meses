import { NextRequest, NextResponse } from "next/server";
import { createSetupSession } from "@/lib/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== process.env.IMPORT_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin()!;
    const { count, error } = await supabase.from("participants").select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: "Setup inicial indisponivel depois de importar participantes." }, { status: 403 });
    }
  }

  createSetupSession();
  return NextResponse.json({
    user: {
      gymratsId: "setup-admin",
      fullName: "Matheus Nascimento",
      role: "owner",
      isSuperAdmin: true
    }
  });
}
