import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "GYMRATS - Desafio 6 Meses",
  description: "Dashboard esportivo para acompanhar atividades e zero álcool do desafio GymRats."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
