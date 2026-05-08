"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { buildOverallRanking, getParticipants, summarizeWeek, weekKeyFromDate } from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";
import { StatusBadge } from "@/components/StatusBadge";

export default function ParticipantsPage() {
  const { activities, participants: importedParticipants } = useChallengeData();
  const [query, setQuery] = useState("");
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
        <h1 className="mt-2 font-[var(--font-oswald)] text-5xl font-bold uppercase text-white">Participantes</h1>
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
            <article key={participant.name} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold text-black">
                    <UserRound size={22} />
                  </span>
                  <div>
                    <h2 className="font-bold text-white">{participant.name}</h2>
                    <p className="text-sm text-zinc-400">{participant.team ?? "Sem time"}</p>
                  </div>
                </div>
                {week ? <StatusBadge status={week.status} /> : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini label="Na semana" value={weeklyActivities} />
                <Mini label="No total" value={rank?.totalActivities ?? 0} />
                <Mini label="Streak" value={rank?.streak ?? 0} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Meta da semana</p>
                <WeeklyGoalDots activities={weeklyActivities} />
              </div>
            </article>
          );
        })}
      </section>
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
