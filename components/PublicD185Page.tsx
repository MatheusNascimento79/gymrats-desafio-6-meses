"use client";

import { useEffect, useState } from "react";
import { Activity, Flame, Trophy } from "lucide-react";
import { buildOverallRanking, buildZeroAlcoholRanking, getParticipants, summarizeWeek, weekKeyFromDate, weeklyGoal } from "@/lib/challenge";
import { useChallengeData } from "@/components/useChallengeData";
import type { AlcoholRecord } from "@/lib/types";

export function PublicD185Page() {
  const { activities, participants: importedParticipants, loaded, latestActivityDate, dataError } = useChallengeData();
  const [alcoholRecords, setAlcoholRecords] = useState<AlcoholRecord[]>([]);
  const participants = importedParticipants.length ? importedParticipants : getParticipants(activities);
  const currentWeekKey = weekKeyFromDate(new Date());
  const week = summarizeWeek(activities, participants, currentWeekKey);
  const completed = week.filter((item) => item.activities >= weeklyGoal).length;
  const rate = participants.length ? Math.round((completed / participants.length) * 100) : 0;
  const overallRanking = buildOverallRanking(activities, participants).slice(0, 5);
  const weekRanking = [...week].sort((a, b) => b.activities - a.activities || a.participant.localeCompare(b.participant)).slice(0, 5);
  const zeroAlcoholRanking = buildZeroAlcoholRanking(alcoholRecords, participants).slice(0, 10);
  const pending = week.filter((item) => item.activities < weeklyGoal);
  const currentWeekHasNoLoadedActivity = Boolean(latestActivityDate && latestActivityDate < currentWeekKey);

  useEffect(() => {
    let active = true;

    async function loadAlcohol() {
      try {
        const response = await fetch("/api/alcohol", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { records: AlcoholRecord[] };
        if (active) {
          setAlcoholRecords(payload.records ?? []);
        }
      } catch {
        if (active) {
          setAlcoholRecords([]);
        }
      }
    }

    loadAlcohol();

    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return <div className="panel p-6 text-zinc-300">Carregando placar D185...</div>;
  }

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

      {dataError ? (
        <FreshnessNotice tone="danger" text={`Nao foi possivel carregar os dados centrais: ${dataError}`} />
      ) : currentWeekHasNoLoadedActivity ? (
        <FreshnessNotice
          tone="warning"
          text={`Ultima atividade carregada: ${formatDate(latestActivityDate!)}. A semana atual comecou em ${formatDate(currentWeekKey)}, entao os indicadores semanais ficam zerados ate entrar um check-in desta semana.`}
        />
      ) : latestActivityDate ? (
        <FreshnessNotice tone="neutral" text={`Dados carregados ate ${formatDate(latestActivityDate)}.`} />
      ) : null}

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

      <RankingPanel
        title="Zero Alcool Geral (dias Zero direto)"
        rows={zeroAlcoholRanking.map((item) => ({ participant: item.participant, value: item.currentStreak, suffix: "dias" }))}
      />
    </div>
  );
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function FreshnessNotice({ text, tone }: { text: string; tone: "neutral" | "warning" | "danger" }) {
  const classes =
    tone === "danger"
      ? "border-danger/30 bg-danger/10 text-danger"
      : tone === "warning"
        ? "border-gold/35 bg-gold/10 text-gold"
        : "border-white/10 bg-white/[0.03] text-zinc-300";

  return <p className={`rounded-lg border p-4 text-sm font-semibold ${classes}`}>{text}</p>;
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
