"use client";

import { useEffect, useState } from "react";
import { Flame, ShieldCheck, Siren } from "lucide-react";
import { buildAlcoholStats, getParticipants, weekKeyFromDate, weekLabel } from "@/lib/challenge";
import { loadAlcoholRecords, saveAlcoholRecords } from "@/lib/storage";
import type { AlcoholRecord, AlcoholStatus } from "@/lib/types";
import { useChallengeData } from "@/components/useChallengeData";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/components/AuthGate";

const options: Array<{ value: AlcoholStatus; label: string }> = [
  { value: "ok", label: "Estou zerado" },
  { value: "broke", label: "Vish Bebi" }
];

const statusLabels: Record<AlcoholStatus, string> = {
  ok: "Estou zerado",
  broke: "Vish Bebi",
  unknown: "Nao informado"
};

export default function ZeroAlcoholPage() {
  const { activities, participants: importedParticipants } = useChallengeData();
  const { user } = useAuth();
  const participants = importedParticipants.length ? importedParticipants : getParticipants(activities);
  const currentWeekKey = weekKeyFromDate(new Date());
  const [records, setRecords] = useState<AlcoholRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        const response = await fetch(`/api/alcohol?weekKey=${currentWeekKey}`, { cache: "no-store" });

        if (response.ok) {
          const payload = (await response.json()) as { configured: boolean; records: AlcoholRecord[] };

          if (payload.configured) {
            if (active) {
              setRecords(payload.records);
            }
            return;
          }
        }
      } catch {
        // Fall back to local storage while Supabase is not configured.
      }

      if (active) {
        setRecords(loadAlcoholRecords());
      }
    }

    loadRecords();

    return () => {
      active = false;
    };
  }, [currentWeekKey]);

  const stats = buildAlcoholStats(records, participants, currentWeekKey);

  async function setStatus(participant: string, status: AlcoholStatus) {
    setError("");

    const current = records.find((record) => record.participant === participant && record.weekKey === currentWeekKey);

    if (!user?.isSuperAdmin && participant !== user?.fullName) {
      setError("Voce so pode alterar o seu proprio status.");
      return;
    }

    if (!user?.isSuperAdmin && current?.status === "broke" && status !== "broke") {
      setError("Status Vish Bebi fica travado ate virar a semana.");
      return;
    }

    const next = records.filter((record) => !(record.participant === participant && record.weekKey === currentWeekKey));
    next.push({ participant, weekKey: currentWeekKey, status, updatedAt: new Date().toISOString() });
    setRecords(next);
    saveAlcoholRecords(next);

    try {
      const response = await fetch("/api/alcohol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ participant, weekKey: currentWeekKey, status })
      });

      if (!response.ok && response.status !== 503) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Erro ao salvar status.");
      }
    } catch (err) {
      if (err instanceof Error && err.message !== "Failed to fetch") {
        setRecords(records);
        saveAlcoholRecords(records);
        setError(err.message);
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Compromisso paralelo</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-4xl font-bold uppercase text-white sm:text-5xl">Zero Alcool</h1>
        <p className="mt-3 text-zinc-300">
          {user?.isSuperAdmin ? "Controle geral manual por semana." : "Visualize todos e atualize somente o seu status semanal."} Semana atual:{" "}
          <span className="font-bold text-gold">{weekLabel(currentWeekKey)}</span>.
        </p>
        {error ? <p className="mt-3 text-sm font-semibold text-danger">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Adesao zero alcool" value={`${stats.adherence}%`} helper="Marcados como ok" icon={ShieldCheck} tone="green" />
        <StatCard label="Ok" value={stats.ok} helper="Mantiveram o combinado" icon={Flame} tone="gold" />
        <StatCard label="Quebrou" value={stats.broke} helper="Registrados na semana" icon={Siren} tone={stats.broke ? "red" : "green"} />
        <StatCard label="Nao informado" value={stats.unknown} helper="Aguardando status" icon={Flame} />
      </section>

      <section className="panel p-5">
        <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Controle semanal</h2>
        <div className="mt-4 hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-3">Atleta</th>
                <th>Status</th>
                <th>Atualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {stats.records.map((record) => (
                <tr key={record.participant}>
                  <td className="py-3 font-semibold text-white">{record.participant}</td>
                  <td className={record.status === "ok" ? "text-victory" : record.status === "broke" ? "text-danger" : "text-zinc-400"}>
                    {statusLabels[record.status]}
                    {record.status === "broke" && record.updatedAt ? (
                      <span className="ml-2 text-xs font-semibold text-zinc-400">em {formatBrokenDate(record.updatedAt)}</span>
                    ) : null}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const canEdit = user?.isSuperAdmin || record.participant === user?.fullName;
                        const locked = !user?.isSuperAdmin && record.status === "broke" && option.value !== "broke";

                        return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={!canEdit || locked}
                          onClick={() => setStatus(record.participant, option.value)}
                          className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {option.label}
                        </button>
                        );
                      })}
                    </div>
                    {!user?.isSuperAdmin && record.status === "broke" ? <p className="mt-2 text-xs font-semibold text-danger">Travado ate virar a semana.</p> : null}
                    {!user?.isSuperAdmin && record.participant !== user?.fullName ? <p className="mt-2 text-xs text-zinc-500">Somente {record.participant} pode alterar.</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {stats.records.map((record) => (
            <div key={record.participant} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">{record.participant}</span>
                <span className={record.status === "ok" ? "font-bold text-victory" : record.status === "broke" ? "font-bold text-danger" : "text-zinc-400"}>
                  {statusLabels[record.status]}
                  {record.status === "broke" && record.updatedAt ? (
                    <span className="ml-2 text-xs font-semibold text-zinc-400">em {formatBrokenDate(record.updatedAt)}</span>
                  ) : null}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {options.map((option) => {
                  const canEdit = user?.isSuperAdmin || record.participant === user?.fullName;
                  const locked = !user?.isSuperAdmin && record.status === "broke" && option.value !== "broke";

                  return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!canEdit || locked}
                    onClick={() => setStatus(record.participant, option.value)}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {option.label}
                  </button>
                  );
                })}
              </div>
              {!user?.isSuperAdmin && record.status === "broke" ? <p className="mt-2 text-xs font-semibold text-danger">Travado ate virar a semana.</p> : null}
              {!user?.isSuperAdmin && record.participant !== user?.fullName ? <p className="mt-2 text-xs text-zinc-500">Somente {record.participant} pode alterar.</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatBrokenDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}
