"use client";

import { Activity, AlertTriangle, Flame, Medal, Target, Trophy, Users } from "lucide-react";
import {
  buildActivityTypeDistribution,
  buildOverallRanking,
  buildWeekSummaries,
  getInsights,
  getParticipants,
  summarizeWeek,
  weekKeyFromDate,
  weeklyGoal
} from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ActivityTypeChart, ChartCard, CompletionChart, ParticipantBarChart, WeeklyEvolutionChart } from "@/components/Charts";

export default function DashboardPage() {
  const { activities, loaded, usingMock } = useChallengeData();
  const participants = getParticipants(activities);
  const currentWeekKey = weekKeyFromDate(new Date());
  const currentWeek = summarizeWeek(activities, participants, currentWeekKey);
  const completed = currentWeek.filter((item) => item.activities >= weeklyGoal).length;
  const pending = Math.max(participants.length - completed, 0);
  const completionRate = participants.length ? Math.round((completed / participants.length) * 100) : 0;
  const collectiveDone = participants.length > 0 && pending === 0;
  const overallRanking = buildOverallRanking(activities, participants);
  const weekRanking = [...currentWeek].sort((a, b) => b.activities - a.activities);
  const weeks = buildWeekSummaries(activities, participants);
  const insights = getInsights(activities, participants);
  const activityTypes = buildActivityTypeDistribution(activities);

  if (!loaded) {
    return <div className="panel p-6 text-zinc-300">Carregando desafio...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-gold/30 bg-[linear-gradient(135deg,rgba(245,197,66,0.22),rgba(17,19,24,0.92)_38%,rgba(8,9,11,0.98))] p-5 shadow-glow md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Disciplina semanal</p>
            <h1 className="mt-3 font-[var(--font-oswald)] text-5xl font-bold uppercase leading-none text-white md:text-7xl">
              Todos bateram 3 atividades?
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-zinc-300">
              Semana de segunda a domingo. A meta coletiva so fecha quando todos os atletas ativos chegam a 3 treinos.
            </p>
            {usingMock ? (
              <p className="mt-4 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                Exibindo dados mockados ate o primeiro import oficial.
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-5 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Status da semana</p>
            <p className="mt-3 font-[var(--font-oswald)] text-7xl font-bold text-gold">{completionRate}%</p>
            <p className={`mt-2 text-xl font-black ${collectiveDone ? "text-victory" : "text-amberline"}`}>
              {collectiveDone ? "Meta coletiva batida" : "Ainda faltam atletas"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Atletas em dia" value={completed} helper={`${participants.length} participantes ativos`} icon={Target} tone="green" />
        <StatCard label="Pendentes" value={pending} helper="Precisam treinar antes de domingo" icon={AlertTriangle} tone={pending ? "red" : "green"} />
        <StatCard label="Atividades totais" value={activities.length} helper="No desafio carregado" icon={Activity} tone="gold" />
        <StatCard label="Adesao media" value={`${insights.averageAdherence}%`} helper="Media semanal do grupo" icon={Users} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="panel p-4 md:p-5">
          <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Status semanal por atleta</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-3">Atleta</th>
                  <th>Atividades</th>
                  <th>Faltam</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {currentWeek.map((item) => (
                  <tr key={item.participant} className="text-sm">
                    <td className="py-3 font-semibold text-white">{item.participant}</td>
                    <td className="font-bold text-gold">{item.activities}</td>
                    <td className="text-zinc-300">{item.missing}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4 md:p-5">
          <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Insights automaticos</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <Insight icon={Trophy} label="Melhor semana" value={insights.bestWeek ? `${insights.bestWeek.label}: ${insights.bestWeek.totalActivities} atividades` : "Sem dados"} />
            <Insight icon={Medal} label="Mais consistente" value={insights.mostConsistent ? `${insights.mostConsistent.participant}, ${insights.mostConsistent.completedWeeks} semanas completas` : "Sem dados"} />
            <Insight icon={Activity} label="Maior evolucao" value={insights.biggestEvolution ? `${insights.biggestEvolution.participant}, delta ${insights.biggestEvolution.delta}` : "Sem dados"} />
            <Insight icon={Flame} label="Em risco" value={insights.atRisk.length ? insights.atRisk.map((item) => item.participant).join(", ") : "Ninguem em risco agora"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Ranking title="Ranking geral" rows={overallRanking.slice(0, 8)} fields={["totalActivities", "completedWeeks", "streak"]} />
        <Ranking title="Ranking da semana" rows={weekRanking} fields={["activities", "missing"]} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Evolucao semanal do grupo">
          <WeeklyEvolutionChart data={weeks} />
        </ChartCard>
        <ChartCard title="Atividades por participante">
          <ParticipantBarChart data={overallRanking} />
        </ChartCard>
        <ChartCard title="Cumprimento da meta por semana">
          <CompletionChart data={weeks} />
        </ChartCard>
        <ChartCard title="Distribuicao por tipo">
          <ActivityTypeChart data={activityTypes} />
        </ChartCard>
      </section>
    </div>
  );
}

function Insight({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <Icon className="mt-0.5 text-gold" size={18} />
      <p>
        <span className="block font-bold text-white">{label}</span>
        {value}
      </p>
    </div>
  );
}

function Ranking({ title, rows, fields }: { title: string; rows: Array<Record<string, string | number | undefined>>; fields: string[] }) {
  return (
    <div className="panel p-4 md:p-5">
      <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.participant}-${index}`} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="font-[var(--font-oswald)] text-2xl font-bold text-gold">#{index + 1}</span>
            <span className="font-semibold text-white">{row.participant}</span>
            <span className="text-right text-sm text-zinc-300">
              {fields.map((field) => (
                <span key={field} className="ml-3">
                  <b className="text-white">{row[field] ?? 0}</b> {field === "totalActivities" || field === "activities" ? "ativ." : field === "completedWeeks" ? "sem." : field}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
