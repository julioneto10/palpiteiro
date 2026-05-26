import { getGroupStandings } from "@/lib/queries/matches";
import { GroupStandingsTable } from "@/components/match/group-standings-table";

export const metadata = {
  title: "Fase de Grupos",
};

export default async function GruposPage() {
  const groups = await getGroupStandings();
  const sortedLetters = Object.keys(groups).sort();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-extrabold">Fase de Grupos</h1>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success/30" />
          Classificado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning/30" />
          Possivel classificacao (3o)
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sortedLetters.map((letter) => (
          <GroupStandingsTable
            key={letter}
            groupLetter={letter}
            standings={groups[letter]}
          />
        ))}
      </div>

      {sortedLetters.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">📊</p>
          <p className="font-heading text-lg font-bold">
            Tabelas em breve
          </p>
          <p className="text-sm text-muted-foreground">
            As tabelas da fase de grupos serao atualizadas conforme os jogos acontecerem.
          </p>
        </div>
      )}
    </div>
  );
}
