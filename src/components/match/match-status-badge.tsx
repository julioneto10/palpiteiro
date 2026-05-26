import { Badge } from "@/components/ui/badge";
import type { MatchStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "AGENDADO",
    className: "bg-muted text-muted-foreground",
  },
  live: {
    label: "AO VIVO",
    className: "bg-destructive text-white animate-pulse",
  },
  half_time: {
    label: "INTERVALO",
    className: "bg-warning text-warning-foreground",
  },
  finished: {
    label: "ENCERRADO",
    className: "bg-muted text-muted-foreground",
  },
  postponed: {
    label: "ADIADO",
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "CANCELADO",
    className: "bg-destructive/20 text-destructive",
  },
};

interface MatchStatusBadgeProps {
  status: MatchStatus;
  className?: string;
}

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
