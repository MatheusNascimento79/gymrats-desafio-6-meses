"use client";

import type { ActivityRecord, AlcoholRecord } from "@/lib/types";

const activitiesKey = "gymrats.activities";
const alcoholKey = "gymrats.alcohol";

export function loadActivities() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(activitiesKey);
    const parsed = raw ? (JSON.parse(raw) as ActivityRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveActivities(records: ActivityRecord[]) {
  window.localStorage.setItem(activitiesKey, JSON.stringify(records));
}

export function loadAlcoholRecords() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(alcoholKey);
    const parsed = raw ? (JSON.parse(raw) as AlcoholRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAlcoholRecords(records: AlcoholRecord[]) {
  window.localStorage.setItem(alcoholKey, JSON.stringify(records));
}
