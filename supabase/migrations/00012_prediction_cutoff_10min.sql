-- ============================================================
-- 00012_prediction_cutoff_10min.sql
-- Margem de seguranca: palpites fecham 10 MIN ANTES do kickoff (nao no
-- apito). O app ja enforce isso em toda escrita (actions savePredictionScore
-- / upsertPrediction). Este arquivo so aperta o BACKSTOP no banco (RLS) pra
-- casar exatamente — opcional, mas recomendado.
--
-- DDL nao roda via service key: COLAR no SQL editor do Supabase.
-- https://supabase.com/dashboard/project/zpwjfnerdcnaxvqgphku/sql/new
-- ============================================================

-- PREDICTIONS (placar)
DROP POLICY IF EXISTS "Users can insert own predictions before kickoff" ON public.predictions;
CREATE POLICY "Users can insert own predictions before kickoff"
  ON public.predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id)
        > now() + interval '10 minutes'
  );

DROP POLICY IF EXISTS "Users can update own predictions before kickoff" ON public.predictions;
CREATE POLICY "Users can update own predictions before kickoff"
  ON public.predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id)
        > now() + interval '10 minutes'
  );

-- SCORER PREDICTIONS (artilheiro) — mantido por consistencia, mesmo o
-- Guerreiros nao usando artilheiro.
DROP POLICY IF EXISTS "Users can insert own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can insert own scorer predictions before kickoff"
  ON public.scorer_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id)
        > now() + interval '10 minutes'
  );

DROP POLICY IF EXISTS "Users can update own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can update own scorer predictions before kickoff"
  ON public.scorer_predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id)
        > now() + interval '10 minutes'
  );

DROP POLICY IF EXISTS "Users can delete own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can delete own scorer predictions before kickoff"
  ON public.scorer_predictions FOR DELETE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id)
        > now() + interval '10 minutes'
  );
