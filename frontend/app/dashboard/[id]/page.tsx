"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ProjectDetail } from "@/lib/api";
import Navbar from "@/components/Navbar";
import SummaryPanel from "@/components/SummaryPanel";
import HealthScore from "@/components/HealthScore";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  async function loadProject() {
    try {
      const data = await api.getProject(Number(id));
      setProject(data);
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [id]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      await api.syncProject(Number(id));
      await loadProject();
      setSyncMsg("✓ Sincronizado com sucesso!");
      setTimeout(() => setSyncMsg(""), 4000);
    } catch (err: any) {
      setSyncMsg(err.message);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-4">
          <div className="h-10 bg-bg-card rounded-lg animate-pulse w-1/2" />
          <div className="h-48 bg-bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  const latest = project.summaries[0];
  const history = project.summaries.slice(1);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-secondary text-sm font-medium mb-6 hover:underline flex items-center gap-1"
        >
          ← Voltar para projetos
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
            {project.telegram_group_name && (
              <p className="text-sm text-gray-500 mt-0.5">
                Grupo Telegram: {project.telegram_group_name}
              </p>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-secondary hover:bg-teal-400 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {syncing ? "Sincronizando..." : "↻ Sincronizar Agora"}
          </button>
        </div>

        {syncMsg && (
          <div className="bg-teal-50 border border-secondary/30 text-secondary text-sm rounded-lg px-4 py-3 mb-5">
            {syncMsg}
          </div>
        )}

        {latest ? (
          <>
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 mb-5 flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saúde do Projeto</p>
                <HealthScore score={Math.round(latest.score_health)} statusColor={latest.status_color} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Última Interação</p>
                <p className="text-sm font-semibold text-gray-700">{latest.last_interaction}</p>
              </div>
              {latest.alert_critical && (
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                    ⚠ Alerta Crítico Ativo
                  </span>
                </div>
              )}
            </div>

            <h2 className="text-primary font-semibold text-sm uppercase tracking-wide mb-3">
              Análise desta Semana
            </h2>
            <SummaryPanel summary={latest} isLatest />

            {history.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary transition-colors mb-4"
                >
                  {showHistory ? "▾" : "▸"} Histórico de análises ({history.length})
                </button>
                {showHistory && (
                  <div className="space-y-4">
                    {history.map((s) => (
                      <SummaryPanel key={s.id} summary={s} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-bg-card rounded-xl">
            <p className="text-gray-400 mb-3">Nenhuma análise disponível ainda.</p>
            <p className="text-gray-400 text-sm">
              Clique em "Sincronizar Agora" para buscar as mensagens do Telegram e gerar a análise.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
