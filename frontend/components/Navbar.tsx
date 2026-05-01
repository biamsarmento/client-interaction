"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Navbar({ email }: { email?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  return (
    <nav className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight">Simplify</span>
        <span className="text-secondary font-medium text-sm">| Dashboard de Projetos</span>
      </div>
      <div className="flex items-center gap-4">
        {email && <span className="text-sm text-white/70">{email}</span>}
        <button
          onClick={handleLogout}
          className="bg-secondary hover:bg-teal-400 transition-colors text-white text-sm px-4 py-2 rounded-md font-medium"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
