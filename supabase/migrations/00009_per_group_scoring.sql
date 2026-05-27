-- ============================================================
-- 00009_per_group_scoring.sql
-- Pontuacao POR BOLAO: cada bolao usa a sua scoring_config
-- (vencedor/placar exato/artilheiro) para o ranking dos membros.
--
-- - profiles + global_leaderboard: continuam na pontuacao PADRAO (ranking geral).
-- - group_members.total_points: recalculado com a config do PROPRIO bolao,
--   reaproveitando os acertos ja marcados em predictions/scorer_predictions
--   (is_correct_winner / is_exact_score / is_correct) — que NAO dependem da config.
-- - Bracket (campeao/vice/3o) segue padrao (15/8/5) em todos os boloes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.recompute_totals()
RETURNS VOID AS $$
DECLARE grp RECORD;
BEGIN
  -- ---- Totais PADRAO por usuario (profiles + leaderboard geral) ----
  DROP TABLE IF EXISTS _totals;
  CREATE TEMP TABLE _totals AS
  WITH pred AS (
    SELECT user_id,
           COALESCE(SUM(points_earned), 0) AS pts,
           COUNT(*) FILTER (WHERE is_correct_winner IS NOT NULL) AS total_preds,
           COUNT(*) FILTER (WHERE is_correct_winner) AS winners,
           COUNT(*) FILTER (WHERE is_exact_score) AS exacts
    FROM public.predictions GROUP BY user_id
  ),
  scr AS (
    SELECT user_id, COALESCE(SUM(points_earned), 0) AS pts,
           COUNT(*) FILTER (WHERE is_correct) AS correct_scorers
    FROM public.scorer_predictions GROUP BY user_id
  ),
  brk AS (SELECT user_id, COALESCE(points_earned, 0) AS pts FROM public.bracket_predictions)
  SELECT u.id AS user_id,
    COALESCE(pred.pts,0) + COALESCE(scr.pts,0) + COALESCE(brk.pts,0) AS total_points,
    COALESCE(pred.total_preds,0) AS total_predictions,
    COALESCE(pred.winners,0) AS winners,
    COALESCE(pred.exacts,0) AS exacts,
    COALESCE(scr.correct_scorers,0) AS correct_scorers
  FROM auth.users u
  LEFT JOIN pred ON pred.user_id = u.id
  LEFT JOIN scr  ON scr.user_id  = u.id
  LEFT JOIN brk  ON brk.user_id  = u.id;

  UPDATE public.profiles pr
  SET total_points = t.total_points, total_predictions = t.total_predictions,
      correct_predictions = t.winners, exact_scores = t.exacts, updated_at = now()
  FROM _totals t WHERE pr.id = t.user_id;

  UPDATE public.global_leaderboard gl
  SET total_points = t.total_points, total_predictions = t.total_predictions,
      correct_winners = t.winners, exact_scores = t.exacts,
      correct_scorers = t.correct_scorers, updated_at = now()
  FROM _totals t WHERE gl.user_id = t.user_id;

  -- ---- Pontuacao POR BOLAO (config do proprio bolao) ----
  DROP TABLE IF EXISTS _gm;
  CREATE TEMP TABLE _gm AS
  SELECT gm.id AS gm_id,
    -- placar (vencedor + exato) com a config do bolao
    COALESCE((
      SELECT SUM(FLOOR((
          (CASE WHEN p.is_correct_winner THEN COALESCE((g.scoring_config->>'correct_winner')::numeric, 3) ELSE 0 END)
        + (CASE WHEN p.is_exact_score   THEN COALESCE((g.scoring_config->>'exact_score')::numeric, 5)   ELSE 0 END)
      ) * m.score_multiplier))
      FROM public.predictions p
      JOIN public.matches m ON m.id = p.match_id AND m.status = 'finished'
      WHERE p.user_id = gm.user_id
    ), 0)
    -- artilheiro com a config do bolao
    + COALESCE((
      SELECT SUM(FLOOR(COALESCE((g.scoring_config->>'correct_scorer')::numeric, 2) * m.score_multiplier))
      FROM public.scorer_predictions sp
      JOIN public.matches m ON m.id = sp.match_id AND m.status = 'finished'
      WHERE sp.user_id = gm.user_id AND sp.is_correct
    ), 0)
    -- bracket (padrao)
    + COALESCE((
      SELECT bp.points_earned FROM public.bracket_predictions bp WHERE bp.user_id = gm.user_id
    ), 0)
    AS total
  FROM public.group_members gm
  JOIN public.groups g ON g.id = gm.group_id;

  UPDATE public.group_members gm
  SET total_points = _gm.total
  FROM _gm WHERE gm.id = _gm.gm_id;

  -- ---- Ranks ----
  PERFORM public.recalculate_leaderboard_ranks();
  FOR grp IN SELECT id FROM public.groups LOOP
    PERFORM public.recalculate_group_ranks(grp.id);
  END LOOP;

  DROP TABLE IF EXISTS _totals;
  DROP TABLE IF EXISTS _gm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mantem a blindagem de permissoes
REVOKE EXECUTE ON FUNCTION public.recompute_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_totals() TO service_role;
