import fs from "node:fs";
import Papa from "papaparse";
import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";

const file = fs.readFileSync("data/sample-gymrats-export.csv", "utf8");
const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });

if (parsed.errors.length) {
  throw new Error(parsed.errors[0].message);
}

const rows = parsed.data.map((row, index) => ({
  id: `sample-${index}`,
  participant: row.name,
  date: row.date,
  activityType: row.activity,
  team: row.team
}));

const currentDate = parseISO("2026-05-08");
const start = startOfWeek(currentDate, { weekStartsOn: 1 });
const end = endOfWeek(currentDate, { weekStartsOn: 1 });
const participants = [...new Set(rows.map((row) => row.participant))].sort();
const weekRows = rows.filter((row) => {
  const date = parseISO(row.date);
  return date >= start && date <= end;
});

const status = participants.map((participant) => {
  const activities = weekRows.filter((row) => row.participant === participant).length;
  return {
    participant,
    activities,
    missing: Math.max(3 - activities, 0),
    complete: activities >= 3
  };
});

const completed = status.filter((item) => item.complete).length;
const pending = participants.length - completed;

console.log(
  JSON.stringify(
    {
      records: rows.length,
      participants: participants.length,
      week: `${format(start, "yyyy-MM-dd")}..${format(end, "yyyy-MM-dd")}`,
      completed,
      pending,
      completionRate: Math.round((completed / participants.length) * 100),
      status
    },
    null,
    2
  )
);
