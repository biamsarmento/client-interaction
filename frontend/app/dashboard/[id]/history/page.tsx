"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { api, ProjectDetail, WeeklySummary } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatDate, formatShortDate } from "@/lib/date";

function getPeriodLabel(weekStart: string, weekEnd: string): string {
  const days = Math.round(
    (new Date(weekEnd).getTime() - new Date(weekStart).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days >= 28) return "Mês";
  if (days >= 12) return "2 Semanas";
  return "Semana";
}

function ScoreBadge({ score, color }: { score: number; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shrink-0"
      style={{ backgroundColor: color }}
    >
      {score}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-primary mb-1">{label}</p>
      <p style={{ color: d.color }} className="font-bold">Score: {d.score}/5</p>
      {d.alert && <p className="text-red-500 text-xs mt-1">⚠ Alerta crítico</p>}
    </div>
  );
}

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProject(Number(id))
      .then(setProject)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-4">
          <div className="h-8 bg-bg-card rounded animate-pulse w-1/3" />
          <div className="h-64 bg-bg-card rounded-xl animate-pulse" />
          <div className="h-40 bg-bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  // Ordena do mais antigo para o mais recente para o gráfico
  const sorted = [...project.summaries].sort(
    (a, b) => new Date(a.week_end).getTime() - new Date(b.week_end).getTime()
  );

  const chartData = sorted.map((s) => ({
    label: formatShortDate(s.week_end),
    score: s.score_health,
    color: s.status_color,
    alert: s.alert_critical,
  }));

  // Do mais recente para o mais antigo na timeline
  const timeline = [...project.summaries].sort(
    (a, b) => new Date(b.week_end).getTime() - new Date(a.week_end).getTime()
  );

  const avgScore =
    sorted.length > 0
      ? (sorted.reduce((acc, s) => acc + s.score_health, 0) / sorted.length).toFixed(1)
      : "—";

  const alerts = sorted.filter((s) => s.alert_critical).length;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="text-secondary text-sm font-medium mb-6 hover:underline flex items-center gap-1"
        >
          ← Voltar para o projeto
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Histórico completo da relação com o cliente</p>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-20 bg-bg-card rounded-xl">
            <p className="text-gray-400">Nenhuma análise registrada ainda.</p>
            <p className="text-gray-400 text-sm mt-1">Sincronize o projeto para gerar a primeira análise.</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{sorted.length}</p>
                <p className="text-xs text-gray-500 mt-1">Análises realizadas</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold" style={{ color: "#02bbb6" }}>{avgScore}</p>
                <p className="text-xs text-gray-500 mt-1">Score médio</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{alerts}</p>
                <p className="text-xs text-gray-500 mt-1">Alertas críticos</p>
              </div>
            </div>

            {/* Gráfico de evolução */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
              <h2 className="text-primary font-semibold text-sm uppercase tracking-wide mb-5">
                Evolução do Score de Saúde
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#02bbb6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#02bbb6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#02bbb6"
                    strokeWidth={2.5}
                    fill="url(#scoreGradient)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={payload.alert ? "#ef4444" : "#02bbb6"}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 text-center mt-2">
                Linha vermelha tracejada = limite de alerta crítico (score 2)
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-primary font-semibold text-sm uppercase tracking-wide mb-5">
                Timeline de Análises
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-teal-100" />
                <div className="space-y-6">
                  {timeline.map((s, i) => (
                    <div key={s.id} className="relative pl-12">
                      <div className="absolute left-0 top-1">
                        <ScoreBadge score={Math.round(s.score_health)} color={s.status_color} />
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-primary bg-bg-card px-2 py-0.5 rounded-full">
                              {getPeriodLabel(s.week_start, s.week_end)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(s.week_start)} → {formatDate(s.week_end)}
                            </span>
                            {i === 0 && (
                              <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-medium">
                                Mais recente
                              </span>
                            )}
                          </div>
                          {s.alert_critical && (
                            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full shrink-0">
                              ⚠ Alerta
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mb-2">
                          Última interação: <span className="text-gray-600 font-medium">{s.last_interaction}</span>
                        </p>

                        <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.summary_text}</p>

                        {s.next_steps.length > 0 && (
                          <ul className="space-y-1">
                            {s.next_steps.map((step, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-xs text-gray-500">
                                <span className="text-secondary font-bold mt-0.5">→</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
