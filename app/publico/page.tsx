"use client";

import { Activity, Flame, Trophy } from "lucide-react";
import { buildOverallRanking, getParticipants, summarizeWeek, weekKeyFromDate, weeklyGoal } from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";

export default function PublicPage() {
  const { activities } = useChallengeData();
  const participants = getParticipants(activities);
  const week = summarizeWeek(activities, participants, weekKeyFromDate(new Date()));
  const completed = week.filter((item) => item.activities >= weeklyGoal).length;
  const rate = participants.length ? Math.round((completed / participants.length) * 100) : 0;
  const ranking = buildOverallRanking(activities, participants).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="min-h-[520px] overflow-hidden rounded-lg border border-gold/30 bg-[linear-gradient(145deg,rgba(245,197,66,0.24),rgba(8,9,11,0.86)_42%,rgba(8,9,11,1)),url('https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center p-6 md:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Placar oficial</p>
          <h1 className="mt-3 font-[var(--font-oswald)] text-6xl font-bold uppercase leading-none text-white md:text-8xl">
            GYMRATS
          </h1>
          <p className="mt-4 max-w-2xl text-xl font-semibold text-zinc-200">
            Desafio 6 Meses: 3 atividades por semana, zero alcool e consistencia ate o fim.
          </p>
          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <PublicMetric icon={Activity} label="Meta semanal" value={`${rate}%`} />
            <PublicMetric icon={Flame} label="Em dia" value={`${completed}/${participants.length}`} />
            <PublicMetric icon={Trophy} label="Lider" value={ranking[0]?.participant.split(" ")[0] ?? "-"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-[var(--font-oswald)] text-3xl font-bold uppercase text-white">Quem falta fechar a semana</h2>
          <div className="mt-4 space-y-2">
            {week
              .filter((item) => item.activities < weeklyGoal)
              .map((item) => (
                <div key={item.participant} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <span className="font-semibold text-white">{item.participant}</span>
                  <span className="font-bold text-amberline">faltam {item.missing}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="font-[var(--font-oswald)] text-3xl font-bold uppercase text-white">Top 5 do desafio</h2>
          <div className="mt-4 space-y-2">
            {ranking.map((item, index) => (
              <div key={item.participant} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <span className="font-[var(--font-oswald)] text-2xl font-bold text-gold">#{index + 1}</span>
                <span className="font-semibold text-white">{item.participant}</span>
                <span className="font-bold text-zinc-200">{item.totalActivities} ativ.</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
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
