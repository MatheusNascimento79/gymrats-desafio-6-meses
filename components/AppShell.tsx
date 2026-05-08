"use client";

import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Flame, Upload, Users } from "lucide-react";
import clsx from "clsx";
import { AuthGate, LogoutButton, useAuth } from "@/components/AuthGate";

const links = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/participantes", label: "Atletas", icon: Users },
  { href: "/zero-alcool", label: "Zero Alcool", icon: Flame },
  { href: "/publico", label: "Publico", icon: Dumbbell }
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
  const visibleLinks = links.filter((link) => link.href !== "/importar" || user?.isSuperAdmin);

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
                GYMRATS
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Desafio 6 Meses</span>
            </span>
          </a>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <a key={link.href} href={link.href} className={clsx("nav-link flex items-center gap-2", active && "nav-link-active")}>
                  <Icon size={16} />
                  {link.label}
                </a>
              );
            })}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
