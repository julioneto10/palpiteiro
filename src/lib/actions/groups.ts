"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Recalcula os rankings (cada bolao usa a sua pontuacao). Best-effort. */
async function recomputeStandings() {
  try {
    await createAdminClient().rpc("recompute_totals");
  } catch (e) {
    console.error("recompute_totals:", e);
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para criar um bolao." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const type = (formData.get("type") as string) || "private";
  const maxMembers = parseInt(formData.get("maxMembers") as string) || 100;
  const stakeAmount = formData.get("stakeAmount") as string | null;

  if (!name || name.trim().length < 3) {
    return { error: "O nome do bolao precisa ter pelo menos 3 caracteres." };
  }

  if (name.trim().length > 50) {
    return { error: "O nome do bolao pode ter no maximo 50 caracteres." };
  }

  // Parse scoring config if provided
  const correctWinner = formData.get("scoringCorrectWinner") as string | null;
  const exactScore = formData.get("scoringExactScore") as string | null;
  const correctScorer = formData.get("scoringCorrectScorer") as string | null;

  let scoringConfig = null;
  if (correctWinner || exactScore || correctScorer) {
    scoringConfig = {
      correct_winner: correctWinner ? parseInt(correctWinner) : 3,
      exact_score: exactScore ? parseInt(exactScore) : 5,
      correct_scorer: correctScorer ? parseInt(correctScorer) : 2,
    };
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      owner_id: user.id,
      type,
      invite_code: inviteCode,
      max_members: maxMembers,
      stake_amount: stakeAmount ? parseFloat(stakeAmount) : null,
      scoring_config: scoringConfig,
    })
    .select()
    .single();

  if (groupError || !group) {
    console.error("Erro ao criar grupo:", groupError);
    return { error: `Erro ao criar bolao: ${groupError?.message ?? "desconhecido"}` };
  }

  // Add creator as owner member
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("Erro ao adicionar membro:", memberError);
    // Cleanup: delete the group if member creation fails
    await supabase.from("groups").delete().eq("id", group.id);
    return { error: `Erro ao criar bolao: ${memberError.message}` };
  }

  await recomputeStandings();
  revalidatePath("/boloes");
  redirect(`/boloes/${group.id}`);
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para entrar em um bolao." };
  }

  const code = inviteCode.trim().toUpperCase();

  // Busca pelo codigo ignorando RLS (boloes privados ficam invisiveis p/ nao-membros).
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("groups")
    .select("*")
    .eq("invite_code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!group) {
    return { error: "Bolao nao encontrado. Verifique o codigo." };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Voce ja faz parte deste bolao.", groupId: group.id };
  }

  // Check member limit (via admin: nao-membros nao enxergam group_members por RLS)
  const { count } = await admin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if (count && count >= group.max_members) {
    return { error: "Este bolao ja esta lotado." };
  }

  // Join the group
  const { error } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "member",
    });

  if (error) {
    return { error: "Erro ao entrar no bolao. Tente novamente." };
  }

  await recomputeStandings();
  revalidatePath("/boloes");
  revalidatePath(`/boloes/${group.id}`);
  return { success: true, groupId: group.id };
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado." };
  }

  // Check membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "Voce nao faz parte deste bolao." };
  }

  if (membership.role === "owner") {
    return { error: "O dono do bolao nao pode sair. Transfira a lideranca primeiro." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Erro ao sair do bolao." };
  }

  revalidatePath("/boloes");
  revalidatePath(`/boloes/${groupId}`);
  return { success: true };
}

export async function updateGroupSettings(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado." };
  }

  // Verify ownership/admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "Apenas o dono ou admin pode alterar configuracoes." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const type = formData.get("type") as string | null;
  const maxMembers = formData.get("maxMembers") as string | null;

  const correctWinner = formData.get("scoringCorrectWinner") as string | null;
  const exactScore = formData.get("scoringExactScore") as string | null;
  const correctScorer = formData.get("scoringCorrectScorer") as string | null;

  let scoringConfig = undefined;
  if (correctWinner || exactScore || correctScorer) {
    scoringConfig = {
      correct_winner: correctWinner ? parseInt(correctWinner) : 3,
      exact_score: exactScore ? parseInt(exactScore) : 5,
      correct_scorer: correctScorer ? parseInt(correctScorer) : 2,
    };
  }

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name.trim();
  if (description !== null) updates.description = description?.trim() || null;
  if (type) updates.type = type;
  if (maxMembers) updates.max_members = parseInt(maxMembers);
  if (scoringConfig) updates.scoring_config = scoringConfig;

  const { error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", groupId);

  if (error) {
    return { error: "Erro ao atualizar configuracoes." };
  }

  // pontuacao pode ter mudado -> recalcula o ranking deste bolao
  await recomputeStandings();
  revalidatePath(`/boloes/${groupId}`);
  revalidatePath(`/boloes/${groupId}/config`);
  return { success: true };
}

export async function removeMember(groupId: string, targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado." };
  }

  // Verify caller is owner/admin
  const { data: callerMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "admin")) {
    return { error: "Sem permissao para remover membros." };
  }

  // Can't remove the owner
  const { data: targetMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .single();

  if (!targetMembership) {
    return { error: "Membro nao encontrado." };
  }

  if (targetMembership.role === "owner") {
    return { error: "Nao eh possivel remover o dono do bolao." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) {
    return { error: "Erro ao remover membro." };
  }

  revalidatePath(`/boloes/${groupId}`);
  return { success: true };
}
