"use client";

import { useState } from "react";
import Papa from "papaparse";
import { CheckCircle2, FileSpreadsheet, ShieldAlert, Trash2, UploadCloud, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthGate";
import { useChallengeData } from "@/components/useChallengeData";
import { isCheckInsFile, isMembersFile, mapCheckInsToActivities, type GymRatsCheckInRow, type GymRatsMemberRow } from "@/lib/gymrats-import";

type ImportMode = "replace" | "merge";

type ParsedGymRatsFiles = {
  members: GymRatsMemberRow[];
  checkIns: GymRatsCheckInRow[];
  detected: string[];
};

type ActivitiesResponse = {
  configured: boolean;
  records: ReturnType<typeof mapCheckInsToActivities>["records"];
};

async function parseCsv(file: File) {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(`${file.name}: ${parsed.errors[0].message}`);
  }

  return parsed.data;
}

export default function ImportPage() {
  const { user } = useAuth();
  const { setActivities } = useChallengeData();
  const [mode, setMode] = useState<ImportMode>("replace");
  const [files, setFiles] = useState<ParsedGymRatsFiles>({ members: [], checkIns: [], detected: [] });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user?.isSuperAdmin) {
    return (
      <section className="panel p-6">
        <ShieldAlert className="text-danger" size={32} />
        <h1 className="mt-3 font-[var(--font-oswald)] text-4xl font-bold uppercase text-white">Acesso restrito</h1>
        <p className="mt-2 text-zinc-300">Somente Matheus Nascimento, super admin, pode importar arquivos do GymRats.</p>
      </section>
    );
  }

  async function handleFiles(fileList?: FileList | null) {
    setError("");
    setMessage("");

    if (!fileList?.length) {
      return;
    }

    const next: ParsedGymRatsFiles = { members: [], checkIns: [], detected: [] };

    for (const file of Array.from(fileList)) {
      const rows = await parseCsv(file);
      const headers = Object.keys(rows[0] ?? {});

      if (isMembersFile(headers)) {
        next.members = rows as GymRatsMemberRow[];
        next.detected.push(`${file.name}: members.csv`);
      } else if (isCheckInsFile(headers)) {
        next.checkIns = rows as GymRatsCheckInRow[];
        next.detected.push(`${file.name}: check_ins.csv`);
      } else {
        next.detected.push(`${file.name}: ignorado`);
      }
    }

    setFiles(next);
  }

  async function importGymRats() {
    setError("");
    setMessage("");

    if (!files.members.length || !files.checkIns.length) {
      setError("Envie obrigatoriamente members.csv e check_ins.csv.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/import/gymrats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, members: files.members, checkIns: files.checkIns })
      });

      const payload = (await response.json()) as { error?: string; participants?: number; saved?: number; duplicates?: number };

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao importar arquivos GymRats.");
      }

      const mapped = mapCheckInsToActivities(files.members, files.checkIns);
      const activitiesResponse = await fetch("/api/activities", { cache: "no-store" });

      if (activitiesResponse.ok) {
        const activitiesPayload = (await activitiesResponse.json()) as ActivitiesResponse;
        setActivities(activitiesPayload.records ?? mapped.records);
      } else {
        setActivities(mapped.records);
      }

      setMessage(`${payload.participants} participantes importados. ${payload.saved} atividades salvas. ${payload.duplicates} duplicadas/ignoradas. Dados recarregados do servidor.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar arquivos GymRats.");
    } finally {
      setBusy(false);
    }
  }

  async function clearImportedData() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/import", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Erro ao limpar dados.");
      }

      setActivities([]);
      setMessage("Atividades removidas. Participantes e senhas foram mantidos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao limpar dados.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-7">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Importacao oficial</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-4xl font-bold uppercase text-white sm:text-5xl">Carregar exports GymRats</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">
          Suba sempre os arquivos obrigatorios <b>members.csv</b> e <b>check_ins.csv</b>. O primeiro define quem pode logar; o segundo alimenta as atividades.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-5">
          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gold/40 bg-gold/5 p-5 text-center transition hover:bg-gold/10 sm:min-h-64 sm:p-6">
            <UploadCloud className="text-gold" size={42} />
            <span className="mt-4 font-[var(--font-oswald)] text-xl font-bold uppercase text-white sm:text-2xl">Selecionar arquivos</span>
            <span className="mt-2 text-sm text-zinc-400">Obrigatorios: members.csv e check_ins.csv</span>
            <input
              className="hidden"
              type="file"
              accept=".csv"
              multiple
              onClick={(event) => {
                event.currentTarget.value = "";
              }}
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Modo de importacao</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(["replace", "merge"] as ImportMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                    mode === option ? "border-gold bg-gold text-black" : "border-white/10 bg-black/30 text-zinc-300 hover:border-gold/40"
                  }`}
                >
                  {option === "replace" ? "Substituir atividades" : "Mesclar sem duplicar"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-400">Participantes e senhas sao preservados. Atividades sao deduplicadas por ID do check-in.</p>
          </div>

          {error ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <XCircle size={18} />
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-victory/30 bg-victory/10 p-3 text-sm text-victory">
              <CheckCircle2 size={18} />
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy || !files.members.length || !files.checkIns.length}
            onClick={importGymRats}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={18} />
            Importar GymRats
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={clearImportedData}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-black uppercase text-danger transition hover:bg-danger/20"
          >
            <Trash2 size={18} />
            Limpar atividades
          </button>
        </div>

        <div className="panel p-5">
          <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">Arquivos detectados</h2>
          <div className="mt-4 grid gap-3">
            <FileStatus label="members.csv" count={files.members.length} required />
            <FileStatus label="check_ins.csv" count={files.checkIns.length} required />
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
            {files.detected.length ? files.detected.map((item) => <p key={item}>{item}</p>) : <p>Nenhum arquivo selecionado ainda.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function FileStatus({ label, count, required }: { label: string; count: number; required?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label} {required ? "(obrigatorio)" : ""}
      </p>
      <p className="mt-1 font-[var(--font-oswald)] text-3xl font-bold text-gold">{count}</p>
      <p className="text-sm text-zinc-400">{count ? "linhas detectadas" : "pendente"}</p>
    </div>
  );
}
