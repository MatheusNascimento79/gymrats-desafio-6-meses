import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  metadataBase: new URL("https://project-4g67n.vercel.app"),
  title: "D185 - Desafio 6 Meses",
  description: "Painel esportivo do D185 para acompanhar atividades, zero alcool, rankings e a evolucao do desafio.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  },
  openGraph: {
    title: "D185 - Desafio 6 Meses",
    description: "Acompanhe o placar oficial, rankings e status semanal do D185.",
    url: "/",
    siteName: "D185",
    images: [
      {
        url: "/d185-share.png",
        width: 1254,
        height: 1254,
        alt: "D185 - Desafio 6 Meses"
      }
    ],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "D185 - Desafio 6 Meses",
    description: "Acompanhe o placar oficial, rankings e status semanal do D185.",
    images: ["/d185-share.png"]
  }
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
