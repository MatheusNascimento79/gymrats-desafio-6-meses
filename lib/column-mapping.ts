import type { ColumnMapping } from "@/lib/types";

export const defaultColumnMapping: ColumnMapping = {
  participant: ["name", "participant", "user", "athlete", "nome", "atleta", "usuario"],
  date: ["date", "activity_date", "workout_date", "data", "data_atividade", "dia"],
  activityType: ["activity", "workout", "type", "atividade", "treino", "tipo", "modalidade"],
  durationMinutes: ["duration", "minutes", "duration_minutes", "duracao", "minutos", "tempo"],
  points: ["points", "score", "pontos", "pontuacao"],
  calories: ["calories", "kcal", "calorias"],
  distance: ["distance", "distancia", "km", "quilometragem"],
  team: ["team", "grupo", "time", "equipe"]
};

export function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolveColumn(headers: string[], candidates: string[]) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header)
  }));

  const normalizedCandidates = candidates.map(normalizeHeader);
  const direct = normalizedHeaders.find((header) => normalizedCandidates.includes(header.normalized));

  if (direct) {
    return direct.original;
  }

  return normalizedHeaders.find((header) =>
    normalizedCandidates.some((candidate) => header.normalized.includes(candidate))
  )?.original;
}
