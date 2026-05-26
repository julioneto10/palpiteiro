-- ============================================================
-- FIX: Infinite recursion in group_members RLS policy
-- The SELECT policy on group_members references itself,
-- causing infinite recursion. Fix: use SECURITY DEFINER function.
-- ============================================================

-- Step 1: Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Step 2: Drop old problematic policies
DROP POLICY IF EXISTS "Members visible to group participants" ON public.group_members;
DROP POLICY IF EXISTS "Open groups are viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Group members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;

-- Step 3: Recreate policies using the helper function

-- group_members: SELECT
CREATE POLICY "Members visible to group participants"
  ON public.group_members FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_group_member(group_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.type = 'open'
    )
  );

-- groups: SELECT
CREATE POLICY "Open groups are viewable by everyone"
  ON public.groups FOR SELECT USING (
    type = 'open'
    OR owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- messages: SELECT
CREATE POLICY "Group members can read messages"
  ON public.messages FOR SELECT USING (
    public.is_group_member(group_id, auth.uid())
  );

-- messages: INSERT
CREATE POLICY "Group members can send messages"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_group_member(group_id, auth.uid())
  );
