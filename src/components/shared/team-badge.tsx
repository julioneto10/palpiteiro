import type { Team } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: Team | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const FLAG_SIZE = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

export function TeamBadge({
  team,
  size = "md",
  showName = true,
  className,
}: TeamBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {team ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/flags/${team.code}.svg`}
          alt={team.name}
          className={cn(
            "shrink-0 rounded-full ring-1 ring-foreground/15 shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
            FLAG_SIZE[size]
          )}
        />
      ) : (
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-secondary font-heading font-bold text-muted-foreground ring-1 ring-foreground/10",
            FLAG_SIZE[size]
          )}
        >
          ?
        </span>
      )}
      {showName &&
        (team ? (
          <div className="min-w-0 leading-tight">
            <div className="font-heading text-sm font-extrabold tracking-wide">
              {team.code}
            </div>
            <div className="truncate text-[11px] font-medium text-muted-foreground">
              {team.name}
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            A definir
          </span>
        ))}
    </div>
  );
}
