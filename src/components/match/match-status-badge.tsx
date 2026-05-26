import type { MatchStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface MatchStatusBadgeProps {
  status: MatchStatus;
  minute?: number | null;
  className?: string;
}

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider";

export function MatchStatusBadge({ status, minute, className }: MatchStatusBadgeProps) {
  if (status === "live" || status === "half_time") {
    return (
      <span className={cn(base, "bg-destructive/10 text-destructive", className)}>
        <span className="live-dot" />
        {status === "half_time" ? "Intervalo" : minute ? `${minute}'` : "Ao vivo"}
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span className={cn(base, "bg-secondary text-secondary-foreground", className)}>
        Encerrado
      </span>
    );
  }
  if (status === "postponed") {
    return (
      <span className={cn(base, "bg-secondary text-muted-foreground", className)}>
        Adiado
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className={cn(base, "bg-destructive/15 text-destructive", className)}>
        Cancelado
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-primary/10 text-primary", className)}>
      Agendado
    </span>
  );
}
