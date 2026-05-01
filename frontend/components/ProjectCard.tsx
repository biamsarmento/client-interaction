"use client";

import { useState } from "react";
import Link from "next/link";
import { Project, api } from "@/lib/api";
import HealthScore from "./HealthScore";

const PERIOD_OPTIONS = [
  { label: "Última semana", days: 7 },
  { label: "Últimas 2 semanas", days: 14 },
  { label: "Último mês", days: 30 },
];

interface ProjectCardProps {
  project: Project;
  onSynced: () => void;
  onDeleted: () => void;
}

export default function ProjectCard({ project, onSynced, onDeleted }: ProjectCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [selectedDays, setSelectedDays] = useState(7);

  const summary = project.latest_summary;

  async function handleSync(e: React.MouseEvent) {
    e.preventDefault();
    setSyncing(true);
    setSyncMsg("");
    try {
      await api.syncProject(project.id, selectedDays);
      setSyncMsg("✓ Sincronizado!");
      onSynced();
      setTimeout(() => setSyncMsg(""), 3000);
    } catch (err: any) {
      setSyncMsg(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteProject(project.id);
      onDeleted();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <Link href={`/dashboard/${project.id}`}>
      <div className="bg-bg-card rounded-xl p-5 border border-teal-100 hover:shadow-lg transition-shadow cursor-pointer relative">
        {summary?.alert_critical && (
          <span className="absolute top-3 right-3 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
            ⚠ Alerta
          </span>
        )}

        <h2 className="text-primary font-bold text-lg mb-1 pr-16 truncate">{project.name}</h2>

        {project.telegram_group_name && (
          <p className="text-xs text-gray-500 mb-3">
            Telegram: {project.telegram_group_name}
          </p>
        )}

        {summary ? (
          <>
            <div className="mb-3">
              <HealthScore score={Math.round(summary.score_health)} statusColor={summary.status_color} />
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Última interação: <span className="font-medium text-gray-700">{summary.last_interaction}</span>
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{summary.summary_text}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 italic mt-2">Nenhuma análise disponível ainda.</p>
        )}

        <div className="mt-4" onClick={(e) => e.preventDefault()}>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-600 mb-2 focus:outline-none focus:ring-1 focus:ring-secondary bg-white"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>{o.label}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 bg-secondary hover:bg-teal-400 disabled:opacity-60 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
            >
              {syncing ? "Sincronizando..." : "↻ Sincronizar"}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium py-2 px-3 rounded-md transition-colors"
            >
              Excluir
            </button>
          </div>

          {syncMsg && (
            <p className="text-xs text-center mt-2 text-secondary font-medium">{syncMsg}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
