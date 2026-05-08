"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Flame, MessageCircle, Upload, Users } from "lucide-react";
import clsx from "clsx";
import { AuthGate, LogoutButton, useAuth } from "@/components/AuthGate";
import { chatReadEvent, getLastReadChatMessageId, markChatMessagesRead } from "@/lib/chat-read";
import type { ChatMessage } from "@/lib/types";

const links = [
  { href: "/", label: "D185", icon: Dumbbell },
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/participantes", label: "Atletas", icon: Users },
  { href: "/resenha", label: "Resenha", icon: MessageCircle },
  { href: "/zero-alcool", label: "Zero Alcool", icon: Flame }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AuthedShell>{children}</AuthedShell>
    </AuthGate>
  );
}

function AuthedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const visibleLinks = links.filter((link) => link.href !== "/importar" || user?.isSuperAdmin);

  useEffect(() => {
    if (!user) {
      setHasUnreadChat(false);
      return;
    }

    let active = true;
    const currentUser = user;

    async function refreshUnreadChat() {
      try {
        const response = await fetch("/api/chat", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { weekKey?: string; messages?: ChatMessage[] };
        const weekKey = payload.weekKey ?? "";
        const messages = payload.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        if (!active || !weekKey || !lastMessage) {
          if (active) {
            setHasUnreadChat(false);
          }
          return;
        }

        if (pathname === "/resenha") {
          markChatMessagesRead(currentUser.gymratsId, weekKey, messages);
          setHasUnreadChat(false);
          return;
        }

        setHasUnreadChat(getLastReadChatMessageId(currentUser.gymratsId, weekKey) !== lastMessage.id);
      } catch {
        if (active) {
          setHasUnreadChat(false);
        }
      }
    }

    refreshUnreadChat();

    const interval = window.setInterval(refreshUnreadChat, 45000);
    const onFocus = () => refreshUnreadChat();
    const onRead = () => setHasUnreadChat(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener(chatReadEvent, onRead);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(chatReadEvent, onRead);
    };
  }, [pathname, user]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-asphalt/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/40 bg-gold text-black">
              <Dumbbell size={24} strokeWidth={2.6} />
            </span>
            <span>
              <span className="block font-[var(--font-oswald)] text-3xl font-bold uppercase tracking-normal text-white">
                D185
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Desafio 6 Meses</span>
            </span>
          </a>

          <nav className="flex flex-wrap gap-2 pb-1 md:justify-end md:pb-0">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <a key={link.href} href={link.href} className={clsx("nav-link relative flex items-center gap-2", active && "nav-link-active")}>
                  <Icon size={16} />
                  {link.label}
                  {link.href === "/resenha" && hasUnreadChat && !active ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-asphalt bg-danger" aria-label="Mensagens nao lidas" />
                  ) : null}
                </a>
              );
            })}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
