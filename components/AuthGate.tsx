"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dumbbell, LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/types";

type ParticipantOption = {
  gymratsId: string;
  fullName: string;
  role: string;
  hasPassword: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  refreshUser: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthGate");
  }
  return context;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const payload = (await response.json()) as { user: AuthUser | null };
    setUser(payload.user);
  }

  async function loadParticipants() {
    const response = await fetch("/api/participants", { cache: "no-store" });
    const payload = (await response.json()) as { participants: ParticipantOption[] };
    setParticipants(payload.participants ?? []);
  }

  useEffect(() => {
    Promise.all([refreshUser(), loadParticipants()]).finally(() => setLoaded(true));
  }, []);

  const value = useMemo(() => ({ user, refreshUser }), [user]);

  if (!loaded) {
    return <div className="mx-auto max-w-xl p-6 text-zinc-300">Carregando acesso...</div>;
  }

  if (!user) {
    return (
      <AuthContext.Provider value={value}>
        <LoginScreen participants={participants} onDone={refreshUser} />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function LoginScreen({ participants, onDone }: { participants: ParticipantOption[]; onDone: () => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "register" | "setup">("login");
  const [gymratsId, setGymratsId] = useState(participants[0]?.gymratsId ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const hasParticipants = participants.length > 0;
  const activeMode = hasParticipants ? mode : "setup";

  useEffect(() => {
    if (!gymratsId && participants[0]?.gymratsId) {
      setGymratsId(participants[0].gymratsId);
    }
  }, [gymratsId, participants]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const endpoint = activeMode === "setup" ? "/api/auth/setup" : activeMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body =
      activeMode === "setup"
        ? { password }
        : {
            gymratsId,
            password,
            confirmPassword
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Nao foi possivel entrar.");
      return;
    }

    await onDone();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <section className="panel w-full p-6 md:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-gold text-black">
          <Dumbbell size={28} />
        </span>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.28em] text-gold">GYMRATS</p>
        <h1 className="mt-2 font-[var(--font-oswald)] text-5xl font-bold uppercase text-white">Acesso do desafio</h1>
        <p className="mt-3 text-zinc-300">
          Escolha seu nome cadastrado no GymRats. No primeiro acesso, crie sua senha.
        </p>

        {!hasParticipants ? (
          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
            <p className="font-bold">Nenhum participante importado ainda.</p>
            <p className="mt-1 text-zinc-300">
              Entre no setup inicial com a senha de admin, depois importe obrigatoriamente <b>members.csv</b> e <b>check_ins.csv</b>.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("login")} className={mode === "login" ? "rounded-lg bg-gold px-4 py-2 font-bold text-black" : "rounded-lg border border-white/10 px-4 py-2 font-bold text-zinc-300"}>
                Entrar
              </button>
              <button type="button" onClick={() => setMode("register")} className={mode === "register" ? "rounded-lg bg-gold px-4 py-2 font-bold text-black" : "rounded-lg border border-white/10 px-4 py-2 font-bold text-zinc-300"}>
                Primeiro acesso
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMode("setup")}
              className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-bold text-gold"
            >
              Acesso super admin
            </button>
          </>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {activeMode !== "setup" ? (
            <select
              value={gymratsId}
              onChange={(event) => setGymratsId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold/60"
            >
              {participants.map((participant) => (
                <option key={participant.gymratsId} value={participant.gymratsId}>
                  {participant.fullName}
                </option>
              ))}
            </select>
          ) : null}

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={activeMode === "setup" ? "Senha de setup do super admin" : "Senha"}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-gold/60"
          />

          {activeMode === "register" ? (
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              placeholder="Confirmacao de senha"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-gold/60"
            />
          ) : null}

          {error ? <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p> : null}

          <button type="submit" className="w-full rounded-lg bg-gold px-4 py-3 font-black uppercase text-black hover:bg-yellow-300">
            {activeMode === "register" ? "Criar senha e entrar" : activeMode === "setup" ? "Entrar como super admin" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button type="button" onClick={logout} className="nav-link flex items-center gap-2">
      <LogOut size={16} />
      Sair
    </button>
  );
}
