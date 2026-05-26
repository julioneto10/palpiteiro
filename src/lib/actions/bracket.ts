"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface BracketInput {
  championTeamId: string;
  runnerUpTeamId: string;
  thirdTeamId: string;
}

export async function upsertBracketPrediction(input: BracketInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para palpitar." };
  }

  if (!input.championTeamId || !input.runnerUpTeamId || !input.thirdTeamId) {
    return { error: "Escolha campeao, vice e terceiro lugar." };
  }

  const distinct = new Set([
    input.championTeamId,
    input.runnerUpTeamId,
    input.thirdTeamId,
  ]);
  if (distinct.size < 3) {
    return { error: "Campeao, vice e terceiro precisam ser selecoes diferentes." };
  }

  // Trava: so antes do inicio da Copa (1o kickoff). A RLS reforca isso no banco;
  // checamos aqui tambem para dar uma mensagem clara.
  const { data: firstMatch } = await supabase
    .from("matches")
    .select("kickoff_at")
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .single();

  if (firstMatch && new Date(firstMatch.kickoff_at) <= new Date()) {
    return { error: "A Copa ja comecou — os palpites de campeao estao travados." };
  }

  const { error } = await supabase.from("bracket_predictions").upsert(
    {
      user_id: user.id,
      champion_team_id: input.championTeamId,
      runner_up_team_id: input.runnerUpTeamId,
      third_team_id: input.thirdTeamId,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("upsertBracketPrediction:", error);
    return { error: "Erro ao salvar palpite. Talvez o prazo ja tenha encerrado." };
  }

  revalidatePath("/palpites/campeao");
  revalidatePath("/palpites");
  return { success: true };
}
