import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      participants: [
        {
          gymratsId: "local-admin",
          fullName: "Matheus Nascimento",
          role: "owner",
          hasPassword: false
        }
      ]
    });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("participants")
    .select("gymrats_id, full_name, role, profile_picture_url, password_hash")
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, participants: [] }, { status: 500 });
  }

  if (!data.length) {
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("participant, team")
      .order("participant", { ascending: true });

    if (activitiesError) {
      return NextResponse.json({ configured: true, error: activitiesError.message, participants: [] }, { status: 500 });
    }

    const names = new Map<string, string>();
    (activities ?? []).forEach((activity) => {
      if (activity.participant) {
        names.set(activity.participant, activity.team || "member");
      }
    });

    return NextResponse.json({
      configured: true,
      participants: Array.from(names.entries()).map(([fullName, role]) => ({
        gymratsId: `name:${fullName}`,
        fullName,
        role,
        hasPassword: false
      }))
    });
  }

  return NextResponse.json({
    configured: true,
    participants: data.map((participant) => ({
      gymratsId: participant.gymrats_id,
      fullName: participant.full_name,
      role: participant.role,
      profilePictureUrl: participant.profile_picture_url,
      hasPassword: Boolean(participant.password_hash)
    }))
  });
}
