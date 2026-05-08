"use client";

import { Activity, Flame, Trophy } from "lucide-react";
import { buildOverallRanking, getParticipants, summarizeWeek, weekKeyFromDate, weeklyGoal } from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";

export function PublicD185Page() {
  const { activities, participants: importedParticipants } = useChallengeData();
  const participants = importedParticipants.length ? importedParticipants : getParticipants(activities);
  const week = summarizeWeek(activities, participants, weekKeyFromDate(new Date()));
  const completed = week.filter((item) => item.activities >= weeklyGoal).length;
  const rate = participants.length ? Math.round((completed / participants.length) * 100) : 0;
  const overallRanking = buildOverallRanking(activities, participants).slice(0, 5);
  const weekRanking = [...week].sort((a, b) => b.activities - a.activities || a.participant.localeCompare(b.participant)).slice(0, 5);
  const pending = week.filter((item) => item.activities < weeklyGoal);

  return (
    <div className="space-y-6">
      <section className="min-h-[440px] overflow-hidden rounded-lg border border-gold/30 bg-[linear-gradient(145deg,rgba(245,197,66,0.24),rgba(8,9,11,0.86)_42%,rgba(8,9,11,1)),url('https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center p-5 sm:min-h-[520px] md:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Placar oficial</p>
          <h1 className="mt-3 font-[var(--font-oswald)] text-5xl font-bold uppercase leading-none text-white sm:text-6xl md:text-8xl">
            D185
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold text-zinc-200 sm:text-xl">
            Desafio 6 Meses: 3 atividades por semana, zero alcool e consistencia ate o fim.
          </p>
          <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PublicMetric icon={Activity} label="Meta semanal" value={`${rate}%`} />
            <PublicMetric icon={Flame} label="Pessoas em dia" value={`${completed}/${participants.length}`} />
            <PublicMetric icon={Trophy} label="Lider Geral" value={overallRanking[0]?.participant.split(" ")[0] ?? "-"} />
            <PublicMetric icon={Trophy} label="Lider da Semana" value={weekRanking[0]?.participant.split(" ")[0] ?? "-"} />
          </div>
        </div>
      </section>

      <RankingPanel
        title="Top 5 da semana"
        rows={weekRanking.map((item) => ({ participant: item.participant, value: item.activities, suffix: "ativ." }))}
      />

      <RankingPanel
        title="Top 5 geral"
        rows={overallRanking.map((item) => ({ participant: item.participant, value: item.totalActivities, suffix: "ativ." }))}
      />

      <section className="panel p-5">
        <h2 className="font-[var(--font-oswald)] text-3xl font-bold uppercase text-white">Quem falta fechar a semana</h2>
        <div className="mt-4 space-y-2">
          {pending.length ? (
            pending.map((item) => (
              <div key={item.participant} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="font-semibold text-white">{item.participant}</span>
                <span className="font-bold text-amberline">faltam {item.missing}</span>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-victory/30 bg-victory/10 p-4 font-semibold text-victory">
              Todo mundo fechou a semana.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function RankingPanel({ title, rows }: { title: string; rows: Array<{ participant: string; value: number; suffix: string }> }) {
  return (
    <section className="panel p-5">
      <h2 className="font-[var(--font-oswald)] text-3xl font-bold uppercase text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.map((item, index) => (
            <div key={item.participant} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[42px_1fr_auto] sm:items-center sm:gap-3">
              <span className="font-[var(--font-oswald)] text-2xl font-bold text-gold">#{index + 1}</span>
              <span className="font-semibold text-white">{item.participant}</span>
              <span className="font-bold text-zinc-200 sm:text-right">
                {item.value} {item.suffix}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-zinc-400">Sem dados ainda.</p>
        )}
      </div>
    </section>
  );
}

function PublicMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/45 p-4">
      <Icon className="text-gold" size={22} />
      <p className="mt-3 font-[var(--font-oswald)] text-4xl font-bold text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}
