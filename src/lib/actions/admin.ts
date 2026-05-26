"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Garante que o chamador e admin do app (organizador).
 * A verificacao usa o cliente autenticado (RLS), depois as escritas
 * privilegiadas usam o service role.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, error: "Voce precisa estar logado." as string };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { user: null, error: "Acesso restrito ao organizador." as string };
  }

  return { user, error: null };
}

function revalidateScoringPaths(matchId?: string) {
  revalidatePath("/admin");
  revalidatePath("/auditoria");
  revalidatePath("/ranking");
  revalidatePath("/boloes");
  revalidatePath("/jogos");
  revalidatePath("/palpites");
  if (matchId) revalidatePath(`/jogos/${matchId}`);
}

interface MatchResultInput {
  matchId: string;
  home: number;
  away: number;
  scorerPlayerIds?: string[];
}

export async function submitMatchResult(input: MatchResultInput) {
  const { user, error } = await requireAdmin();
  if (error || !user) return { error: error ?? "Acesso negado." };

  if (
    !Number.isInteger(input.home) ||
    !Number.isInteger(input.away) ||
    input.home < 0 ||
    input.away < 0
  ) {
    return { error: "Placar invalido." };
  }

  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("apply_match_result", {
    p_match_id: input.matchId,
    p_home: input.home,
    p_away: input.away,
    p_scorer_player_ids: input.scorerPlayerIds ?? [],
    p_actor: user.id,
  });

  if (rpcError) {
    console.error("apply_match_result:", rpcError);
    return { error: `Erro ao lancar resultado: ${rpcError.message}` };
  }

  revalidateScoringPaths(input.matchId);
  return { success: true };
}

export async function clearMatchResult(matchId: string) {
  const { user, error } = await requireAdmin();
  if (error || !user) return { error: error ?? "Acesso negado." };

  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("clear_match_result", {
    p_match_id: matchId,
    p_actor: user.id,
  });

  if (rpcError) {
    console.error("clear_match_result:", rpcError);
    return { error: `Erro ao limpar resultado: ${rpcError.message}` };
  }

  revalidateScoringPaths(matchId);
  return { success: true };
}

interface SettleBracketInput {
  championTeamId: string;
  runnerUpTeamId: string;
  thirdTeamId: string;
}

export async function settleBracket(input: SettleBracketInput) {
  const { user, error } = await requireAdmin();
  if (error || !user) return { error: error ?? "Acesso negado." };

  if (!input.championTeamId || !input.runnerUpTeamId || !input.thirdTeamId) {
    return { error: "Selecione campeao, vice e terceiro lugar." };
  }

  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("settle_bracket", {
    p_champion: input.championTeamId,
    p_runner_up: input.runnerUpTeamId,
    p_third: input.thirdTeamId,
    p_actor: user.id,
  });

  if (rpcError) {
    console.error("settle_bracket:", rpcError);
    return { error: `Erro ao apurar o bracket: ${rpcError.message}` };
  }

  revalidateScoringPaths();
  return { success: true };
}
