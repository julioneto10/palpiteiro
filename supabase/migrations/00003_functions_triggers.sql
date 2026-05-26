-- ============================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================

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

-- ============================================================
-- CALCULATE POINTS AFTER MATCH FINISHES
-- ============================================================

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

  -- Get scoring values (use defaults if no custom config)
  v_winner_pts := COALESCE((p_scoring_config->>'correct_winner')::INTEGER, 3);
  v_exact_pts := COALESCE((p_scoring_config->>'exact_score')::INTEGER, 5);
  v_scorer_pts := COALESCE((p_scoring_config->>'correct_scorer')::INTEGER, 2);

  FOR v_prediction IN
    SELECT * FROM public.predictions WHERE match_id = p_match_id
  LOOP
    v_points := 0;
    v_correct_winner := false;
    v_exact_score := false;

    -- Check winner prediction
    IF (v_match.home_score > v_match.away_score AND v_prediction.predicted_home_score > v_prediction.predicted_away_score)
       OR (v_match.home_score < v_match.away_score AND v_prediction.predicted_home_score < v_prediction.predicted_away_score)
       OR (v_match.home_score = v_match.away_score AND v_prediction.predicted_home_score = v_prediction.predicted_away_score)
    THEN
      v_correct_winner := true;
      v_points := v_points + v_winner_pts;
    END IF;

    -- Check exact score
    IF v_match.home_score = v_prediction.predicted_home_score
       AND v_match.away_score = v_prediction.predicted_away_score
    THEN
      v_exact_score := true;
      v_points := v_points + v_exact_pts;
    END IF;

    -- Apply stage multiplier
    v_points := FLOOR(v_points * v_match.score_multiplier);

    UPDATE public.predictions
    SET points_earned = v_points,
        is_correct_winner = v_correct_winner,
        is_exact_score = v_exact_score,
        updated_at = now()
    WHERE id = v_prediction.id;

    -- Update user profile totals
    UPDATE public.profiles
    SET total_points = total_points + v_points,
        total_predictions = total_predictions + 1,
        correct_predictions = correct_predictions + CASE WHEN v_correct_winner THEN 1 ELSE 0 END,
        exact_scores = exact_scores + CASE WHEN v_exact_score THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE id = v_prediction.user_id;

    -- Update global leaderboard
    UPDATE public.global_leaderboard
    SET total_points = total_points + v_points,
        total_predictions = total_predictions + 1,
        correct_winners = correct_winners + CASE WHEN v_correct_winner THEN 1 ELSE 0 END,
        exact_scores = exact_scores + CASE WHEN v_exact_score THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE user_id = v_prediction.user_id;

    -- Update group member points
    UPDATE public.group_members gm
    SET total_points = gm.total_points + v_points
    WHERE gm.user_id = v_prediction.user_id;
  END LOOP;

  -- Scorer predictions
  FOR v_prediction IN
    SELECT sp.* FROM public.scorer_predictions sp
    WHERE sp.match_id = p_match_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.match_events me
      WHERE me.match_id = p_match_id
        AND me.player_id = v_prediction.player_id
        AND me.event_type IN ('goal', 'penalty_goal')
    ) THEN
      UPDATE public.scorer_predictions
      SET is_correct = true,
          points_earned = FLOOR(v_scorer_pts * v_match.score_multiplier)
      WHERE id = v_prediction.id;

      UPDATE public.profiles
      SET total_points = total_points + FLOOR(v_scorer_pts * v_match.score_multiplier),
          updated_at = now()
      WHERE id = v_prediction.user_id;

      UPDATE public.global_leaderboard
      SET total_points = total_points + FLOOR(v_scorer_pts * v_match.score_multiplier),
          correct_scorers = correct_scorers + 1,
          updated_at = now()
      WHERE user_id = v_prediction.user_id;

      UPDATE public.group_members gm
      SET total_points = gm.total_points + FLOOR(v_scorer_pts * v_match.score_multiplier)
      WHERE gm.user_id = v_prediction.user_id;
    ELSE
      UPDATE public.scorer_predictions
      SET is_correct = false, points_earned = 0
      WHERE id = v_prediction.id;
    END IF;
  END LOOP;

  -- Recalculate ranks
  PERFORM public.recalculate_leaderboard_ranks();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECALCULATE GLOBAL LEADERBOARD RANKS
-- ============================================================

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

-- ============================================================
-- RECALCULATE GROUP MEMBER RANKS
-- ============================================================

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

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_matches
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_predictions
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_groups
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_disputes
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
