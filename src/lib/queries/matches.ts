import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MatchWithTeams } from "@/lib/types/database";

export async function getMatches(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `
    )
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as MatchWithTeams[]) ?? [];
}

// cache() deduplica a query dentro da mesma requisicao — a pagina de detalhe
// chama getMatchById no generateMetadata e no corpo; com cache roda so 1x.
export const getMatchById = cache(async function getMatchById(
  matchId: string
): Promise<MatchWithTeams | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `
    )
    .eq("id", matchId)
    .single();

  if (error) return null;
  return data as unknown as MatchWithTeams;
});

/**
 * Jogos que o usuario pode palpitar agora: agendados, com os dois times ja
 * definidos e SO do mata-mata (a fase de grupos esta encerrada para palpites
 * — decisao do Julio, 27/06). Ordenados por data — base do fluxo sequencial.
 */
export async function getPredictableMatches(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `
    )
    .eq("status", "scheduled")
    .neq("stage", "group")
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null)
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as MatchWithTeams[]) ?? [];
}

export async function getMatchesByStage(
  stage: string
): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `
    )
    .eq("stage", stage)
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as MatchWithTeams[]) ?? [];
}

export async function getMatchesByDate(
  date: string
): Promise<MatchWithTeams[]> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `
    )
    .gte("kickoff_at", startOfDay)
    .lte("kickoff_at", endOfDay)
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as MatchWithTeams[]) ?? [];
}

export async function getGroupStandings() {
  const supabase = await createClient();

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .not("group_letter", "is", null)
    .order("group_letter")
    .order("fifa_ranking", { ascending: true });

  if (teamsError) throw teamsError;

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("stage", "group")
    .eq("status", "finished");

  if (matchesError) throw matchesError;

  // Build standings per group
  const groups: Record<
    string,
    {
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
    }[]
  > = {};

  for (const team of teams ?? []) {
    const groupLetter = team.group_letter!;
    if (!groups[groupLetter]) groups[groupLetter] = [];

    const teamMatches = (matches ?? []).filter(
      (m) => m.home_team_id === team.id || m.away_team_id === team.id
    );

    let won = 0,
      drawn = 0,
      lost = 0,
      goalsFor = 0,
      goalsAgainst = 0;

    for (const m of teamMatches) {
      const isHome = m.home_team_id === team.id;
      const gf = isHome ? m.home_score ?? 0 : m.away_score ?? 0;
      const ga = isHome ? m.away_score ?? 0 : m.home_score ?? 0;
      goalsFor += gf;
      goalsAgainst += ga;
      if (gf > ga) won++;
      else if (gf === ga) drawn++;
      else lost++;
    }

    groups[groupLetter].push({
      team_id: team.id,
      team_name: team.name,
      team_code: team.code,
      played: teamMatches.length,
      won,
      drawn,
      lost,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      points: won * 3 + drawn,
    });
  }

  // Sort each group by points, goal diff, goals for
  for (const letter of Object.keys(groups)) {
    groups[letter].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goals_for - a.goals_against;
      const diffB = b.goals_for - b.goals_against;
      if (diffB !== diffA) return diffB - diffA;
      return b.goals_for - a.goals_for;
    });
  }

  return groups;
}
