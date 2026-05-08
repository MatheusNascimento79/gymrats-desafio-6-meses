import { createClient } from "@supabase/supabase-js";
import type { ActivityRecord, AlcoholRecord } from "@/lib/types";
import { activityDedupKey } from "@/lib/dedupe";

type ActivityRow = {
  id: string;
  gymrats_check_in_id?: string | null;
  participant_gymrats_id?: string | null;
  participant: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number | null;
  points: number | null;
  calories: number | null;
  distance: number | null;
  team: string | null;
};

type AlcoholRow = {
  participant: string;
  week_key: string;
  status: AlcoholRecord["status"];
};

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeSupabaseUrl(rawUrl: string) {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
}

export function getSupabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceKey) {
    return null;
  }

  const url = normalizeSupabaseUrl(rawUrl);

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false
    }
  });
}

export function activityRowToRecord(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    participant: row.participant,
    date: row.activity_date,
    activityType: row.activity_type,
    durationMinutes: row.duration_minutes ?? undefined,
    points: row.points ?? undefined,
    calories: row.calories ?? undefined,
    distance: row.distance ?? undefined,
    team: row.team ?? undefined
  };
}

export function activityRecordToRow(record: ActivityRecord) {
  return {
    gymrats_check_in_id: record.id.startsWith("import-") || record.id.startsWith("mock-") ? null : record.id,
    participant: record.participant,
    activity_date: record.date,
    activity_type: record.activityType || "Atividade",
    duration_minutes: record.durationMinutes ?? null,
    points: record.points ?? null,
    calories: record.calories ?? null,
    distance: record.distance ?? null,
    team: record.team ?? null,
    dedup_key: activityDedupKey(record)
  };
}

export function alcoholRowToRecord(row: AlcoholRow): AlcoholRecord {
  return {
    participant: row.participant,
    weekKey: row.week_key,
    status: row.status
  };
}
