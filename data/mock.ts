import { addDays, formatISO, startOfWeek, subWeeks } from "date-fns";
import type { ActivityRecord } from "@/lib/types";

const names = [
  "Matheus Nascimento",
  "Ana Rocha",
  "Bruno Costa",
  "Camila Torres",
  "Diego Martins",
  "Fernanda Lima",
  "Joao Pedro",
  "Marina Alves"
];

const activityTypes = ["Musculacao", "Corrida", "Bike", "Funcional", "Natacao"];

const weeklyPattern = [
  [4, 3, 5, 2, 4, 3, 1, 4],
  [3, 3, 4, 3, 5, 2, 3, 4],
  [5, 4, 4, 3, 3, 3, 4, 5],
  [2, 3, 3, 1, 4, 3, 2, 3],
  [4, 5, 6, 3, 4, 4, 3, 5],
  [3, 2, 4, 3, 5, 3, 3, 4],
  [5, 4, 5, 4, 4, 5, 2, 6],
  [3, 3, 4, 2, 4, 3, 3, 5]
];

export function createMockActivities(referenceDate = new Date()): ActivityRecord[] {
  const currentWeek = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const records: ActivityRecord[] = [];

  weeklyPattern.forEach((week, weekIndex) => {
    const weekStart = subWeeks(currentWeek, weeklyPattern.length - 1 - weekIndex);

    names.forEach((name, participantIndex) => {
      const count = week[participantIndex];

      for (let activityIndex = 0; activityIndex < count; activityIndex += 1) {
        const dayOffset = (activityIndex * 2 + participantIndex) % 7;
        const date = addDays(weekStart, dayOffset);
        const type = activityTypes[(activityIndex + participantIndex + weekIndex) % activityTypes.length];

        records.push({
          id: `mock-${weekIndex}-${participantIndex}-${activityIndex}`,
          participant: name,
          date: formatISO(date, { representation: "date" }),
          activityType: type,
          durationMinutes: 35 + ((activityIndex + participantIndex) % 4) * 10,
          points: 10 + activityIndex * 3,
          calories: 180 + participantIndex * 18 + activityIndex * 35,
          distance: type === "Corrida" || type === "Bike" ? 3 + activityIndex * 1.4 : undefined,
          team: participantIndex % 2 === 0 ? "Alpha" : "Bravo"
        });
      }
    });
  });

  return records;
}
