import type { ActivityRecord } from "@/lib/types";

export type GymRatsMemberRow = {
  id: string;
  uuid: string;
  role: string;
  created_at: string;
  full_name: string;
  profile_picture_url?: string;
};

export type GymRatsCheckInRow = {
  id: string;
  title?: string;
  duration?: string;
  calories?: string;
  distance_miles?: string;
  duration_millis?: string;
  occurred_at: string;
  account_id: string;
};

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function isMembersFile(headers: string[]) {
  return ["id", "uuid", "role", "full_name"].every((header) => headers.includes(header));
}

export function isCheckInsFile(headers: string[]) {
  return ["id", "occurred_at", "account_id"].every((header) => headers.includes(header));
}

export function mapCheckInsToActivities(members: GymRatsMemberRow[], checkIns: GymRatsCheckInRow[]) {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const seen = new Set<string>();
  const records: ActivityRecord[] = [];
  let skipped = 0;

  checkIns.forEach((checkIn) => {
    if (!checkIn.id || seen.has(checkIn.id)) {
      skipped += 1;
      return;
    }

    const member = membersById.get(checkIn.account_id);
    const date = isoDate(checkIn.occurred_at);

    if (!member || !date) {
      skipped += 1;
      return;
    }

    seen.add(checkIn.id);
    records.push({
      id: checkIn.id,
      participant: member.full_name,
      date,
      activityType: checkIn.title?.trim() || "Check-in GymRats",
      durationMinutes: toNumber(checkIn.duration),
      calories: toNumber(checkIn.calories),
      distance: toNumber(checkIn.distance_miles),
      team: member.role
    });
  });

  return { records, skipped };
}
