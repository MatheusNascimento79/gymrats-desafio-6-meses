import { NextResponse } from "next/server";
import { activityRowToRecord, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, records: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("activities")
    .select("id, participant, activity_date, activity_type, duration_minutes, points, calories, distance, team")
    .order("activity_date", { ascending: true })
    .order("participant", { ascending: true });

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, records: [] }, { status: 500 });
  }

  return NextResponse.json({ configured: true, records: data.map(activityRowToRecord) });
}
