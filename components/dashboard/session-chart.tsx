"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SessionChartProps {
  data: {
    date: string;
    title: string;
    label: string;
    total: number;
    hadir: number;
  }[];
}

export function SessionChart({ data }: SessionChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fd-border)" />
          <XAxis
            dataKey="title"
            tick={{ fill: "var(--color-fd-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-fd-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-fd-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-fd-border)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-fd-card)",
              border: "1px solid var(--color-fd-border)",
              borderRadius: "8px",
              color: "var(--color-fd-foreground)",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-fd-border bg-fd-card p-3 shadow-md">
                    <p className="font-medium text-fd-foreground">{data.title}</p>
                    <p className="text-sm text-fd-muted-foreground">{data.label}</p>
                    <p className="mt-2 text-sm text-fd-success">Hadir: {data.hadir}</p>
                    <p className="text-sm text-fd-muted-foreground">Total: {data.total}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="hadir"
            stroke="var(--color-fd-success)"
            strokeWidth={2}
            dot={{ fill: "var(--color-fd-success)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--color-fd-success)" }}
            name="Hadir"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
