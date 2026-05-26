import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/lib/types/database";

export async function getPlayersByTeamIds(teamIds: string[]): Promise<Player[]> {
  if (teamIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .in("team_id", teamIds)
    .eq("is_active", true)
    .order("position")
    .order("shirt_number", { ascending: true });

  if (error) throw error;
  return (data as Player[]) ?? [];
}

export async function getPlayersByMatchId(matchId: string): Promise<Player[]> {
  const supabase = await createClient();

  // Get match team IDs
  const { data: match } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("id", matchId)
    .single();

  if (!match) return [];

  const teamIds = [match.home_team_id, match.away_team_id].filter(
    Boolean
  ) as string[];

  return getPlayersByTeamIds(teamIds);
}
