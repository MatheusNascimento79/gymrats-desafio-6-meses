"use client";

import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud, XCircle } from "lucide-react";
import { parseActivityFile } from "@/lib/importer";
import { useChallengeData } from "@/components/useChallengeData";
import type { ActivityRecord } from "@/lib/types";

export default function ImportPage() {
  const { setActivities } = useChallengeData();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [resolved, setResolved] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleFile(file?: File) {
    if (!file) {
      return;
    }

    setError("");
    setSaved(false);

    try {
      const result = await parseActivityFile(file);
      setRecords(result.records);
      setHeaders(result.headers);
      setResolved(result.resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar arquivo.");
      setRecords([]);
    }
  }

  function confirmImport() {
    setActivities(records);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Importacao oficial</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-5xl font-bold uppercase text-white">Carregar export GymRats Pro</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Envie CSV, XLS ou XLSX exportado oficialmente. O MVP roda localmente no navegador e salva os dados no localStorage deste dispositivo.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-5">
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gold/40 bg-gold/5 p-6 text-center transition hover:bg-gold/10">
            <UploadCloud className="text-gold" size={42} />
            <span className="mt-4 font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Selecionar arquivo</span>
            <span className="mt-2 text-sm text-zinc-400">CSV, XLS ou XLSX</span>
            <input className="hidden" type="file" accept=".csv,.xls,.xlsx" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>

          {error ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <XCircle size={18} />
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-victory/30 bg-victory/10 p-3 text-sm text-victory">
              <CheckCircle2 size={18} />
              Dados importados com sucesso.
            </div>
          ) : null}

          <button
            type="button"
            disabled={!records.length}
            onClick={confirmImport}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={18} />
            Confirmar importacao
          </button>
        </div>

        <div className="panel p-5">
          <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Mapeamento detectado</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(resolved).map(([field, column]) => (
              <div key={field} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{field}</p>
                <p className="mt-1 font-semibold text-white">{column ?? "Nao detectado"}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-zinc-400">
            Colunas encontradas: {headers.length ? headers.join(", ") : "nenhum arquivo carregado ainda"}.
          </p>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Previa dos dados normalizados</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-3">Atleta</th>
                <th>Data</th>
                <th>Atividade</th>
                <th>Minutos</th>
                <th>Pontos</th>
                <th>Calorias</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {records.slice(0, 12).map((record) => (
                <tr key={record.id}>
                  <td className="py-3 font-semibold text-white">{record.participant}</td>
                  <td>{record.date}</td>
                  <td>{record.activityType}</td>
                  <td>{record.durationMinutes ?? "-"}</td>
                  <td>{record.points ?? "-"}</td>
                  <td>{record.calories ?? "-"}</td>
                  <td>{record.team ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length ? <p className="py-8 text-center text-zinc-500">A previa aparece aqui depois do upload.</p> : null}
        </div>
      </section>
    </div>
  );
}
