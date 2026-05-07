const SP_LOCALE = "pt-BR";
const SP_TZ = "America/Sao_Paulo";

// Garante que strings sem sufixo de fuso (vindas do SQLite) sejam tratadas como UTC
function toUtc(iso: string): Date {
  const normalized = /[Z+]/.test(iso) ? iso : iso + "Z";
  return new Date(normalized);
}

export function formatDate(iso: string): string {
  return toUtc(iso).toLocaleDateString(SP_LOCALE, { timeZone: SP_TZ });
}

export function formatDateTime(iso: string): string {
  return toUtc(iso).toLocaleString(SP_LOCALE, {
    timeZone: SP_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(iso: string): string {
  return toUtc(iso).toLocaleDateString(SP_LOCALE, {
    timeZone: SP_TZ,
    day: "2-digit",
    month: "short",
  });
}
