-- ============================================================
-- verify-integrity.sql
-- Prova as garantias de integridade do bolao.
-- Rode no SQL Editor do Supabase DEPOIS de aplicar a 00006.
-- Tudo roda numa transacao com ROLLBACK no fim: NAO altera dados reais.
-- Pre-requisito: ter pelo menos 1 usuario cadastrado e os jogos seedados.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_user   UUID;
  v_match  UUID;
  v_mult   NUMERIC;
  v_pts    INTEGER;
  v_total1 INTEGER;
  v_total2 INTEGER;
  v_expected INTEGER;
BEGIN
  SELECT id INTO v_user FROM auth.users ORDER BY created_at LIMIT 1;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sem usuarios cadastrados — crie uma conta no app primeiro.';
  END IF;

  SELECT id, score_multiplier INTO v_match, v_mult
  FROM public.matches
  WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL
  ORDER BY kickoff_at LIMIT 1;
  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Sem jogos seedados.';
  END IF;

  -- Palpite exato 2x1 para o usuario de teste
  INSERT INTO public.predictions (user_id, match_id, predicted_home_score, predicted_away_score)
  VALUES (v_user, v_match, 2, 1)
  ON CONFLICT (user_id, match_id)
  DO UPDATE SET predicted_home_score = 2, predicted_away_score = 1;

  -- 1) Lanca o resultado oficial 2x1 (acerto de vencedor + placar exato)
  PERFORM public.apply_match_result(v_match, 2, 1, '{}', v_user);

  v_expected := FLOOR((3 + 5) * v_mult);  -- vencedor(3) + exato(5) x multiplicador
  SELECT points_earned INTO v_pts
  FROM public.predictions WHERE user_id = v_user AND match_id = v_match;
  IF v_pts <> v_expected THEN
    RAISE EXCEPTION 'FALHA pontuacao: esperado %, obtido %', v_expected, v_pts;
  END IF;
  RAISE NOTICE 'OK 1/5: placar exato pontuou % pts (multiplicador %)', v_pts, v_mult;

  -- 2) Idempotencia: recalcular 2x mantem o total
  PERFORM public.recompute_totals();
  SELECT total_points INTO v_total1 FROM public.profiles WHERE id = v_user;
  PERFORM public.recompute_totals();
  SELECT total_points INTO v_total2 FROM public.profiles WHERE id = v_user;
  IF v_total1 <> v_total2 THEN
    RAISE EXCEPTION 'FALHA idempotencia: % vs %', v_total1, v_total2;
  END IF;
  RAISE NOTICE 'OK 2/5: recompute idempotente (total estavel = %)', v_total1;

  -- 3) Auditoria registrou o lancamento
  IF NOT EXISTS (
    SELECT 1 FROM public.match_result_audit
    WHERE match_id = v_match AND actor_id = v_user
  ) THEN
    RAISE EXCEPTION 'FALHA: auditoria nao registrou o lancamento.';
  END IF;
  RAISE NOTICE 'OK 3/5: auditoria registrou o lancamento';

  -- 4) Correcao para 0x0 re-pontua (palpite 2x1 deixa de valer)
  PERFORM public.apply_match_result(v_match, 0, 0, '{}', v_user);
  SELECT points_earned INTO v_pts
  FROM public.predictions WHERE user_id = v_user AND match_id = v_match;
  IF v_pts <> 0 THEN
    RAISE EXCEPTION 'FALHA correcao: esperado 0, obtido %', v_pts;
  END IF;
  RAISE NOTICE 'OK 4/5: correcao de resultado re-pontuou corretamente (agora 0)';

  RAISE NOTICE '---- logica de pontuacao/auditoria: TUDO OK ----';
END $$;

-- 5) Blindagem de permissoes: 'authenticated' NAO pode chamar as funcoes privilegiadas
DO $$
BEGIN
  IF has_function_privilege(
       'authenticated',
       'public.apply_match_result(uuid,integer,integer,uuid[],uuid,text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'FALHA: authenticated consegue executar apply_match_result!';
  END IF;
  IF has_function_privilege(
       'authenticated',
       'public.settle_bracket(uuid,uuid,uuid,uuid)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'FALHA: authenticated consegue executar settle_bracket!';
  END IF;
  RAISE NOTICE 'OK 5/5: usuarios comuns bloqueados das funcoes de resultado';
  RAISE NOTICE '==================== TODOS OS TESTES PASSARAM ====================';
END $$;

ROLLBACK;
