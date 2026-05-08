import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "gold" | "green" | "red" | "neutral";
};

const tones = {
  gold: "text-gold bg-gold/10 border-gold/30",
  green: "text-victory bg-victory/10 border-victory/30",
  red: "text-danger bg-danger/10 border-danger/30",
  neutral: "text-zinc-200 bg-white/5 border-white/10"
};

export function StatCard({ label, value, helper, icon: Icon, tone = "neutral" }: StatCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className="mt-2 break-words font-[var(--font-oswald)] text-4xl font-bold text-white">{value}</p>
        </div>
        <span className={`shrink-0 rounded-lg border p-2 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
      {helper ? <p className="mt-3 text-sm text-zinc-400">{helper}</p> : null}
    </div>
  );
}
