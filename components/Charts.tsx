"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
};

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <section className="panel p-4 md:p-5">
      <h2 className="font-[var(--font-oswald)] text-2xl font-bold uppercase text-white">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

export function WeeklyEvolutionChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="#ffffff12" />
        <XAxis dataKey="label" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
        <YAxis stroke="#a1a1aa" allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#111318", border: "1px solid #ffffff20", borderRadius: 8 }} />
        <Line type="monotone" dataKey="totalActivities" name="Atividades" stroke="#f5c542" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ParticipantBarChart({ data }: { data: Array<{ participant: string; totalActivities: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 20 }}>
        <CartesianGrid stroke="#ffffff12" horizontal={false} />
        <XAxis type="number" stroke="#a1a1aa" allowDecimals={false} />
        <YAxis dataKey="participant" type="category" stroke="#a1a1aa" width={110} tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#111318", border: "1px solid #ffffff20", borderRadius: 8 }} />
        <Bar dataKey="totalActivities" name="Atividades" fill="#f5c542" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompletionChart({
  data,
  dataKey = "completionRate",
  name = "Cumprimento %",
  fill = "#39d98a"
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  name?: string;
  fill?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="#ffffff12" />
        <XAxis dataKey="label" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
        <YAxis stroke="#a1a1aa" domain={[0, 100]} />
        <Tooltip contentStyle={{ background: "#111318", border: "1px solid #ffffff20", borderRadius: 8 }} />
        <Bar dataKey={dataKey} name={name} fill={fill} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
