"use client";

import { useEffect, useMemo, useState } from "react";
import { createMockActivities } from "@/data/mock";
import { hasSavedActivities, loadActivities, saveActivities } from "@/lib/storage";
import type { ActivityRecord } from "@/lib/types";

export function useChallengeData() {
  const [activities, setActivitiesState] = useState<ActivityRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    try {
      const hasSavedData = hasSavedActivities();
      const stored = loadActivities();
      setActivitiesState(hasSavedData ? stored : createMockActivities());
      setUsingMock(!hasSavedData);
    } finally {
      setLoaded(true);
    }
  }, []);

  const setActivities = (records: ActivityRecord[]) => {
    setActivitiesState(records);
    setUsingMock(false);
    saveActivities(records);
  };

  return useMemo(
    () => ({
      activities,
      setActivities,
      loaded,
      usingMock
    }),
    [activities, loaded, usingMock]
  );
}
