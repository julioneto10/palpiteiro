const BRT_TIMEZONE = "America/Sao_Paulo";

export function formatDateBRT(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    timeZone: BRT_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatTimeBRT(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", {
    timeZone: BRT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFullDateBRT(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    timeZone: BRT_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatDateGroupKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    timeZone: BRT_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function isMatchStarted(kickoffAt: string): boolean {
  return new Date(kickoffAt) <= new Date();
}

export function getTimeUntil(date: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const d = typeof date === "string" ? new Date(date) : date;
  const total = Math.max(0, d.getTime() - Date.now());
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  };
}
