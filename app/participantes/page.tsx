"use client";

import { useMemo, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { buildOverallRanking, getParticipants, summarizeWeek, weekKeyFromDate } from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";
import { StatusBadge } from "@/components/StatusBadge";
import type { ActivityRecord } from "@/lib/types";

export default function ParticipantsPage() {
  const { activities, participants: importedParticipants } = useChallengeData();
  const [query, setQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const participants = importedParticipants.length ? importedParticipants : getParticipants(activities);
  const currentWeek = summarizeWeek(activities, participants, weekKeyFromDate(new Date()));
  const ranking = buildOverallRanking(activities, participants);

  const filtered = useMemo(
    () => participants.filter((participant) => participant.name.toLowerCase().includes(query.toLowerCase())),
    [participants, query]
  );

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Elenco do desafio</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-4xl font-bold uppercase text-white sm:text-5xl">Participantes</h1>
        <div className="mt-5 flex max-w-md items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <Search size={18} className="text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar atleta"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((participant) => {
          const week = currentWeek.find((item) => item.participant === participant.name);
          const rank = ranking.find((item) => item.participant === participant.name);
          const weeklyActivities = week?.activities ?? 0;

          return (
            <button
              key={participant.name}
              type="button"
              onClick={() => setSelectedParticipant(participant.name)}
              className="panel p-4 text-left transition hover:border-gold/40 hover:bg-steel/80"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold text-black">
                    <UserRound size={22} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-white">{participant.name}</h2>
                    {participant.team ? <p className="text-sm text-zinc-400">{participant.team}</p> : null}
                  </div>
                </div>
                {week ? <StatusBadge status={week.status} /> : null}
              </div>

              <div className="mt-4 grid gap-2 text-center min-[380px]:grid-cols-3">
                <Mini label="Na semana" value={weeklyActivities} />
                <Mini label="No total" value={rank?.totalActivities ?? 0} />
                <Mini label="Streak" value={rank?.streak ?? 0} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Meta da semana</p>
                <WeeklyGoalDots activities={weeklyActivities} />
              </div>
            </button>
          );
        })}
      </section>

      {selectedParticipant ? (
        <ActivityModal
          participant={selectedParticipant}
          activities={activities.filter((activity) => activity.participant === selectedParticipant)}
          onClose={() => setSelectedParticipant(null)}
        />
      ) : null}
    </div>
  );
}

function ActivityModal({ participant, activities, onClose }: { participant: string; activities: ActivityRecord[]; onClose: () => void }) {
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="panel max-h-[85vh] w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 md:p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold">Atividades</p>
            <h2 className="mt-1 break-words font-[var(--font-oswald)] text-2xl font-bold uppercase text-white sm:text-3xl">{participant}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:text-white" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 md:p-5">
          {sorted.length ? (
            <div className="space-y-2">
              {sorted.map((activity) => (
                <div key={activity.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                  <span className="font-bold text-gold">{activity.date}</span>
                  <span className="font-semibold text-white">{activity.activityType}</span>
                  <span className="text-sm text-zinc-400">
                    {activity.durationMinutes ? `${activity.durationMinutes} min` : ""}
                    {activity.distance ? `${activity.durationMinutes ? " · " : ""}${activity.distance} km` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-zinc-400">Nenhuma atividade registrada para este participante.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WeeklyGoalDots({ activities }: { activities: number }) {
  const completed = Math.min(activities, 3);
  const plus = activities >= 4;

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {[0, 1, 2].map((index) => {
        const filled = index < completed;
        const pending = activities === 0;

        return (
          <span
            key={index}
            title={`${activities} atividades na semana`}
            className={`h-8 flex-1 rounded ${filled ? "bg-victory" : pending ? "bg-danger/80" : "bg-amberline"}`}
          />
        );
      })}
      {plus ? <span className="pl-1 font-[var(--font-oswald)] text-3xl font-bold leading-none text-victory">+</span> : null}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <p className="font-[var(--font-oswald)] text-2xl font-bold text-gold">{value}</p>
      <p className="text-xs uppercase text-zinc-500">{label}</p>
    </div>
  );
}
