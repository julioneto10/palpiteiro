-- ============================================================
-- PALPITEIRO — SETUP COMPLETO
-- Execute este arquivo inteiro no SQL Editor do Supabase Dashboard
-- (Dashboard > SQL Editor > New Query > cole tudo > Run)
--
-- Ordem: Schema > RLS > Functions/Triggers > Seed Teams > Seed Matches
-- ============================================================

-- ##########################################################
-- PARTE 1: SCHEMA (00001_initial_schema.sql)
-- ##########################################################

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  group_letter CHAR(1),
  confederation TEXT,
  fifa_ranking INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shirt_number INTEGER,
  position TEXT CHECK (position IN ('GK','DF','MF','FW')),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_team ON public.players(team_id);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  stage TEXT NOT NULL CHECK (stage IN (
    'group', 'round_of_32', 'round_of_16',
    'quarter_final', 'semi_final',
    'third_place', 'final'
  )),
  group_letter CHAR(1),
  match_number INTEGER,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'half_time',
    'finished', 'postponed', 'cancelled'
  )),
  kickoff_at TIMESTAMPTZ NOT NULL,
  stadium TEXT,
  city TEXT,
  country TEXT,
  score_multiplier NUMERIC(3,1) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON public.matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON public.matches(stage);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'goal', 'own_goal', 'penalty_goal', 'penalty_miss',
    'yellow_card', 'red_card', 'substitution',
    'var_decision', 'kick_off', 'half_time', 'full_time'
  )),
  minute INTEGER,
  extra_minute INTEGER,
  player_id UUID REFERENCES public.players(id),
  assist_player_id UUID REFERENCES public.players(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_events_match ON public.match_events(match_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  favorite_team_id UUID REFERENCES public.teams(id),
  phone TEXT,
  bio TEXT,
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  exact_scores INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_referral ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_total_points ON public.profiles(total_points DESC);

CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score INTEGER NOT NULL CHECK (predicted_away_score >= 0),
  points_earned INTEGER DEFAULT 0,
  is_correct_winner BOOLEAN,
  is_exact_score BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON public.predictions(match_id);

CREATE TABLE IF NOT EXISTS public.scorer_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_scorer_pred_user_match ON public.scorer_predictions(user_id, match_id);

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'open' CHECK (type IN ('open', 'private')),
  invite_code TEXT UNIQUE NOT NULL,
  max_members INTEGER DEFAULT 100,
  stake_amount NUMERIC(10,2),
  stake_currency TEXT DEFAULT 'BRL',
  scoring_config JSONB,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_invite ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_points ON public.group_members(group_id, total_points DESC);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id),
  opponent_id UUID NOT NULL REFERENCES auth.users(id),
  match_id UUID REFERENCES public.matches(id),
  group_id UUID REFERENCES public.groups(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'active', 'finished'
  )),
  stake_description TEXT,
  challenger_points INTEGER DEFAULT 0,
  opponent_points INTEGER DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_challenger ON public.disputes(challenger_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opponent ON public.disputes(opponent_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'prediction_share', 'provocation', 'system'
  )),
  prediction_id UUID REFERENCES public.predictions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_group ON public.messages(group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN (
    'fire', 'clown', 'crying', 'trophy', 'goat',
    'shocked', 'laughing', 'thumbs_up'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, prediction_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_prediction ON public.reactions(prediction_id);

CREATE TABLE IF NOT EXISTS public.global_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_winners INTEGER DEFAULT 0,
  exact_scores INTEGER DEFAULT 0,
  correct_scorers INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.global_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON public.global_leaderboard(total_points DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'match_reminder', 'prediction_result', 'dispute_challenge',
    'group_invite', 'reaction', 'provocation', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);


-- ##########################################################
-- PARTE 2: RLS POLICIES (00002_rls_policies.sql)
-- ##########################################################

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Predictions viewable by everyone" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions before kickoff" ON public.predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
);
CREATE POLICY "Users can update own predictions before kickoff" ON public.predictions FOR UPDATE USING (
  auth.uid() = user_id AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
);

ALTER TABLE public.scorer_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scorer predictions viewable by everyone" ON public.scorer_predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own scorer predictions before kickoff" ON public.scorer_predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
);
CREATE POLICY "Users can update own scorer predictions before kickoff" ON public.scorer_predictions FOR UPDATE USING (
  auth.uid() = user_id AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
);
CREATE POLICY "Users can delete own scorer predictions before kickoff" ON public.scorer_predictions FOR DELETE USING (
  auth.uid() = user_id AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open groups are viewable by everyone" ON public.groups FOR SELECT USING (
  type = 'open' OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()
  )
);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their groups" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members visible to group participants" ON public.group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.type = 'open'
  )
);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their disputes" ON public.disputes FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update disputes" ON public.disputes FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can read messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Group members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = messages.group_id AND user_id = auth.uid()
  )
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is public" ON public.global_leaderboard FOR SELECT USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are public" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Matches are public" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Players are public" ON public.players FOR SELECT USING (true);
CREATE POLICY "Match events are public" ON public.match_events FOR SELECT USING (true);


-- ##########################################################
-- PARTE 3: FUNCTIONS & TRIGGERS (00003_functions_triggers.sql)
-- ##########################################################

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    substr(md5(random()::text), 1, 8)
  );
  INSERT INTO public.global_leaderboard (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.calculate_match_points(
  p_match_id UUID,
  p_scoring_config JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_prediction RECORD;
  v_points INTEGER;
  v_correct_winner BOOLEAN;
  v_exact_score BOOLEAN;
  v_winner_pts INTEGER;
  v_exact_pts INTEGER;
  v_scorer_pts INTEGER;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id AND status = 'finished';
  IF NOT FOUND THEN RETURN; END IF;

  v_winner_pts := COALESCE((p_scoring_config->>'correct_winner')::INTEGER, 3);
  v_exact_pts := COALESCE((p_scoring_config->>'exact_score')::INTEGER, 5);
  v_scorer_pts := COALESCE((p_scoring_config->>'correct_scorer')::INTEGER, 2);

  FOR v_prediction IN
    SELECT * FROM public.predictions WHERE match_id = p_match_id
  LOOP
    v_points := 0;
    v_correct_winner := false;
    v_exact_score := false;

    IF (v_match.home_score > v_match.away_score AND v_prediction.predicted_home_score > v_prediction.predicted_away_score)
       OR (v_match.home_score < v_match.away_score AND v_prediction.predicted_home_score < v_prediction.predicted_away_score)
       OR (v_match.home_score = v_match.away_score AND v_prediction.predicted_home_score = v_prediction.predicted_away_score)
    THEN
      v_correct_winner := true;
      v_points := v_points + v_winner_pts;
    END IF;

    IF v_match.home_score = v_prediction.predicted_home_score
       AND v_match.away_score = v_prediction.predicted_away_score
    THEN
      v_exact_score := true;
      v_points := v_points + v_exact_pts;
    END IF;

    v_points := FLOOR(v_points * v_match.score_multiplier);

    UPDATE public.predictions
    SET points_earned = v_points,
        is_correct_winner = v_correct_winner,
        is_exact_score = v_exact_score,
        updated_at = now()
    WHERE id = v_prediction.id;

    UPDATE public.profiles
    SET total_points = total_points + v_points,
        total_predictions = total_predictions + 1,
        correct_predictions = correct_predictions + CASE WHEN v_correct_winner THEN 1 ELSE 0 END,
        exact_scores = exact_scores + CASE WHEN v_exact_score THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE id = v_prediction.user_id;

    UPDATE public.global_leaderboard
    SET total_points = total_points + v_points,
        total_predictions = total_predictions + 1,
        correct_winners = correct_winners + CASE WHEN v_correct_winner THEN 1 ELSE 0 END,
        exact_scores = exact_scores + CASE WHEN v_exact_score THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE user_id = v_prediction.user_id;

    UPDATE public.group_members gm
    SET total_points = gm.total_points + v_points
    WHERE gm.user_id = v_prediction.user_id;
  END LOOP;

  FOR v_prediction IN
    SELECT sp.* FROM public.scorer_predictions sp WHERE sp.match_id = p_match_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.match_events me
      WHERE me.match_id = p_match_id
        AND me.player_id = v_prediction.player_id
        AND me.event_type IN ('goal', 'penalty_goal')
    ) THEN
      UPDATE public.scorer_predictions
      SET is_correct = true, points_earned = FLOOR(v_scorer_pts * v_match.score_multiplier)
      WHERE id = v_prediction.id;

      UPDATE public.profiles
      SET total_points = total_points + FLOOR(v_scorer_pts * v_match.score_multiplier), updated_at = now()
      WHERE id = v_prediction.user_id;

      UPDATE public.global_leaderboard
      SET total_points = total_points + FLOOR(v_scorer_pts * v_match.score_multiplier),
          correct_scorers = correct_scorers + 1, updated_at = now()
      WHERE user_id = v_prediction.user_id;

      UPDATE public.group_members gm
      SET total_points = gm.total_points + FLOOR(v_scorer_pts * v_match.score_multiplier)
      WHERE gm.user_id = v_prediction.user_id;
    ELSE
      UPDATE public.scorer_predictions SET is_correct = false, points_earned = 0 WHERE id = v_prediction.id;
    END IF;
  END LOOP;

  PERFORM public.recalculate_leaderboard_ranks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_leaderboard_ranks()
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, exact_scores DESC) as new_rank
    FROM public.global_leaderboard
  )
  UPDATE public.global_leaderboard gl
  SET rank = r.new_rank, updated_at = now()
  FROM ranked r
  WHERE gl.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_group_ranks(p_group_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
    FROM public.group_members
    WHERE group_id = p_group_id
  )
  UPDATE public.group_members gm
  SET rank = r.new_rank
  FROM ranked r
  WHERE gm.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_matches
  BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at_predictions
  BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at_groups
  BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at_disputes
  BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ##########################################################
-- PARTE 4: SEED TEAMS (00004_seed_teams.sql)
-- ##########################################################

TRUNCATE public.teams CASCADE;

INSERT INTO public.teams (name, name_en, code, flag_url, group_letter, confederation, fifa_ranking)
VALUES
  ('Mexico','Mexico','MEX',NULL,'A','CONCACAF',13),
  ('Africa do Sul','South Africa','RSA',NULL,'A','CAF',59),
  ('Coreia do Sul','South Korea','KOR',NULL,'A','AFC',23),
  ('Dinamarca','Denmark','DEN',NULL,'A','UEFA',21),
  ('Canada','Canada','CAN',NULL,'B','CONCACAF',41),
  ('Italia','Italy','ITA',NULL,'B','UEFA',10),
  ('Catar','Qatar','QAT',NULL,'B','AFC',43),
  ('Suica','Switzerland','SUI',NULL,'B','UEFA',19),
  ('Brasil','Brazil','BRA',NULL,'C','CONMEBOL',5),
  ('Marrocos','Morocco','MAR',NULL,'C','CAF',14),
  ('Haiti','Haiti','HAI',NULL,'C','CONCACAF',168),
  ('Escocia','Scotland','SCO',NULL,'C','UEFA',65),
  ('Estados Unidos','United States','USA',NULL,'D','CONCACAF',11),
  ('Paraguai','Paraguay','PAR',NULL,'D','CONMEBOL',57),
  ('Australia','Australia','AUS',NULL,'D','AFC',24),
  ('Turquia','Turkey','TUR',NULL,'D','UEFA',26),
  ('Alemanha','Germany','GER',NULL,'E','UEFA',12),
  ('Curacao','Curacao','CUW',NULL,'E','CONCACAF',180),
  ('Costa do Marfim','Ivory Coast','CIV',NULL,'E','CAF',39),
  ('Equador','Ecuador','ECU',NULL,'E','CONMEBOL',30),
  ('Holanda','Netherlands','NED',NULL,'F','UEFA',3),
  ('Japao','Japan','JPN',NULL,'F','AFC',15),
  ('Ucrania','Ukraine','UKR',NULL,'F','UEFA',22),
  ('Tunisia','Tunisia','TUN',NULL,'F','CAF',40),
  ('Belgica','Belgium','BEL',NULL,'G','UEFA',6),
  ('Egito','Egypt','EGY',NULL,'G','CAF',33),
  ('Ira','Iran','IRN',NULL,'G','AFC',20),
  ('Nova Zelandia','New Zealand','NZL',NULL,'G','OFC',93),
  ('Espanha','Spain','ESP',NULL,'H','UEFA',2),
  ('Cabo Verde','Cabo Verde','CPV',NULL,'H','CAF',72),
  ('Arabia Saudita','Saudi Arabia','KSA',NULL,'H','AFC',60),
  ('Uruguai','Uruguay','URU',NULL,'H','CONMEBOL',9),
  ('Franca','France','FRA',NULL,'I','UEFA',4),
  ('Senegal','Senegal','SEN',NULL,'I','CAF',17),
  ('Noruega','Norway','NOR',NULL,'I','UEFA',46),
  ('Iraque','Iraq','IRQ',NULL,'I','AFC',63),
  ('Argentina','Argentina','ARG',NULL,'J','CONMEBOL',1),
  ('Argelia','Algeria','ALG',NULL,'J','CAF',37),
  ('Austria','Austria','AUT',NULL,'J','UEFA',25),
  ('Jordania','Jordan','JOR',NULL,'J','AFC',68),
  ('Portugal','Portugal','POR',NULL,'K','UEFA',7),
  ('Uzbequistao','Uzbekistan','UZB',NULL,'K','AFC',62),
  ('Colombia','Colombia','COL',NULL,'K','CONMEBOL',8),
  ('RD Congo','DR Congo','COD',NULL,'K','CAF',56),
  ('Inglaterra','England','ENG',NULL,'L','UEFA',5),
  ('Croacia','Croatia','CRO',NULL,'L','UEFA',16),
  ('Gana','Ghana','GHA',NULL,'L','CAF',67),
  ('Panama','Panama','PAN',NULL,'L','CONCACAF',42)
;


-- ##########################################################
-- PARTE 5: SEED MATCHES (00005_seed_matches.sql)
-- ##########################################################

TRUNCATE public.matches CASCADE;

INSERT INTO public.matches (stage, group_letter, match_number, home_team_id, away_team_id, kickoff_at, stadium, city, country, score_multiplier)
VALUES
-- MATCHDAY 1
('group','A',1,(SELECT id FROM teams WHERE code='MEX'),(SELECT id FROM teams WHERE code='RSA'),'2026-06-11 19:00:00+00','Estadio Azteca','Cidade do Mexico','Mexico',1.0),
('group','A',2,(SELECT id FROM teams WHERE code='KOR'),(SELECT id FROM teams WHERE code='DEN'),'2026-06-12 02:00:00+00','Estadio Akron','Guadalajara','Mexico',1.0),
('group','B',3,(SELECT id FROM teams WHERE code='CAN'),(SELECT id FROM teams WHERE code='ITA'),'2026-06-12 19:00:00+00','BMO Field','Toronto','Canada',1.0),
('group','D',4,(SELECT id FROM teams WHERE code='USA'),(SELECT id FROM teams WHERE code='PAR'),'2026-06-13 01:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('group','B',5,(SELECT id FROM teams WHERE code='QAT'),(SELECT id FROM teams WHERE code='SUI'),'2026-06-13 19:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('group','C',6,(SELECT id FROM teams WHERE code='BRA'),(SELECT id FROM teams WHERE code='MAR'),'2026-06-13 22:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('group','C',7,(SELECT id FROM teams WHERE code='HAI'),(SELECT id FROM teams WHERE code='SCO'),'2026-06-14 01:00:00+00','Gillette Stadium','Boston','USA',1.0),
('group','D',8,(SELECT id FROM teams WHERE code='AUS'),(SELECT id FROM teams WHERE code='TUR'),'2026-06-14 04:00:00+00','BC Place','Vancouver','Canada',1.0),
('group','E',9,(SELECT id FROM teams WHERE code='GER'),(SELECT id FROM teams WHERE code='CUW'),'2026-06-14 17:00:00+00','NRG Stadium','Houston','USA',1.0),
('group','F',10,(SELECT id FROM teams WHERE code='NED'),(SELECT id FROM teams WHERE code='JPN'),'2026-06-14 20:00:00+00','AT&T Stadium','Dallas','USA',1.0),
('group','E',11,(SELECT id FROM teams WHERE code='CIV'),(SELECT id FROM teams WHERE code='ECU'),'2026-06-14 23:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.0),
('group','F',12,(SELECT id FROM teams WHERE code='UKR'),(SELECT id FROM teams WHERE code='TUN'),'2026-06-15 02:00:00+00','Estadio BBVA','Monterrey','Mexico',1.0),
('group','H',13,(SELECT id FROM teams WHERE code='ESP'),(SELECT id FROM teams WHERE code='CPV'),'2026-06-15 16:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('group','G',14,(SELECT id FROM teams WHERE code='BEL'),(SELECT id FROM teams WHERE code='EGY'),'2026-06-15 19:00:00+00','Lumen Field','Seattle','USA',1.0),
('group','H',15,(SELECT id FROM teams WHERE code='KSA'),(SELECT id FROM teams WHERE code='URU'),'2026-06-15 22:00:00+00','Hard Rock Stadium','Miami','USA',1.0),
('group','G',16,(SELECT id FROM teams WHERE code='IRN'),(SELECT id FROM teams WHERE code='NZL'),'2026-06-16 01:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('group','I',17,(SELECT id FROM teams WHERE code='FRA'),(SELECT id FROM teams WHERE code='SEN'),'2026-06-16 19:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('group','I',18,(SELECT id FROM teams WHERE code='IRQ'),(SELECT id FROM teams WHERE code='NOR'),'2026-06-16 22:00:00+00','Gillette Stadium','Boston','USA',1.0),
('group','J',19,(SELECT id FROM teams WHERE code='ARG'),(SELECT id FROM teams WHERE code='ALG'),'2026-06-17 01:00:00+00','Arrowhead Stadium','Kansas City','USA',1.0),
('group','J',20,(SELECT id FROM teams WHERE code='AUT'),(SELECT id FROM teams WHERE code='JOR'),'2026-06-17 04:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('group','K',21,(SELECT id FROM teams WHERE code='POR'),(SELECT id FROM teams WHERE code='COD'),'2026-06-17 17:00:00+00','NRG Stadium','Houston','USA',1.0),
('group','L',22,(SELECT id FROM teams WHERE code='ENG'),(SELECT id FROM teams WHERE code='CRO'),'2026-06-17 20:00:00+00','AT&T Stadium','Dallas','USA',1.0),
('group','L',23,(SELECT id FROM teams WHERE code='GHA'),(SELECT id FROM teams WHERE code='PAN'),'2026-06-17 23:00:00+00','BMO Field','Toronto','Canada',1.0),
('group','K',24,(SELECT id FROM teams WHERE code='UZB'),(SELECT id FROM teams WHERE code='COL'),'2026-06-18 02:00:00+00','Estadio Azteca','Cidade do Mexico','Mexico',1.0),
-- MATCHDAY 2
('group','A',25,(SELECT id FROM teams WHERE code='DEN'),(SELECT id FROM teams WHERE code='RSA'),'2026-06-18 16:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('group','B',26,(SELECT id FROM teams WHERE code='SUI'),(SELECT id FROM teams WHERE code='ITA'),'2026-06-18 19:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('group','B',27,(SELECT id FROM teams WHERE code='CAN'),(SELECT id FROM teams WHERE code='QAT'),'2026-06-18 22:00:00+00','BC Place','Vancouver','Canada',1.0),
('group','A',28,(SELECT id FROM teams WHERE code='MEX'),(SELECT id FROM teams WHERE code='KOR'),'2026-06-19 01:00:00+00','Estadio Akron','Guadalajara','Mexico',1.0),
('group','C',29,(SELECT id FROM teams WHERE code='SCO'),(SELECT id FROM teams WHERE code='MAR'),'2026-06-19 22:00:00+00','Gillette Stadium','Boston','USA',1.0),
('group','D',30,(SELECT id FROM teams WHERE code='USA'),(SELECT id FROM teams WHERE code='AUS'),'2026-06-19 19:00:00+00','Lumen Field','Seattle','USA',1.0),
('group','C',31,(SELECT id FROM teams WHERE code='BRA'),(SELECT id FROM teams WHERE code='HAI'),'2026-06-20 01:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.0),
('group','D',32,(SELECT id FROM teams WHERE code='TUR'),(SELECT id FROM teams WHERE code='PAR'),'2026-06-20 04:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('group','E',33,(SELECT id FROM teams WHERE code='GER'),(SELECT id FROM teams WHERE code='CIV'),'2026-06-20 20:00:00+00','BMO Field','Toronto','Canada',1.0),
('group','F',34,(SELECT id FROM teams WHERE code='NED'),(SELECT id FROM teams WHERE code='UKR'),'2026-06-20 17:00:00+00','NRG Stadium','Houston','USA',1.0),
('group','E',35,(SELECT id FROM teams WHERE code='ECU'),(SELECT id FROM teams WHERE code='CUW'),'2026-06-21 00:00:00+00','Arrowhead Stadium','Kansas City','USA',1.0),
('group','F',36,(SELECT id FROM teams WHERE code='TUN'),(SELECT id FROM teams WHERE code='JPN'),'2026-06-21 04:00:00+00','Estadio BBVA','Monterrey','Mexico',1.0),
('group','G',37,(SELECT id FROM teams WHERE code='BEL'),(SELECT id FROM teams WHERE code='IRN'),'2026-06-21 19:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('group','H',38,(SELECT id FROM teams WHERE code='ESP'),(SELECT id FROM teams WHERE code='KSA'),'2026-06-21 16:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('group','H',39,(SELECT id FROM teams WHERE code='URU'),(SELECT id FROM teams WHERE code='CPV'),'2026-06-21 22:00:00+00','Hard Rock Stadium','Miami','USA',1.0),
('group','G',40,(SELECT id FROM teams WHERE code='NZL'),(SELECT id FROM teams WHERE code='EGY'),'2026-06-22 01:00:00+00','BC Place','Vancouver','Canada',1.0),
('group','I',41,(SELECT id FROM teams WHERE code='FRA'),(SELECT id FROM teams WHERE code='IRQ'),'2026-06-22 21:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.0),
('group','J',42,(SELECT id FROM teams WHERE code='ARG'),(SELECT id FROM teams WHERE code='AUT'),'2026-06-22 17:00:00+00','AT&T Stadium','Dallas','USA',1.0),
('group','I',43,(SELECT id FROM teams WHERE code='NOR'),(SELECT id FROM teams WHERE code='SEN'),'2026-06-23 00:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('group','J',44,(SELECT id FROM teams WHERE code='JOR'),(SELECT id FROM teams WHERE code='ALG'),'2026-06-23 03:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('group','K',45,(SELECT id FROM teams WHERE code='POR'),(SELECT id FROM teams WHERE code='UZB'),'2026-06-23 17:00:00+00','NRG Stadium','Houston','USA',1.0),
('group','L',46,(SELECT id FROM teams WHERE code='ENG'),(SELECT id FROM teams WHERE code='GHA'),'2026-06-23 20:00:00+00','Gillette Stadium','Boston','USA',1.0),
('group','L',47,(SELECT id FROM teams WHERE code='PAN'),(SELECT id FROM teams WHERE code='CRO'),'2026-06-23 23:00:00+00','BMO Field','Toronto','Canada',1.0),
('group','K',48,(SELECT id FROM teams WHERE code='COL'),(SELECT id FROM teams WHERE code='COD'),'2026-06-24 02:00:00+00','Estadio Akron','Guadalajara','Mexico',1.0),
-- MATCHDAY 3
('group','B',49,(SELECT id FROM teams WHERE code='SUI'),(SELECT id FROM teams WHERE code='CAN'),'2026-06-24 19:00:00+00','BC Place','Vancouver','Canada',1.0),
('group','B',50,(SELECT id FROM teams WHERE code='ITA'),(SELECT id FROM teams WHERE code='QAT'),'2026-06-24 19:00:00+00','Lumen Field','Seattle','USA',1.0),
('group','C',51,(SELECT id FROM teams WHERE code='SCO'),(SELECT id FROM teams WHERE code='BRA'),'2026-06-24 22:00:00+00','Hard Rock Stadium','Miami','USA',1.0),
('group','C',52,(SELECT id FROM teams WHERE code='MAR'),(SELECT id FROM teams WHERE code='HAI'),'2026-06-24 22:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('group','A',53,(SELECT id FROM teams WHERE code='DEN'),(SELECT id FROM teams WHERE code='MEX'),'2026-06-25 01:00:00+00','Estadio Azteca','Cidade do Mexico','Mexico',1.0),
('group','A',54,(SELECT id FROM teams WHERE code='RSA'),(SELECT id FROM teams WHERE code='KOR'),'2026-06-25 01:00:00+00','Estadio BBVA','Monterrey','Mexico',1.0),
('group','E',55,(SELECT id FROM teams WHERE code='ECU'),(SELECT id FROM teams WHERE code='GER'),'2026-06-25 20:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('group','E',56,(SELECT id FROM teams WHERE code='CUW'),(SELECT id FROM teams WHERE code='CIV'),'2026-06-25 20:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.0),
('group','F',57,(SELECT id FROM teams WHERE code='JPN'),(SELECT id FROM teams WHERE code='UKR'),'2026-06-25 23:00:00+00','AT&T Stadium','Dallas','USA',1.0),
('group','F',58,(SELECT id FROM teams WHERE code='TUN'),(SELECT id FROM teams WHERE code='NED'),'2026-06-25 23:00:00+00','Arrowhead Stadium','Kansas City','USA',1.0),
('group','D',59,(SELECT id FROM teams WHERE code='TUR'),(SELECT id FROM teams WHERE code='USA'),'2026-06-26 02:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('group','D',60,(SELECT id FROM teams WHERE code='PAR'),(SELECT id FROM teams WHERE code='AUS'),'2026-06-26 02:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('group','I',61,(SELECT id FROM teams WHERE code='NOR'),(SELECT id FROM teams WHERE code='FRA'),'2026-06-26 19:00:00+00','Gillette Stadium','Boston','USA',1.0),
('group','I',62,(SELECT id FROM teams WHERE code='SEN'),(SELECT id FROM teams WHERE code='IRQ'),'2026-06-26 19:00:00+00','BMO Field','Toronto','Canada',1.0),
('group','H',63,(SELECT id FROM teams WHERE code='CPV'),(SELECT id FROM teams WHERE code='KSA'),'2026-06-27 00:00:00+00','NRG Stadium','Houston','USA',1.0),
('group','H',64,(SELECT id FROM teams WHERE code='URU'),(SELECT id FROM teams WHERE code='ESP'),'2026-06-27 00:00:00+00','Estadio Akron','Guadalajara','Mexico',1.0),
('group','G',65,(SELECT id FROM teams WHERE code='EGY'),(SELECT id FROM teams WHERE code='IRN'),'2026-06-27 03:00:00+00','Lumen Field','Seattle','USA',1.0),
('group','G',66,(SELECT id FROM teams WHERE code='NZL'),(SELECT id FROM teams WHERE code='BEL'),'2026-06-27 03:00:00+00','BC Place','Vancouver','Canada',1.0),
('group','K',67,(SELECT id FROM teams WHERE code='COL'),(SELECT id FROM teams WHERE code='POR'),'2026-06-27 23:30:00+00','Hard Rock Stadium','Miami','USA',1.0),
('group','K',68,(SELECT id FROM teams WHERE code='COD'),(SELECT id FROM teams WHERE code='UZB'),'2026-06-27 23:30:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('group','L',69,(SELECT id FROM teams WHERE code='PAN'),(SELECT id FROM teams WHERE code='ENG'),'2026-06-27 21:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('group','L',70,(SELECT id FROM teams WHERE code='CRO'),(SELECT id FROM teams WHERE code='GHA'),'2026-06-27 21:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.0),
('group','J',71,(SELECT id FROM teams WHERE code='ALG'),(SELECT id FROM teams WHERE code='AUT'),'2026-06-28 02:00:00+00','Arrowhead Stadium','Kansas City','USA',1.0),
('group','J',72,(SELECT id FROM teams WHERE code='JOR'),(SELECT id FROM teams WHERE code='ARG'),'2026-06-28 02:00:00+00','AT&T Stadium','Dallas','USA',1.0),
-- ROUND OF 32
('round_of_32',NULL,73,NULL,NULL,'2026-06-28 19:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('round_of_32',NULL,74,NULL,NULL,'2026-06-29 20:30:00+00','Gillette Stadium','Boston','USA',1.0),
('round_of_32',NULL,75,NULL,NULL,'2026-06-30 01:00:00+00','Estadio BBVA','Monterrey','Mexico',1.0),
('round_of_32',NULL,76,NULL,NULL,'2026-06-29 17:00:00+00','NRG Stadium','Houston','USA',1.0),
('round_of_32',NULL,77,NULL,NULL,'2026-06-30 21:00:00+00','MetLife Stadium','Nova York','USA',1.0),
('round_of_32',NULL,78,NULL,NULL,'2026-06-30 17:00:00+00','AT&T Stadium','Dallas','USA',1.0),
('round_of_32',NULL,79,NULL,NULL,'2026-07-01 01:00:00+00','Estadio Azteca','Cidade do Mexico','Mexico',1.0),
('round_of_32',NULL,80,NULL,NULL,'2026-07-01 16:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.0),
('round_of_32',NULL,81,NULL,NULL,'2026-07-02 00:00:00+00','Levis Stadium','San Francisco','USA',1.0),
('round_of_32',NULL,82,NULL,NULL,'2026-07-01 20:00:00+00','Lumen Field','Seattle','USA',1.0),
('round_of_32',NULL,83,NULL,NULL,'2026-07-02 23:00:00+00','BMO Field','Toronto','Canada',1.0),
('round_of_32',NULL,84,NULL,NULL,'2026-07-02 19:00:00+00','SoFi Stadium','Los Angeles','USA',1.0),
('round_of_32',NULL,85,NULL,NULL,'2026-07-03 03:00:00+00','BC Place','Vancouver','Canada',1.0),
('round_of_32',NULL,86,NULL,NULL,'2026-07-03 22:00:00+00','Hard Rock Stadium','Miami','USA',1.0),
('round_of_32',NULL,87,NULL,NULL,'2026-07-04 01:30:00+00','Arrowhead Stadium','Kansas City','USA',1.0),
('round_of_32',NULL,88,NULL,NULL,'2026-07-03 18:00:00+00','AT&T Stadium','Dallas','USA',1.0),
-- ROUND OF 16
('round_of_16',NULL,89,NULL,NULL,'2026-07-04 21:00:00+00','Lincoln Financial Field','Filadelfia','USA',1.5),
('round_of_16',NULL,90,NULL,NULL,'2026-07-04 17:00:00+00','NRG Stadium','Houston','USA',1.5),
('round_of_16',NULL,91,NULL,NULL,'2026-07-05 20:00:00+00','MetLife Stadium','Nova York','USA',1.5),
('round_of_16',NULL,92,NULL,NULL,'2026-07-06 00:00:00+00','Estadio Azteca','Cidade do Mexico','Mexico',1.5),
('round_of_16',NULL,93,NULL,NULL,'2026-07-06 19:00:00+00','AT&T Stadium','Dallas','USA',1.5),
('round_of_16',NULL,94,NULL,NULL,'2026-07-07 00:00:00+00','Lumen Field','Seattle','USA',1.5),
('round_of_16',NULL,95,NULL,NULL,'2026-07-07 16:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',1.5),
('round_of_16',NULL,96,NULL,NULL,'2026-07-07 20:00:00+00','BC Place','Vancouver','Canada',1.5),
-- QUARTER-FINALS
('quarter_final',NULL,97,NULL,NULL,'2026-07-09 20:00:00+00','Gillette Stadium','Boston','USA',2.0),
('quarter_final',NULL,98,NULL,NULL,'2026-07-10 19:00:00+00','SoFi Stadium','Los Angeles','USA',2.0),
('quarter_final',NULL,99,NULL,NULL,'2026-07-11 21:00:00+00','Hard Rock Stadium','Miami','USA',2.0),
('quarter_final',NULL,100,NULL,NULL,'2026-07-12 01:00:00+00','Arrowhead Stadium','Kansas City','USA',2.0),
-- SEMI-FINALS
('semi_final',NULL,101,NULL,NULL,'2026-07-14 19:00:00+00','AT&T Stadium','Dallas','USA',2.5),
('semi_final',NULL,102,NULL,NULL,'2026-07-15 19:00:00+00','Mercedes-Benz Stadium','Atlanta','USA',2.5),
-- THIRD PLACE
('third_place',NULL,103,NULL,NULL,'2026-07-18 21:00:00+00','Hard Rock Stadium','Miami','USA',1.5),
-- FINAL
('final',NULL,104,NULL,NULL,'2026-07-19 19:00:00+00','MetLife Stadium','Nova York','USA',3.0)
;

-- Verify counts
DO $$
DECLARE
  team_count INTEGER;
  match_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count FROM public.teams;
  SELECT COUNT(*) INTO match_count FROM public.matches;
  RAISE NOTICE 'Setup completo! % selecoes e % jogos criados.', team_count, match_count;
END $$;
