import { WeeklySummary } from "@/lib/api";
import HealthScore from "./HealthScore";
import { formatDate } from "@/lib/date";

interface SummaryPanelProps {
  summary: WeeklySummary;
  isLatest?: boolean;
}

function getPeriodLabel(weekStart: string, weekEnd: string): string {
  const days = Math.round(
    (new Date(weekEnd).getTime() - new Date(weekStart).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days >= 28) return "Resumo do Mês";
  if (days >= 12) return "Resumo das Últimas 2 Semanas";
  return "Resumo da Semana";
}

export default function SummaryPanel({ summary, isLatest = false }: SummaryPanelProps) {
  const weekStart = formatDate(summary.week_start);
  const weekEnd = formatDate(summary.week_end);
  const periodLabel = getPeriodLabel(summary.week_start, summary.week_end);

  return (
    <div
      className={`rounded-xl p-5 border ${
        isLatest ? "bg-bg-card border-secondary" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">
          {weekStart} → {weekEnd}
        </span>
        {isLatest && (
          <span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full font-medium">
            Atual
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <HealthScore score={Math.round(summary.score_health)} statusColor={summary.status_color} />
        {summary.alert_critical && (
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
            ⚠ Alerta Crítico
          </span>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Última Interação</p>
        <p className="text-sm font-medium text-gray-700">{summary.last_interaction}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{periodLabel}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{summary.summary_text}</p>
      </div>

      {summary.next_steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Próximos Passos</p>
          <ul className="space-y-1">
            {summary.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-secondary font-bold mt-0.5">→</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
