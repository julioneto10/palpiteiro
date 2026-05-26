-- ============================================================
-- CORE FOOTBALL DATA
-- ============================================================

CREATE TABLE public.teams (
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

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shirt_number INTEGER,
  position TEXT CHECK (position IN ('GK','DF','MF','FW')),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_players_team ON public.players(team_id);

CREATE TABLE public.matches (
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

CREATE INDEX idx_matches_kickoff ON public.matches(kickoff_at);
CREATE INDEX idx_matches_stage ON public.matches(stage);
CREATE INDEX idx_matches_status ON public.matches(status);

CREATE TABLE public.match_events (
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

CREATE INDEX idx_match_events_match ON public.match_events(match_id);

-- ============================================================
-- USER PROFILES
-- ============================================================

CREATE TABLE public.profiles (
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

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_referral ON public.profiles(referral_code);
CREATE INDEX idx_profiles_total_points ON public.profiles(total_points DESC);

-- ============================================================
-- PREDICTIONS
-- ============================================================

CREATE TABLE public.predictions (
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

CREATE INDEX idx_predictions_user ON public.predictions(user_id);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);

CREATE TABLE public.scorer_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id, player_id)
);

CREATE INDEX idx_scorer_pred_user_match ON public.scorer_predictions(user_id, match_id);

-- ============================================================
-- GROUPS (BOLOES)
-- ============================================================

CREATE TABLE public.groups (
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

CREATE INDEX idx_groups_invite ON public.groups(invite_code);
CREATE INDEX idx_groups_owner ON public.groups(owner_id);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_points ON public.group_members(group_id, total_points DESC);

-- ============================================================
-- 1v1 DISPUTES
-- ============================================================

CREATE TABLE public.disputes (
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

CREATE INDEX idx_disputes_challenger ON public.disputes(challenger_id);
CREATE INDEX idx_disputes_opponent ON public.disputes(opponent_id);

-- ============================================================
-- SOCIAL FEATURES
-- ============================================================

CREATE TABLE public.messages (
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

CREATE INDEX idx_messages_group ON public.messages(group_id, created_at DESC);

CREATE TABLE public.reactions (
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

CREATE INDEX idx_reactions_prediction ON public.reactions(prediction_id);

-- ============================================================
-- GLOBAL LEADERBOARD
-- ============================================================

CREATE TABLE public.global_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_winners INTEGER DEFAULT 0,
  exact_scores INTEGER DEFAULT 0,
  correct_scorers INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leaderboard_rank ON public.global_leaderboard(rank);
CREATE INDEX idx_leaderboard_points ON public.global_leaderboard(total_points DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
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

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
