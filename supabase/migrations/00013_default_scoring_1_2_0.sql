-- 00013_default_scoring_1_2_0.sql
-- Padrao de pontuacao do sistema passa a ser: 1 pt vencedor + 2 pts placar
-- exato (exato total = 3), sem artilheiro — igual ao Bolão dos guerreiros.
--
-- CONTEXTO: o score_match (definido em 00006) usa CONSTANTES 3/5/2 e e ele quem
-- grava predictions.points_earned, que o app EXIBE ("Placar exato! +N pontos").
-- Como todos os boloes agora usam a config 1/2/0, o points_earned precisa
-- refletir o mesmo padrao. A pontuacao POR BOLAO (group_members.total_points)
-- ja e recalculada pela recompute_totals (00009) com a scoring_config de cada
-- bolao — esta migration so alinha o points_earned/leaderboard "padrao".
--
-- Corpo identico ao de 00006; mudam apenas as 3 constantes.

CREATE OR REPLACE FUNCTION public.score_match(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_winner_pts CONSTANT INTEGER := 1;  -- era 3
  v_exact_pts  CONSTANT INTEGER := 2;  -- era 5 (exato total = vencedor + exato = 3)
  v_scorer_pts CONSTANT INTEGER := 0;  -- era 2 (artilheiro desativado no padrao)
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Jogo nao finalizado (ou sem placar): zera qualquer pontuacao previa do jogo.
  IF v_match.status <> 'finished'
     OR v_match.home_score IS NULL
     OR v_match.away_score IS NULL THEN
    UPDATE public.predictions
      SET points_earned = 0, is_correct_winner = NULL, is_exact_score = NULL, updated_at = now()
      WHERE match_id = p_match_id;
    UPDATE public.scorer_predictions
      SET points_earned = 0, is_correct = NULL
      WHERE match_id = p_match_id;
    RETURN;
  END IF;

  -- Palpites de placar
  UPDATE public.predictions p
  SET
    is_correct_winner = (
      sign(v_match.home_score - v_match.away_score)
        = sign(p.predicted_home_score - p.predicted_away_score)
    ),
    is_exact_score = (
      v_match.home_score = p.predicted_home_score
        AND v_match.away_score = p.predicted_away_score
    ),
    points_earned = FLOOR(
      (
        CASE WHEN sign(v_match.home_score - v_match.away_score)
                  = sign(p.predicted_home_score - p.predicted_away_score)
             THEN v_winner_pts ELSE 0 END
        +
        CASE WHEN v_match.home_score = p.predicted_home_score
                  AND v_match.away_score = p.predicted_away_score
             THEN v_exact_pts ELSE 0 END
      ) * v_match.score_multiplier
    ),
    updated_at = now()
  WHERE p.match_id = p_match_id;

  -- Palpites de artilheiro (acerta se o jogador marcou gol no jogo)
  UPDATE public.scorer_predictions sp
  SET
    is_correct = EXISTS (
      SELECT 1 FROM public.match_events me
      WHERE me.match_id = p_match_id
        AND me.player_id = sp.player_id
        AND me.event_type IN ('goal', 'penalty_goal')
    ),
    points_earned = CASE WHEN EXISTS (
      SELECT 1 FROM public.match_events me
      WHERE me.match_id = p_match_id
        AND me.player_id = sp.player_id
        AND me.event_type IN ('goal', 'penalty_goal')
    ) THEN FLOOR(v_scorer_pts * v_match.score_multiplier) ELSE 0 END
  WHERE sp.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reaplica a pontuacao de todos os jogos ja finalizados com o novo padrao e
-- recalcula os totais (profiles, global_leaderboard e group_members por bolao).
DO $$
DECLARE m RECORD;
BEGIN
  FOR m IN SELECT id FROM public.matches WHERE status = 'finished' LOOP
    PERFORM public.score_match(m.id);
  END LOOP;
END $$;

SELECT public.recompute_totals();
