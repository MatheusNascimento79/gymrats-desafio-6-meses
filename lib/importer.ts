"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { defaultColumnMapping, resolveColumn } from "@/lib/column-mapping";
import type { ActivityRecord, ColumnMapping } from "@/lib/types";

type RawRow = Record<string, unknown>;

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(value).replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const asDate = new Date(String(value));
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toISOString().slice(0, 10);
  }

  const parts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }

  return "";
}

export function normalizeRows(rows: RawRow[], mapping: ColumnMapping = defaultColumnMapping) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const resolved = {
    participant: resolveColumn(headers, mapping.participant),
    date: resolveColumn(headers, mapping.date),
    activityType: resolveColumn(headers, mapping.activityType),
    durationMinutes: resolveColumn(headers, mapping.durationMinutes),
    points: resolveColumn(headers, mapping.points),
    calories: resolveColumn(headers, mapping.calories),
    distance: resolveColumn(headers, mapping.distance),
    team: resolveColumn(headers, mapping.team)
  };

  const records = rows
    .map((row, index): ActivityRecord | null => {
      const participant = resolved.participant ? String(row[resolved.participant] ?? "").trim() : "";
      const date = resolved.date ? parseDate(row[resolved.date]) : "";

      if (!participant || !date) {
        return null;
      }

      return {
        id: `import-${index}-${participant}-${date}`,
        participant,
        date,
        activityType: resolved.activityType ? String(row[resolved.activityType] ?? "Atividade").trim() : "Atividade",
        durationMinutes: resolved.durationMinutes ? parseNumber(row[resolved.durationMinutes]) : undefined,
        points: resolved.points ? parseNumber(row[resolved.points]) : undefined,
        calories: resolved.calories ? parseNumber(row[resolved.calories]) : undefined,
        distance: resolved.distance ? parseNumber(row[resolved.distance]) : undefined,
        team: resolved.team ? String(row[resolved.team] ?? "").trim() || undefined : undefined
      };
    })
    .filter((record): record is ActivityRecord => Boolean(record));

  return { records, resolved, headers };
}

export async function parseActivityFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parsed.errors.length) {
      throw new Error(parsed.errors[0].message);
    }

    return normalizeRows(parsed.data);
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: "" });
    return normalizeRows(rows);
  }

  throw new Error("Formato não suportado. Envie CSV, XLS ou XLSX.");
}
