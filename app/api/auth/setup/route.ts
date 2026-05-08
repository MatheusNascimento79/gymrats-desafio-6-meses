import { NextRequest, NextResponse } from "next/server";
import { createSetupSession } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== process.env.IMPORT_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
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
