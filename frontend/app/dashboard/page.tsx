"use client";

import { useEffect, useState } from "react";
import { api, Project } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import ScoreOverview from "@/components/ScoreOverview";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadData() {
    try {
      const [me, projs] = await Promise.all([api.me(), api.listProjects()]);
      setUserEmail(me.email);
      setProjects(projs);
    } catch {
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await api.createProject(newName.trim(), newGroupId.trim());
      setNewName("");
      setNewGroupId("");
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const alertCount = projects.filter((p) => p.latest_summary?.alert_critical).length;

  return (
    <div className="min-h-screen">
      <Navbar email={userEmail} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Projetos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {projects.length} projeto{projects.length !== 1 ? "s" : ""}
              {alertCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">
                  · {alertCount} com alerta
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-teal-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Novo Projeto
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-secondary/30 rounded-xl p-5 mb-6 shadow-sm"
          >
            <h2 className="text-primary font-semibold mb-4">Adicionar Projeto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Ex: App Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID ou Username do Grupo Telegram
                </label>
                <input
                  type="text"
                  required
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Ex: @meugrupo ou -1001234567"
                />
              </div>
            </div>
            {formError && (
              <p className="text-red-500 text-sm mb-3">{formError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-secondary hover:bg-teal-400 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {creating ? "Criando..." : "Criar Projeto"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!loading && <ScoreOverview projects={projects} />}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-card rounded-xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nenhum projeto cadastrado.</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Novo Projeto" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onSynced={loadData}
                onDeleted={loadData}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
