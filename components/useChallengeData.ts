"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createMockActivities } from "@/data/mock";
import { hasSavedActivities, loadActivities, saveActivities } from "@/lib/storage";
import type { ActivityRecord, Participant } from "@/lib/types";

type ActivitiesResponse = {
  configured: boolean;
  records: ActivityRecord[];
  recordCount?: number;
  latestActivityDate?: string | null;
  error?: string;
};

type ParticipantsResponse = {
  participants: Array<{
    gymratsId: string;
    fullName: string;
    role: string;
    profilePictureUrl?: string;
  }>;
};

export function useChallengeData() {
  const [activities, setActivitiesState] = useState<ActivityRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [usingCentralData, setUsingCentralData] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [latestActivityDate, setLatestActivityDate] = useState<string | null>(null);
  const [dataError, setDataError] = useState("");

  const loadData = useCallback(async () => {
    const cacheBust = Date.now();

    try {
      const response = await fetch(`/api/activities?ts=${cacheBust}`, { cache: "no-store" });

      const payload = (await response.json()) as ActivitiesResponse;

      if (payload.configured) {
        const participantsResponse = await fetch(`/api/participants?ts=${cacheBust}`, { cache: "no-store" });
        const participantsPayload = (await participantsResponse.json()) as ParticipantsResponse;

        setActivitiesState(payload.records ?? []);
        setLatestActivityDate(payload.latestActivityDate ?? payload.records?.at(-1)?.date ?? null);
        setParticipants(
          (participantsPayload.participants ?? []).map((participant) => ({
            name: participant.fullName,
            gymratsId: participant.gymratsId,
            role: participant.role,
            profilePictureUrl: participant.profilePictureUrl
          }))
        );
        setUsingCentralData(true);
        setUsingMock(false);
        setDataError(payload.error ?? (!response.ok ? "API central indisponivel." : ""));
        return;
      }
    } catch {
      // Fall back to local demo mode when the API is unavailable in development.
    }

    const hasSavedData = hasSavedActivities();
    const stored = loadActivities();

    setActivitiesState(hasSavedData ? stored : createMockActivities());
    setLatestActivityDate(hasSavedData ? stored.at(-1)?.date ?? null : null);
    setParticipants([]);
    setUsingCentralData(false);
    setUsingMock(!hasSavedData);
    setDataError("");
  }, []);

  useEffect(() => {
    let active = true;

    loadData().finally(() => {
      if (active) {
        setLoaded(true);
      }
    });

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadData();
      }
    }

    window.addEventListener("focus", loadData);
    window.addEventListener("pageshow", loadData);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", loadData);
      window.removeEventListener("pageshow", loadData);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadData]);

  const setActivities = (records: ActivityRecord[]) => {
    setActivitiesState(records);
    setLatestActivityDate(records.at(-1)?.date ?? null);
    setUsingMock(false);
    saveActivities(records);
  };

  return useMemo(
    () => ({
      activities,
      participants,
      setActivities,
      loaded,
      usingMock,
      usingCentralData,
      latestActivityDate,
      dataError,
      reload: loadData
    }),
    [activities, participants, loaded, usingMock, usingCentralData, latestActivityDate, dataError, loadData]
  );
}
