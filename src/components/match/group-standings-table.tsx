import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeamStanding {
  team_id: string;
  team_name: string;
  team_code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

interface GroupStandingsTableProps {
  groupLetter: string;
  standings: TeamStanding[];
}

export function GroupStandingsTable({
  groupLetter,
  standings,
}: GroupStandingsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-3 py-2 bg-primary/5 border-b">
          <h3 className="font-heading text-sm font-bold">
            Grupo {groupLetter}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pl-3 pr-1 font-medium w-6">#</th>
                <th className="text-left py-2 px-1 font-medium">Selecao</th>
                <th className="text-center py-2 px-1 font-medium w-6">J</th>
                <th className="text-center py-2 px-1 font-medium w-6">V</th>
                <th className="text-center py-2 px-1 font-medium w-6">E</th>
                <th className="text-center py-2 px-1 font-medium w-6">D</th>
                <th className="text-center py-2 px-1 font-medium w-8">SG</th>
                <th className="text-center py-2 px-1 pr-3 font-medium w-8 text-primary">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => {
                const goalDiff = team.goals_for - team.goals_against;
                const isQualified = index < 2; // Top 2 qualify directly
                const isThirdPlace = index === 2; // 3rd might qualify

                return (
                  <tr
                    key={team.team_id}
                    className={cn(
                      "border-b last:border-b-0",
                      isQualified && "bg-success/5",
                      isThirdPlace && "bg-warning/5"
                    )}
                  >
                    <td className="py-2 pl-3 pr-1 font-bold text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-2 px-1 font-medium">
                      {team.team_code}
                    </td>
                    <td className="text-center py-2 px-1">{team.played}</td>
                    <td className="text-center py-2 px-1">{team.won}</td>
                    <td className="text-center py-2 px-1">{team.drawn}</td>
                    <td className="text-center py-2 px-1">{team.lost}</td>
                    <td className="text-center py-2 px-1 font-medium">
                      {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                    </td>
                    <td className="text-center py-2 px-1 pr-3 font-bold text-primary">
                      {team.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
