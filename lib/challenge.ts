import {
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  subDays,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityRecord, AlcoholRecord, Participant, ParticipantWeek, WeekSummary } from "@/lib/types";

export const weeklyGoal = 3;

export function toDate(value: string) {
  return parseISO(value);
}

export function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function weekKeyFromDate(date: Date) {
  return format(getWeekStart(date), "yyyy-MM-dd");
}

export function weekLabel(weekKey: string) {
  const start = parseISO(weekKey);
  const end = getWeekEnd(start);
  return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM", { locale: ptBR })}`;
}

export function getParticipants(records: ActivityRecord[]): Participant[] {
  const map = new Map<string, Participant>();

  records.forEach((record) => {
    if (!map.has(record.participant)) {
      map.set(record.participant, {
        name: record.participant,
        team: record.team
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function filterByRange(records: ActivityRecord[], start: Date, end: Date) {
  return records.filter((record) => isWithinInterval(toDate(record.date), { start, end }));
}

export function getCurrentWeekRange(referenceDate = new Date()) {
  return {
    start: getWeekStart(referenceDate),
    end: getWeekEnd(referenceDate)
  };
}

export function getMonthRange(referenceDate = new Date()) {
  return {
    start: startOfMonth(referenceDate),
    end: endOfMonth(referenceDate)
  };
}

export function getChallengeRange(records: ActivityRecord[]) {
  if (!records.length) {
    return getCurrentWeekRange();
  }

  const dates = records.map((record) => toDate(record.date)).sort((a, b) => a.getTime() - b.getTime());
  return {
    start: getWeekStart(dates[0]),
    end: getWeekEnd(dates[dates.length - 1])
  };
}

export function getWeekKeysBetween(start: Date, end: Date) {
  const keys: string[] = [];
  let cursor = getWeekStart(start);
  const last = getWeekStart(end);

  while (!isAfter(cursor, last)) {
    keys.push(format(cursor, "yyyy-MM-dd"));
    cursor = addWeeks(cursor, 1);
  }

  return keys;
}

export function summarizeWeek(records: ActivityRecord[], participants: Participant[], weekKey: string): ParticipantWeek[] {
  const start = parseISO(weekKey);
  const end = getWeekEnd(start);
  const weekRecords = filterByRange(records, start, end);

  return participants.map((participant) => {
    const activities = weekRecords.filter((record) => record.participant === participant.name).length;
    const missing = Math.max(weeklyGoal - activities, 0);
    const status = activities >= weeklyGoal ? "complete" : activities === weeklyGoal - 1 ? "almost" : "pending";

    return {
      participant: participant.name,
      team: participant.team,
      activities,
      missing,
      status
    };
  });
}

export function buildWeekSummaries(records: ActivityRecord[], participants = getParticipants(records)): WeekSummary[] {
  const range = getChallengeRange(records);

  return getWeekKeysBetween(range.start, range.end).map((weekKey) => {
    const week = summarizeWeek(records, participants, weekKey);
    const totalActivities = week.reduce((sum, item) => sum + item.activities, 0);
    const completedParticipants = week.filter((item) => item.activities >= weeklyGoal).length;
    const activeParticipants = participants.length;

    return {
      weekKey,
      label: weekLabel(weekKey),
      start: weekKey,
      end: format(getWeekEnd(parseISO(weekKey)), "yyyy-MM-dd"),
      totalActivities,
      completedParticipants,
      activeParticipants,
      completionRate: activeParticipants ? Math.round((completedParticipants / activeParticipants) * 100) : 0
    };
  });
}

export function buildOverallRanking(records: ActivityRecord[], participants = getParticipants(records)) {
  const weekSummaries = buildWeekSummaries(records, participants);

  return participants
    .map((participant) => {
      const participantRecords = records.filter((record) => record.participant === participant.name);
      const totalActivities = participantRecords.length;
      const completedWeeks = weekSummaries.filter((week) => {
        const count = filterByRange(participantRecords, parseISO(week.start), parseISO(week.end)).length;
        return count >= weeklyGoal;
      }).length;

      let currentStreak = 0;
      let bestStreak = 0;

      weekSummaries.forEach((week) => {
        const count = filterByRange(participantRecords, parseISO(week.start), parseISO(week.end)).length;
        if (count >= weeklyGoal) {
          currentStreak += 1;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      return {
        participant: participant.name,
        team: participant.team,
        totalActivities,
        completedWeeks,
        streak: currentStreak,
        bestStreak
      };
    })
    .sort((a, b) => b.totalActivities - a.totalActivities || b.completedWeeks - a.completedWeeks);
}

export function buildActivityTypeDistribution(records: ActivityRecord[]) {
  const map = new Map<string, number>();

  records.forEach((record) => {
    map.set(record.activityType, (map.get(record.activityType) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getInsights(records: ActivityRecord[], participants = getParticipants(records)) {
  const weeks = buildWeekSummaries(records, participants);
  const ranking = buildOverallRanking(records, participants);
  const currentWeekKey = weekKeyFromDate(new Date());
  const currentWeek = summarizeWeek(records, participants, currentWeekKey);

  const bestWeek = weeks.reduce<WeekSummary | undefined>(
    (best, week) => (!best || week.totalActivities > best.totalActivities ? week : best),
    undefined
  );
  const mostConsistent = [...ranking].sort((a, b) => b.completedWeeks - a.completedWeeks || b.bestStreak - a.bestStreak)[0];

  const dailyStreak = buildDailyStreakRanking(records, participants)[0];

  const atRisk = currentWeek
    .filter((item) => item.activities < weeklyGoal)
    .sort((a, b) => b.missing - a.missing || a.participant.localeCompare(b.participant));

  const averageAdherence = weeks.length
    ? Math.round(weeks.reduce((sum, week) => sum + week.completionRate, 0) / weeks.length)
    : 0;

  return {
    bestWeek,
    mostConsistent,
    dailyStreak,
    bestSingleDay: getBestSingleDay(records),
    atRisk,
    averageAdherence
  };
}

export function getBestSingleDay(records: ActivityRecord[]) {
  const map = new Map<string, { participant: string; date: string; count: number }>();

  records.forEach((record) => {
    const key = `${record.participant}|${record.date}`;
    const current = map.get(key);
    map.set(key, {
      participant: record.participant,
      date: record.date,
      count: (current?.count ?? 0) + 1
    });
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))[0];
}

export function getBestAlcoholWeek(records: AlcoholRecord[], participants: Participant[]) {
  const map = new Map<string, number>();

  records.forEach((record) => {
    if (record.status === "ok") {
      map.set(record.weekKey, (map.get(record.weekKey) ?? 0) + 1);
    }
  });

  const best = Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  if (!best) {
    return undefined;
  }

  return {
    weekKey: best[0],
    label: weekLabel(best[0]),
    ok: best[1],
    adherence: participants.length ? Math.round((best[1] / participants.length) * 100) : 0
  };
}

export function buildDailyStreakRanking(records: ActivityRecord[], participants = getParticipants(records)) {
  const today = new Date();

  return participants
    .map((participant) => {
      const participantDays = new Set(
        records
          .filter((record) => record.participant === participant.name)
          .map((record) => format(toDate(record.date), "yyyy-MM-dd"))
      );

      let streak = 0;
      let cursor = today;

      while (participantDays.has(format(cursor, "yyyy-MM-dd"))) {
        streak += 1;
        cursor = subDays(cursor, 1);
      }

      if (streak === 0 && participantDays.size) {
        const latest = Array.from(participantDays).sort().at(-1);
        if (latest) {
          streak = 1;
          cursor = subDays(parseISO(latest), 1);

          while (participantDays.has(format(cursor, "yyyy-MM-dd"))) {
            streak += 1;
            cursor = subDays(cursor, 1);
          }
        }
      }

      return {
        participant: participant.name,
        streak,
        daysSinceLastActivity: participantDays.size
          ? differenceInCalendarDays(today, parseISO(Array.from(participantDays).sort().at(-1)!))
          : null
      };
    })
    .sort((a, b) => b.streak - a.streak || (a.daysSinceLastActivity ?? 999) - (b.daysSinceLastActivity ?? 999));
}

export function buildAlcoholStats(records: AlcoholRecord[], participants: Participant[], weekKey: string) {
  const weekRecords = participants.map((participant) => {
    const found = records.find((record) => record.participant === participant.name && record.weekKey === weekKey);
    return {
      participant: participant.name,
      status: found?.status ?? "unknown"
    };
  });

  const ok = weekRecords.filter((record) => record.status === "ok").length;
  const broke = weekRecords.filter((record) => record.status === "broke").length;
  const unknown = weekRecords.filter((record) => record.status === "unknown").length;

  return {
    records: weekRecords,
    ok,
    broke,
    unknown,
    adherence: participants.length ? Math.round((ok / participants.length) * 100) : 0
  };
}

export function isChallengeStarted(records: ActivityRecord[]) {
  const range = getChallengeRange(records);
  return !isBefore(new Date(), range.start);
}

export function weeksElapsed(records: ActivityRecord[]) {
  const range = getChallengeRange(records);
  return Math.max(1, differenceInCalendarWeeks(new Date(), range.start, { weekStartsOn: 1 }) + 1);
}
