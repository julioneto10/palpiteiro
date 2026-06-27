"use client";

import { useCountdown } from "@/lib/hooks/use-countdown";
import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREDICTION_CUTOFF_MS } from "@/lib/constants/scoring";

interface PredictionLockTimerProps {
  kickoffAt: string;
  className?: string;
}

export function PredictionLockTimer({
  kickoffAt,
  className,
}: PredictionLockTimerProps) {
  // Conta ate o corte (10 min antes do kickoff), nao ate o apito.
  const cutoff = new Date(
    new Date(kickoffAt).getTime() - PREDICTION_CUTOFF_MS
  ).toISOString();
  const { formatted, isExpired, total } = useCountdown(cutoff);

  const isUrgent = !isExpired && total < 1000 * 60 * 60; // less than 1 hour

  if (isExpired) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium text-destructive",
          className
        )}
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Palpites encerrados</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        isUrgent
          ? "text-destructive animate-pulse"
          : "text-muted-foreground",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>Fecha em {formatted}</span>
    </div>
  );
}
