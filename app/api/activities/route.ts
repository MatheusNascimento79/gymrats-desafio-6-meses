import { NextResponse } from "next/server";
import { activityRowToRecord, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { configured: false, records: [], recordCount: 0, latestActivityDate: null },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("activities")
    .select("id, participant, activity_date, activity_type, duration_minutes, points, calories, distance, team")
    .order("activity_date", { ascending: true })
    .order("participant", { ascending: true });

  if (error) {
    return NextResponse.json(
      { configured: true, error: error.message, records: [], recordCount: 0, latestActivityDate: null },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const records = data.map(activityRowToRecord);
  const latestActivityDate = records.at(-1)?.date ?? null;

  return NextResponse.json(
    {
      configured: true,
      records,
      recordCount: records.length,
      latestActivityDate
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
