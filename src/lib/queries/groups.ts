import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Group, GroupMember, Profile } from "@/lib/types/database";

/**
 * Busca um bolao pelo CODIGO de convite ignorando a RLS — o proprio codigo
 * e a autorizacao. Necessario porque boloes privados ficam invisiveis para
 * quem ainda nao e membro (caso de quem recebe o convite).
 */
export async function getGroupByInviteCodeAdmin(inviteCode: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();
  return data as Group | null;
}

export async function getGroupMemberCountAdmin(groupId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);
  return count ?? 0;
}

export type GroupWithMemberCount = Group & { member_count: number };

export type GroupMemberWithProfile = GroupMember & {
  profile: Pick<Profile, "display_name" | "avatar_url" | "username">;
};

export async function getGroupById(groupId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  return data as Group | null;
}

export async function getGroupByInviteCode(inviteCode: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("is_active", true)
    .single();
  return data as Group | null;
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select(
      `
      *,
      profile:profiles!group_members_user_id_fkey(
        display_name,
        avatar_url,
        username
      )
    `
    )
    .eq("group_id", groupId)
    .order("total_points", { ascending: false });

  return (data ?? []) as unknown as GroupMemberWithProfile[];
}

export async function getGroupMemberCount(groupId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);
  return count ?? 0;
}

export async function getUserMembership(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  return data as GroupMember | null;
}

export async function getUserGroups(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select(
      `
      *,
      group:groups(*)
    `
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  return (data ?? []) as (GroupMember & { group: Group })[];
}
