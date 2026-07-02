import { MatchCard } from "./match-card";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";
import { formatDateGroupKey } from "@/lib/utils/date";

interface MatchListProps {
  matches: MatchWithTeams[];
  predictions?: Record<string, Prediction>;
}

export function MatchList({ matches, predictions }: MatchListProps) {
  // Group matches by date
  const grouped = matches.reduce<Record<string, MatchWithTeams[]>>(
    (acc, match) => {
      const key = formatDateGroupKey(match.kickoff_at);
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, dateMatches]) => (
        <div key={dateKey} className="space-y-2">
          <h3 className="sticky top-14 z-10 bg-background/95 py-1 font-heading text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
            {dateKey}
          </h3>
          <div className="space-y-2">
            {dateMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions?.[match.id]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
