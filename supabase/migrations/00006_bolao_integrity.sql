-- ============================================================
-- 00006_bolao_integrity.sql
-- Integridade + auditoria do bolao
--
-- Modelo: o ranking e uma FUNCAO PURA de (palpites travados) +
-- (resultados oficiais). Nada de saldo incremental que pode derivar.
-- Recalcular e sempre idempotente.
--
-- Pontuacao FIXA (padrao), nao configuravel por bolao:
--   vencedor = 3 | placar exato = +5 | artilheiro do jogo = 2
--   x multiplicador de fase (matches.score_multiplier)
--   bracket: campeao = 15 | vice = 8 | 3o lugar = 5
-- ============================================================

-- ============================================================
-- 1. FLAG DE ADMIN DO APP (organizador) + protecao anti-escalada
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Impede que um usuario comum se promova a admin ao atualizar o
-- proprio perfil (a RLS de profiles permite UPDATE do proprio registro).
-- So service_role / postgres / supabase_admin podem mudar is_admin.
-- IMPORTANTE: SECURITY INVOKER (padrao) e obrigatorio aqui. Com SECURITY
-- DEFINER, current_user viraria o dono da funcao e a checagem sempre passaria.
CREATE OR REPLACE FUNCTION public.guard_profile_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    NEW.is_admin := OLD.is_admin; -- silenciosamente ignora a tentativa
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS guard_is_admin ON public.profiles;
CREATE TRIGGER guard_is_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin();

-- ============================================================
-- 2. INICIO DO TORNEIO (para travar palpites de bracket)
-- ============================================================

CREATE OR REPLACE FUNCTION public.tournament_start()
RETURNS TIMESTAMPTZ AS $$
  SELECT COALESCE(MIN(kickoff_at), 'infinity'::timestamptz) FROM public.matches;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 3. AUDITORIA DE RESULTADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.match_result_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('set_result', 'update_result', 'clear_result', 'settle_bracket')),
  old_home INTEGER,
  old_away INTEGER,
  new_home INTEGER,
  new_away INTEGER,
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_result_audit_match ON public.match_result_audit(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_result_audit_created ON public.match_result_audit(created_at DESC);

ALTER TABLE public.match_result_audit ENABLE ROW LEVEL SECURITY;

-- Leitura liberada (transparencia). Escrita SOMENTE via service_role
-- (nenhuma policy de INSERT => bloqueado para anon/authenticated).
DROP POLICY IF EXISTS "Audit readable by all" ON public.match_result_audit;
CREATE POLICY "Audit readable by all"
  ON public.match_result_audit FOR SELECT USING (true);

-- ============================================================
-- 4. PALPITE DE BRACKET (campeao / vice / 3o lugar)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  champion_team_id UUID REFERENCES public.teams(id),
  runner_up_team_id UUID REFERENCES public.teams(id),
  third_team_id UUID REFERENCES public.teams(id),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bracket_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bracket viewable by everyone" ON public.bracket_predictions;
CREATE POLICY "Bracket viewable by everyone"
  ON public.bracket_predictions FOR SELECT USING (true);

-- Insere/atualiza apenas o proprio palpite e SO antes do inicio da Copa.
DROP POLICY IF EXISTS "Bracket insert before start" ON public.bracket_predictions;
CREATE POLICY "Bracket insert before start"
  ON public.bracket_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND now() < public.tournament_start()
  );

DROP POLICY IF EXISTS "Bracket update before start" ON public.bracket_predictions;
CREATE POLICY "Bracket update before start"
  ON public.bracket_predictions FOR UPDATE USING (
    auth.uid() = user_id AND now() < public.tournament_start()
  );

DROP TRIGGER IF EXISTS set_updated_at_bracket ON public.bracket_predictions;
CREATE TRIGGER set_updated_at_bracket
  BEFORE UPDATE ON public.bracket_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. RESULTADO OFICIAL DO TORNEIO (linha unica) p/ settle do bracket
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tournament_result (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  champion_team_id UUID REFERENCES public.teams(id),
  runner_up_team_id UUID REFERENCES public.teams(id),
  third_team_id UUID REFERENCES public.teams(id),
  settled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tournament_result ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tournament result readable" ON public.tournament_result;
CREATE POLICY "Tournament result readable"
  ON public.tournament_result FOR SELECT USING (true);

-- ============================================================
-- 6. PONTUACAO IDEMPOTENTE DE UM JOGO
-- Sobrescreve points_earned do jogo (nunca soma). Rodar N vezes = mesmo resultado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.score_match(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_winner_pts CONSTANT INTEGER := 3;
  v_exact_pts  CONSTANT INTEGER := 5;
  v_scorer_pts CONSTANT INTEGER := 2;
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

-- ============================================================
-- 7. RECALCULO DERIVADO DE TODOS OS TOTAIS (idempotente)
-- Totais = SOMA dos points_earned dos palpites + bracket. Sem += .
-- ============================================================

CREATE OR REPLACE FUNCTION public.recompute_totals()
RETURNS VOID AS $$
DECLARE
  g RECORD;
BEGIN
  DROP TABLE IF EXISTS _totals;
  CREATE TEMP TABLE _totals AS
  WITH pred AS (
    SELECT user_id,
           COALESCE(SUM(points_earned), 0) AS pts,
           COUNT(*) FILTER (WHERE is_correct_winner IS NOT NULL) AS total_preds,
           COUNT(*) FILTER (WHERE is_correct_winner) AS winners,
           COUNT(*) FILTER (WHERE is_exact_score) AS exacts
    FROM public.predictions
    GROUP BY user_id
  ),
  scr AS (
    SELECT user_id,
           COALESCE(SUM(points_earned), 0) AS pts,
           COUNT(*) FILTER (WHERE is_correct) AS correct_scorers
    FROM public.scorer_predictions
    GROUP BY user_id
  ),
  brk AS (
    SELECT user_id, COALESCE(points_earned, 0) AS pts
    FROM public.bracket_predictions
  )
  SELECT
    u.id AS user_id,
    COALESCE(pred.pts, 0) + COALESCE(scr.pts, 0) + COALESCE(brk.pts, 0) AS total_points,
    COALESCE(pred.total_preds, 0) AS total_predictions,
    COALESCE(pred.winners, 0) AS winners,
    COALESCE(pred.exacts, 0) AS exacts,
    COALESCE(scr.correct_scorers, 0) AS correct_scorers
  FROM auth.users u
  LEFT JOIN pred ON pred.user_id = u.id
  LEFT JOIN scr  ON scr.user_id  = u.id
  LEFT JOIN brk  ON brk.user_id  = u.id;

  UPDATE public.profiles pr
  SET total_points = t.total_points,
      total_predictions = t.total_predictions,
      correct_predictions = t.winners,
      exact_scores = t.exacts,
      updated_at = now()
  FROM _totals t WHERE pr.id = t.user_id;

  UPDATE public.global_leaderboard gl
  SET total_points = t.total_points,
      total_predictions = t.total_predictions,
      correct_winners = t.winners,
      exact_scores = t.exacts,
      correct_scorers = t.correct_scorers,
      updated_at = now()
  FROM _totals t WHERE gl.user_id = t.user_id;

  -- 1 bolao: os pontos do membro = total do usuario
  UPDATE public.group_members gm
  SET total_points = t.total_points
  FROM _totals t WHERE gm.user_id = t.user_id;

  PERFORM public.recalculate_leaderboard_ranks();
  FOR g IN SELECT id FROM public.groups LOOP
    PERFORM public.recalculate_group_ranks(g.id);
  END LOOP;

  DROP TABLE IF EXISTS _totals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. APLICAR RESULTADO OFICIAL (transacional + auditado)
-- Unico caminho para mudar o placar de um jogo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_match_result(
  p_match_id           UUID,
  p_home               INTEGER,
  p_away               INTEGER,
  p_scorer_player_ids  UUID[] DEFAULT '{}',
  p_actor              UUID DEFAULT NULL,
  p_status             TEXT DEFAULT 'finished'
)
RETURNS VOID AS $$
DECLARE
  v_old RECORD;
BEGIN
  IF p_home < 0 OR p_away < 0 THEN
    RAISE EXCEPTION 'Placar invalido';
  END IF;

  SELECT home_score, away_score, status INTO v_old
  FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jogo % nao encontrado', p_match_id; END IF;

  UPDATE public.matches
  SET home_score = p_home, away_score = p_away, status = p_status, updated_at = now()
  WHERE id = p_match_id;

  -- Substitui os gols (eventos que gerenciamos pela mesa de resultados)
  DELETE FROM public.match_events
    WHERE match_id = p_match_id AND event_type = 'goal';
  IF array_length(p_scorer_player_ids, 1) IS NOT NULL THEN
    INSERT INTO public.match_events (match_id, event_type, player_id)
    SELECT p_match_id, 'goal', pid FROM unnest(p_scorer_player_ids) AS pid;
  END IF;

  INSERT INTO public.match_result_audit
    (match_id, actor_id, action, old_home, old_away, new_home, new_away, old_status, new_status)
  VALUES (
    p_match_id, p_actor,
    CASE WHEN v_old.status = 'finished' THEN 'update_result' ELSE 'set_result' END,
    v_old.home_score, v_old.away_score, p_home, p_away, v_old.status, p_status
  );

  PERFORM public.score_match(p_match_id);
  PERFORM public.recompute_totals();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. LIMPAR RESULTADO (desfazer) -- tambem auditado
-- ============================================================

CREATE OR REPLACE FUNCTION public.clear_match_result(
  p_match_id UUID,
  p_actor    UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old RECORD;
BEGIN
  SELECT home_score, away_score, status INTO v_old
  FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jogo % nao encontrado', p_match_id; END IF;

  UPDATE public.matches
  SET home_score = NULL, away_score = NULL, status = 'scheduled', updated_at = now()
  WHERE id = p_match_id;

  DELETE FROM public.match_events
    WHERE match_id = p_match_id AND event_type = 'goal';

  INSERT INTO public.match_result_audit
    (match_id, actor_id, action, old_home, old_away, new_home, new_away, old_status, new_status)
  VALUES (
    p_match_id, p_actor, 'clear_result',
    v_old.home_score, v_old.away_score, NULL, NULL, v_old.status, 'scheduled'
  );

  PERFORM public.score_match(p_match_id);
  PERFORM public.recompute_totals();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. SETTLE DO BRACKET (campeao/vice/3o) -- pontua e audita
-- ============================================================

CREATE OR REPLACE FUNCTION public.settle_bracket(
  p_champion  UUID,
  p_runner_up UUID,
  p_third     UUID,
  p_actor     UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_champ_pts  CONSTANT INTEGER := 15;
  v_runner_pts CONSTANT INTEGER := 8;
  v_third_pts  CONSTANT INTEGER := 5;
BEGIN
  INSERT INTO public.tournament_result
    (id, champion_team_id, runner_up_team_id, third_team_id, settled_at, updated_at)
  VALUES (1, p_champion, p_runner_up, p_third, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    champion_team_id  = EXCLUDED.champion_team_id,
    runner_up_team_id = EXCLUDED.runner_up_team_id,
    third_team_id     = EXCLUDED.third_team_id,
    settled_at = now(),
    updated_at = now();

  UPDATE public.bracket_predictions bp
  SET points_earned =
        (CASE WHEN bp.champion_team_id  = p_champion  THEN v_champ_pts  ELSE 0 END)
      + (CASE WHEN bp.runner_up_team_id = p_runner_up THEN v_runner_pts ELSE 0 END)
      + (CASE WHEN bp.third_team_id     = p_third     THEN v_third_pts  ELSE 0 END),
      updated_at = now();

  PERFORM public.recompute_totals();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. REMOVER A FUNCAO ANTIGA BUGADA (somava em todos os grupos)
-- ============================================================

DROP FUNCTION IF EXISTS public.calculate_match_points(UUID, JSONB);

-- ============================================================
-- 12. BLINDAGEM DE PERMISSOES (CRUCIAL)
-- Funcoes privilegiadas so podem ser chamadas pelo service_role.
-- Sem isso, qualquer usuario logado poderia lancar resultado via RPC.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.apply_match_result(UUID, INTEGER, INTEGER, UUID[], UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_match_result(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_bracket(UUID, UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.score_match(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_totals() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_match_result(UUID, INTEGER, INTEGER, UUID[], UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_match_result(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_bracket(UUID, UUID, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.score_match(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_totals() TO service_role;
