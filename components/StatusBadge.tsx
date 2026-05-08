import clsx from "clsx";
import type { WeeklyStatus } from "@/lib/types";

const labels: Record<WeeklyStatus, string> = {
  complete: "Completo",
  almost: "Quase la",
  pending: "Pendente"
};

const styles: Record<WeeklyStatus, string> = {
  complete: "border-victory/40 bg-victory/10 text-victory",
  almost: "border-amberline/40 bg-amberline/10 text-amberline",
  pending: "border-danger/40 bg-danger/10 text-danger"
};

export function StatusBadge({ status }: { status: WeeklyStatus }) {
  return (
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide", styles[status])}>
      {labels[status]}
    </span>
  );
}
