"use client";

import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, LockKeyhole, Trash2, UploadCloud, XCircle } from "lucide-react";
import { parseActivityFile } from "@/lib/importer";
import { useChallengeData } from "@/components/useChallengeData";
import { dedupeActivities, mergeActivities } from "@/lib/dedupe";
import type { ActivityRecord } from "@/lib/types";

type ImportMode = "replace" | "merge";

const importerPassword = "12344321567";

export default function ImportPage() {
  const { activities, setActivities } = useChallengeData();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [resolved, setResolved] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<ImportMode>("replace");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);

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
    if (mode === "replace") {
      const result = dedupeActivities(records);
      setActivities(result.records);
      setMessage(`${result.records.length} atividades salvas. ${result.duplicates} duplicadas removidas do arquivo.`);
    } else {
      const result = mergeActivities(activities, records);
      setActivities(result.records);
      setMessage(`${result.added} novas atividades adicionadas. ${result.duplicates} duplicadas ignoradas.`);
    }

    setSaved(true);
  }

  function clearImportedData() {
    setActivities([]);
    setRecords([]);
    setHeaders([]);
    setResolved({});
    setMessage("Dados importados removidos deste navegador. Recarregue o dashboard para voltar aos dados demonstrativos ou importe a base real.");
    setSaved(true);
  }

  function unlockImporter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password === importerPassword) {
      setAuthorized(true);
      return;
    }

    setError("Senha incorreta.");
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-xl">
        <section className="panel p-5 md:p-7">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <LockKeyhole size={24} />
          </span>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-gold">Acesso restrito</p>
          <h1 className="mt-2 font-[var(--font-oswald)] text-5xl font-bold uppercase text-white">Importar dados</h1>
          <p className="mt-3 text-zinc-300">Digite a senha de importacao para carregar ou limpar arquivos do desafio.</p>

          <form onSubmit={unlockImporter} className="mt-6 space-y-4">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              inputMode="numeric"
              placeholder="Senha"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-gold/60"
            />

            {error ? (
              <div className="flex gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                <XCircle size={18} />
                {error}
              </div>
            ) : null}

            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-black uppercase text-black transition hover:bg-yellow-300">
              <LockKeyhole size={18} />
              Entrar
            </button>
          </form>
        </section>
      </div>
    );
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

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Modo de importacao</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                  mode === "replace" ? "border-gold bg-gold text-black" : "border-white/10 bg-black/30 text-zinc-300 hover:border-gold/40"
                }`}
              >
                Substituir base
              </button>
              <button
                type="button"
                onClick={() => setMode("merge")}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                  mode === "merge" ? "border-gold bg-gold text-black" : "border-white/10 bg-black/30 text-zinc-300 hover:border-gold/40"
                }`}
              >
                Mesclar sem duplicar
              </button>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Substituir e melhor para exports completos. Mesclar adiciona novas atividades e ignora duplicadas por atleta, data, tipo e duracao.
            </p>
          </div>

          {error ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <XCircle size={18} />
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-victory/30 bg-victory/10 p-3 text-sm text-victory">
              <CheckCircle2 size={18} />
              {message || "Dados importados com sucesso."}
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

          <button
            type="button"
            onClick={clearImportedData}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-black uppercase text-danger transition hover:bg-danger/20"
          >
            <Trash2 size={18} />
            Limpar dados importados
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
