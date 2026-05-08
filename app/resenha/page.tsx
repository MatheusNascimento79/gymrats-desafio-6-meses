"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, SendHorizonal, SmilePlus } from "lucide-react";
import { weekLabel } from "@/lib/challenge";
import { markChatMessagesRead } from "@/lib/chat-read";
import { useAuth } from "@/components/AuthGate";
import type { ChatMessage } from "@/lib/types";

export default function WeeklyChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [weekKey, setWeekKey] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentWeekLabel = useMemo(() => (weekKey ? weekLabel(weekKey) : ""), [weekKey]);

  async function loadMessages() {
    setError("");

    try {
      const response = await fetch("/api/chat", { cache: "no-store" });
      const payload = (await response.json()) as { configured?: boolean; weekKey?: string; messages?: ChatMessage[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel carregar a resenha.");
      }

      setWeekKey(payload.weekKey ?? "");
      setMessages(payload.messages ?? []);

      if (payload.configured === false) {
        setError("Configure o Supabase para liberar a resenha compartilhada entre aparelhos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar a resenha.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (user && weekKey && messages.length) {
      markChatMessagesRead(user.gymratsId, weekKey, messages);
    }
  }, [messages, user, weekKey]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: cleanMessage })
      });
      const payload = (await response.json()) as { message?: ChatMessage; error?: string };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? "Nao foi possivel enviar a mensagem.");
      }

      setMessages((current) => [...current, payload.message!]);
      setWeekKey(payload.message.weekKey);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-gold">Chat do desafio</p>
            <h1 className="mt-2 font-[var(--font-oswald)] text-4xl font-bold uppercase text-white sm:text-5xl">
              Resenha da semana
            </h1>
            <p className="mt-3 max-w-3xl text-zinc-300">
              Mensagens liberadas para a semana atual{currentWeekLabel ? `: ${currentWeekLabel}` : ""}. Ao virar a semana, o historico anterior e apagado.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-bold text-gold">
            <SmilePlus size={18} />
            Emojis aceitos
          </div>
        </div>
      </section>

      <section className="panel flex min-h-[520px] flex-col overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
            <MessageCircle className="text-gold" size={18} />
            {messages.length} mensagens
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!loaded ? <p className="text-zinc-400">Carregando resenha...</p> : null}

          {loaded && !messages.length ? (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
              <div>
                <MessageCircle className="mx-auto text-gold" size={32} />
                <p className="mt-3 font-bold text-white">Nenhuma resenha ainda.</p>
                <p className="mt-1 text-sm text-zinc-400">Manda a primeira mensagem da semana.</p>
              </div>
            </div>
          ) : null}

          {messages.map((item) => {
            const isMine = item.participant === user?.fullName;

            return (
              <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <article className={`max-w-[88%] rounded-lg border p-3 sm:max-w-[72%] ${isMine ? "border-gold/30 bg-gold/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className={isMine ? "font-bold text-gold" : "font-bold text-white"}>{item.participant}</span>
                    <span className="text-zinc-500">{formatMessageTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-100">{item.message}</p>
                </article>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-white/10 p-3 sm:p-4">
          {error ? <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Escreva a resenha da semana..."
              className="min-h-14 resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-gold/60"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendHorizonal size={18} />
              Enviar
            </button>
          </div>
          <p className="mt-2 text-right text-xs text-zinc-500">{message.length}/500</p>
        </form>
      </section>
    </div>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
