import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  MatchWithTeams,
  Player,
  MatchResultAudit,
  Team,
  TournamentResult,
} from "@/lib/types/database";

/** Retorna true se o usuario logado e admin do app (organizador). */
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !!data?.is_admin;
}

/** Jogos com selecoes, ordenados por kickoff (para a mesa de resultados). */
export async function getMatchesForAdmin(): Promise<MatchWithTeams[]> {
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

/** Jogadores ativos (para selecionar artilheiros). Pode vir vazio se nao houver seed. */
export async function getAllActivePlayers(): Promise<Player[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("shirt_number", { ascending: true });
  return (data as Player[]) ?? [];
}

/** Quem marcou em cada jogo (match_events do tipo gol) — para pre-popular a mesa. */
export async function getGoalEventsByMatch(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_events")
    .select("match_id, player_id")
    .in("event_type", ["goal", "penalty_goal"]);

  const map: Record<string, string[]> = {};
  for (const ev of data ?? []) {
    if (!ev.player_id) continue;
    (map[ev.match_id] ??= []).push(ev.player_id);
  }
  return map;
}

/** Todas as selecoes (para o settle do bracket e o palpite de campeao). */
export async function getAllTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });
  return (data as Team[]) ?? [];
}

export async function getTournamentResult(): Promise<TournamentResult | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_result")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as TournamentResult) ?? null;
}

export type ResultAuditWithMatch = MatchResultAudit & {
  match: {
    id: string;
    home_team: Pick<Team, "name" | "code"> | null;
    away_team: Pick<Team, "name" | "code"> | null;
  } | null;
  actor: { display_name: string | null } | null;
};

/** Log de auditoria de resultados (mais recentes primeiro). */
export async function getResultAudit(limit = 100): Promise<ResultAuditWithMatch[]> {
  const supabase = await createClient();
  // actor_id referencia auth.users (sem FK direta para profiles), entao o
  // display_name e resolvido em uma segunda query e mesclado aqui.
  const { data, error } = await supabase
    .from("match_result_audit")
    .select(
      `
      *,
      match:matches!match_result_audit_match_id_fkey(
        id,
        home_team:teams!matches_home_team_id_fkey(name, code),
        away_team:teams!matches_away_team_id_fkey(name, code)
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as (Omit<ResultAuditWithMatch, "actor">)[];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) names.set(p.id, p.display_name);
  }

  return rows.map((r) => ({
    ...r,
    actor: r.actor_id ? { display_name: names.get(r.actor_id) ?? null } : null,
  }));
}

// ===== Logs / Estatisticas (admin) =====

export interface AppStats {
  users: number;
  predictions: number;
  scorerPredictions: number;
  bracketPredictions: number;
  groups: number;
  memberships: number;
  finishedMatches: number;
  totalMatches: number;
}

async function countRows(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  filter?: { col: string; val: string }
): Promise<number> {
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter.col, filter.val);
  const { count } = await q;
  return count ?? 0;
}

export async function getAppStats(): Promise<AppStats> {
  const admin = createAdminClient();
  const [
    users,
    predictions,
    scorerPredictions,
    bracketPredictions,
    groups,
    memberships,
    finishedMatches,
    totalMatches,
  ] = await Promise.all([
    countRows(admin, "profiles"),
    countRows(admin, "predictions"),
    countRows(admin, "scorer_predictions"),
    countRows(admin, "bracket_predictions"),
    countRows(admin, "groups"),
    countRows(admin, "group_members"),
    countRows(admin, "matches", { col: "status", val: "finished" }),
    countRows(admin, "matches"),
  ]);
  return {
    users,
    predictions,
    scorerPredictions,
    bracketPredictions,
    groups,
    memberships,
    finishedMatches,
    totalMatches,
  };
}

export interface RecentSignup {
  display_name: string | null;
  created_at: string;
}

export async function getRecentSignups(limit = 12): Promise<RecentSignup[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as RecentSignup[]) ?? [];
}

export interface RecentPrediction {
  predicted_home_score: number;
  predicted_away_score: number;
  created_at: string;
  user_name: string | null;
  home: string;
  away: string;
}

export async function getRecentPredictions(limit = 20): Promise<RecentPrediction[]> {
  const admin = createAdminClient();
  // user_id referencia auth.users (sem FK p/ profiles) -> resolve nome em 2a query
  const { data } = await admin
    .from("predictions")
    .select(
      `
      user_id, predicted_home_score, predicted_away_score, created_at,
      match:matches!predictions_match_id_fkey(
        home_team:teams!matches_home_team_id_fkey(code),
        away_team:teams!matches_away_team_id_fkey(code)
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as {
    user_id: string;
    predicted_home_score: number;
    predicted_away_score: number;
    created_at: string;
    match: {
      home_team: { code: string } | null;
      away_team: { code: string } | null;
    } | null;
  }[];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    for (const p of profs ?? []) names.set(p.id, p.display_name);
  }

  return rows.map((r) => ({
    predicted_home_score: r.predicted_home_score,
    predicted_away_score: r.predicted_away_score,
    created_at: r.created_at,
    user_name: names.get(r.user_id) ?? null,
    home: r.match?.home_team?.code ?? "?",
    away: r.match?.away_team?.code ?? "?",
  }));
}
