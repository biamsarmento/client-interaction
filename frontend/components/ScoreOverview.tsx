"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Project } from "@/lib/api";

interface ScoreOverviewProps {
  projects: Project[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-primary mb-1">{d.name}</p>
      <p style={{ color: d.color }} className="font-bold">Score: {d.score}/5</p>
      <p className="text-gray-400 text-xs mt-1">{d.lastInteraction}</p>
      {d.alert && <p className="text-red-500 text-xs mt-1">⚠ Alerta crítico</p>}
    </div>
  );
}

export default function ScoreOverview({ projects }: ScoreOverviewProps) {
  const withSummary = projects.filter((p) => p.latest_summary);
  if (withSummary.length === 0) return null;

  const data = withSummary.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name,
    fullName: p.name,
    score: p.latest_summary!.score_health,
    color: p.latest_summary!.status_color,
    alert: p.latest_summary!.alert_critical,
    lastInteraction: p.latest_summary!.last_interaction,
  }));

  const avg = (data.reduce((acc, d) => acc + d.score, 0) / data.length).toFixed(1);
  const alerts = data.filter((d) => d.alert).length;
  const best = data.reduce((a, b) => (a.score > b.score ? a : b));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-primary font-bold text-base">Visão Geral dos Projetos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Score de saúde atual por projeto</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-secondary">{avg}</p>
            <p className="text-xs text-gray-400">Média geral</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-xl font-bold text-red-500">{alerts}</p>
            <p className="text-xs text-gray-400">Alertas</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-xl font-bold text-primary truncate max-w-[80px]">{best.name}</p>
            <p className="text-xs text-gray-400">Melhor score</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={data.length > 6 ? 260 : 200}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -25, bottom: data.length > 5 ? 30 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            angle={data.length > 5 ? -30 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
          />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f9f9" }} />
          <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 text-center mt-1">
        Linha vermelha tracejada = limite de alerta (score 2)
      </p>
    </div>
  );
}
