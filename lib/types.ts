export type ActivityRecord = {
  id: string;
  participant: string;
  date: string;
  activityType: string;
  durationMinutes?: number;
  points?: number;
  calories?: number;
  distance?: number;
  team?: string;
};

export type Participant = {
  name: string;
  team?: string;
};

export type WeeklyStatus = "complete" | "almost" | "pending";

export type ParticipantWeek = {
  participant: string;
  team?: string;
  activities: number;
  missing: number;
  status: WeeklyStatus;
};

export type WeekSummary = {
  weekKey: string;
  label: string;
  start: string;
  end: string;
  totalActivities: number;
  completedParticipants: number;
  activeParticipants: number;
  completionRate: number;
};

export type AlcoholStatus = "ok" | "broke" | "unknown";

export type AlcoholRecord = {
  participant: string;
  weekKey: string;
  status: AlcoholStatus;
};

export type ColumnMapping = {
  participant: string[];
  date: string[];
  activityType: string[];
  durationMinutes: string[];
  points: string[];
  calories: string[];
  distance: string[];
  team: string[];
};

export type DateRangePreset = "current-week" | "month" | "challenge" | "custom";
