"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/supabase/user";

interface PredictionInput {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  scorerPlayerIds?: string[];
}

/**
 * Salva so o placar de um jogo — versao enxuta usada pelo fluxo sequencial
 * de palpites. Sem rede redundante: auth local via getClaims, e a trava de
 * prazo (kickoff_at > now) ja e garantida pela RLS, entao nao rebusca o jogo.
 * Nao mexe no palpite de artilheiro existente. Nao faz revalidatePath — o
 * cliente e otimista e as telas (dinamicas por cookie) recarregam ao navegar.
 */
export async function savePredictionScore(input: {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
}) {
  const userId = await getUserId();
  if (!userId) {
    return { error: "Voce precisa estar logado para dar um palpite." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: userId,
      match_id: input.matchId,
      predicted_home_score: input.predictedHomeScore,
      predicted_away_score: input.predictedAwayScore,
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    // RLS bloqueia palpite apos o kickoff
    if (error.code === "42501") {
      return { error: "O prazo para palpites neste jogo ja encerrou." };
    }
    return { error: "Erro ao salvar palpite. Tente novamente." };
  }

  return { success: true };
}

export async function upsertPrediction(input: PredictionInput) {
  const userId = await getUserId();
  if (!userId) {
    return { error: "Voce precisa estar logado para dar um palpite." };
  }

  const supabase = await createClient();

  // Verify match exists and hasn't started
  const { data: match } = await supabase
    .from("matches")
    .select("id, kickoff_at, status")
    .eq("id", input.matchId)
    .single();

  if (!match) {
    return { error: "Jogo nao encontrado." };
  }

  if (new Date(match.kickoff_at) <= new Date()) {
    return { error: "O prazo para palpites neste jogo ja encerrou." };
  }

  if (match.status !== "scheduled") {
    return { error: "Este jogo ja comecou ou terminou." };
  }

  // Upsert prediction
  const { error: predError } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: userId,
        match_id: input.matchId,
        predicted_home_score: input.predictedHomeScore,
        predicted_away_score: input.predictedAwayScore,
      },
      { onConflict: "user_id,match_id" }
    );

  if (predError) {
    return { error: "Erro ao salvar palpite. Tente novamente." };
  }

  // Handle scorer predictions
  if (input.scorerPlayerIds && input.scorerPlayerIds.length > 0) {
    // Delete existing scorer predictions for this match
    await supabase
      .from("scorer_predictions")
      .delete()
      .eq("user_id", userId)
      .eq("match_id", input.matchId);

    // Insert new scorer predictions
    const scorerRows = input.scorerPlayerIds.map((playerId) => ({
      user_id: userId,
      match_id: input.matchId,
      player_id: playerId,
    }));

    const { error: scorerError } = await supabase
      .from("scorer_predictions")
      .insert(scorerRows);

    if (scorerError) {
      return { error: "Palpite de placar salvo, mas houve erro ao salvar artilheiro." };
    }
  }

  revalidatePath(`/jogos/${input.matchId}`);
  revalidatePath("/palpites");
  revalidatePath("/jogos");

  return { success: true };
}

export async function deleteScorerPrediction(matchId: string, playerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado." };
  }

  const { error } = await supabase
    .from("scorer_predictions")
    .delete()
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .eq("player_id", playerId);

  if (error) {
    return { error: "Erro ao remover palpite de artilheiro." };
  }

  revalidatePath(`/jogos/${matchId}`);
  return { success: true };
}
