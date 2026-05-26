-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PREDICTIONS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions viewable by everyone"
  ON public.predictions FOR SELECT USING (true);

CREATE POLICY "Users can insert own predictions before kickoff"
  ON public.predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
  );

CREATE POLICY "Users can update own predictions before kickoff"
  ON public.predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
  );

-- SCORER PREDICTIONS
ALTER TABLE public.scorer_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scorer predictions viewable by everyone"
  ON public.scorer_predictions FOR SELECT USING (true);

CREATE POLICY "Users can insert own scorer predictions before kickoff"
  ON public.scorer_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
  );

CREATE POLICY "Users can update own scorer predictions before kickoff"
  ON public.scorer_predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
  );

CREATE POLICY "Users can delete own scorer predictions before kickoff"
  ON public.scorer_predictions FOR DELETE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
  );

-- GROUPS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open groups are viewable by everyone"
  ON public.groups FOR SELECT USING (
    type = 'open'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their groups"
  ON public.groups FOR UPDATE USING (auth.uid() = owner_id);

-- GROUP MEMBERS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members visible to group participants"
  ON public.group_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.type = 'open'
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE USING (
    auth.uid() = user_id
  );

-- DISPUTES
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their disputes"
  ON public.disputes FOR SELECT USING (
    auth.uid() = challenger_id OR auth.uid() = opponent_id
  );

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update disputes"
  ON public.disputes FOR UPDATE USING (
    auth.uid() = challenger_id OR auth.uid() = opponent_id
  );

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read messages"
  ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

-- REACTIONS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone"
  ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Users can add reactions"
  ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- GLOBAL LEADERBOARD
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is public"
  ON public.global_leaderboard FOR SELECT USING (true);

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- PUBLIC DATA (read-only)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are public" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Matches are public" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Players are public" ON public.players FOR SELECT USING (true);
CREATE POLICY "Match events are public" ON public.match_events FOR SELECT USING (true);
