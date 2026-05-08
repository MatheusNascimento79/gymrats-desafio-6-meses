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
  { value: "ok", label: "Estou zero" },
  { value: "broke", label: "Vishh Bebi" }
];

const statusLabels: Record<AlcoholStatus, string> = {
  ok: "Estou zero",
  broke: "Vishh Bebi",
  unknown: "Nao informado"
};

export default function ZeroAlcoholPage() {
  const { activities, participants: importedParticipants } = useChallengeData();
  const { user } = useAuth();
  const participants = user?.isSuperAdmin ? (importedParticipants.length ? importedParticipants : getParticipants(activities)) : user ? [{ name: user.fullName, role: user.role }] : [];
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

    const next = records.filter((record) => !(record.participant === participant && record.weekKey === currentWeekKey));
    next.push({ participant, weekKey: currentWeekKey, status });
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
        setError(err.message);
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Compromisso paralelo</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-5xl font-bold uppercase text-white">Zero Alcool</h1>
        <p className="mt-3 text-zinc-300">
          {user?.isSuperAdmin ? "Controle geral manual por semana." : "Atualize somente o seu status semanal."} Semana atual:{" "}
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(record.participant, option.value)}
                          className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold text-zinc-200 transition hover:border-gold/40 hover:text-gold"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
