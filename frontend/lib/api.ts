const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface WeeklySummary {
  id: number;
  summary_text: string;
  score_health: number;
  last_interaction: string;
  alert_critical: boolean;
  next_steps: string[];
  status_color: string;
  week_start: string;
  week_end: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  telegram_group_id: string;
  telegram_group_name: string | null;
  created_at: string;
  latest_summary: WeeklySummary | null;
}

export interface ProjectDetail extends Project {
  summaries: WeeklySummary[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erro desconhecido");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    return fetch(`${BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Credenciais inválidas");
      }
      return res.json();
    });
  },

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<{ id: number; email: string }>("/auth/me"),

  listProjects: () => request<Project[]>("/projects/"),

  getProject: (id: number) => request<ProjectDetail>(`/projects/${id}`),

  createProject: (name: string, telegram_group_id: string) =>
    request<{ id: number; name: string }>("/projects/", {
      method: "POST",
      body: JSON.stringify({ name, telegram_group_id }),
    }),

  deleteProject: (id: number) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),

  syncProject: (id: number) =>
    request<{ message: string }>(`/projects/${id}/sync`, { method: "POST" }),
};
