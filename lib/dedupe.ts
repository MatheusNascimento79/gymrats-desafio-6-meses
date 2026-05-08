import type { ActivityRecord } from "@/lib/types";

function normalizeValue(value: string | number | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function activityDedupKey(record: ActivityRecord) {
  return [
    normalizeValue(record.participant),
    normalizeValue(record.date),
    normalizeValue(record.activityType),
    normalizeValue(record.durationMinutes)
  ].join("|");
}

export function dedupeActivities(records: ActivityRecord[]) {
  const seen = new Set<string>();
  const deduped: ActivityRecord[] = [];
  let duplicates = 0;

  records.forEach((record) => {
    const key = activityDedupKey(record);

    if (seen.has(key)) {
      duplicates += 1;
      return;
    }

    seen.add(key);
    deduped.push(record);
  });

  return {
    records: deduped,
    duplicates
  };
}

export function mergeActivities(existing: ActivityRecord[], incoming: ActivityRecord[]) {
  const existingKeys = new Set(existing.map(activityDedupKey));
  const fresh: ActivityRecord[] = [];
  let duplicates = 0;

  incoming.forEach((record) => {
    const key = activityDedupKey(record);

    if (existingKeys.has(key)) {
      duplicates += 1;
      return;
    }

    existingKeys.add(key);
    fresh.push(record);
  });

  return {
    records: [...existing, ...fresh],
    added: fresh.length,
    duplicates
  };
}
