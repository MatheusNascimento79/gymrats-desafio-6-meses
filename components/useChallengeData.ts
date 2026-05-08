"use client";

import { useEffect, useMemo, useState } from "react";
import { createMockActivities } from "@/data/mock";
import { hasSavedActivities, loadActivities, saveActivities } from "@/lib/storage";
import type { ActivityRecord, Participant } from "@/lib/types";

type ActivitiesResponse = {
  configured: boolean;
  records: ActivityRecord[];
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

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch("/api/activities", { cache: "no-store" });

        if (response.ok) {
          const payload = (await response.json()) as ActivitiesResponse;

          if (payload.configured) {
            const participantsResponse = await fetch("/api/participants", { cache: "no-store" });
            const participantsPayload = (await participantsResponse.json()) as ParticipantsResponse;

            if (!active) {
              return;
            }

            setActivitiesState(payload.records);
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
            return;
          }
        }
      } catch {
        // Fall back to local demo mode when the API is unavailable in development.
      }

      const hasSavedData = hasSavedActivities();
      const stored = loadActivities();

      if (!active) {
        return;
      }

      setActivitiesState(hasSavedData ? stored : createMockActivities());
      setParticipants([]);
      setUsingCentralData(false);
      setUsingMock(!hasSavedData);
    }

    loadData().finally(() => {
      if (active) {
        setLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const setActivities = (records: ActivityRecord[]) => {
    setActivitiesState(records);
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
      usingCentralData
    }),
    [activities, participants, loaded, usingMock, usingCentralData]
  );
}
