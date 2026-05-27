-- ============================================================
-- 00010_group_delete_policy.sql
-- Permite o DONO excluir o proprio bolao (nao havia policy de DELETE).
-- group_members/messages/reactions caem em cascata (ON DELETE CASCADE).
-- ============================================================

DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
CREATE POLICY "Owners can delete their groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = owner_id);
