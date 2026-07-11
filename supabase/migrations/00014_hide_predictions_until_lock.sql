-- ============================================================
-- 00014_hide_predictions_until_lock.sql
-- Esconde palpites ALHEIOS ate o fechamento (10 min antes do kickoff).
--
-- Antes: "Predictions viewable by everyone" USING (true) — qualquer um
-- lia o palpite de qualquer um a qualquer momento, inclusive de jogos
-- futuros (dava pra copiar palpite antes do jogo comecar).
--
-- Agora: o proprio palpite e sempre visivel; o dos outros so aparece
-- quando a ESCRITA ja fechou (kickoff_at <= now() + 10 min, mesmo corte
-- do 00012) — zero janela pra ver o alheio e ainda editar o proprio.
--
-- bracket_predictions (campeao/vice/3o) fica como esta: a escrita travou
-- no inicio da Copa, entao a leitura publica nao vaza nada editavel.
--
-- DDL nao roda via service key: COLAR no SQL editor do Supabase.
-- https://supabase.com/dashboard/project/zpwjfnerdcnaxvqgphku/sql/new
-- ============================================================

-- PREDICTIONS (placar)
DROP POLICY IF EXISTS "Predictions viewable by everyone" ON public.predictions;
CREATE POLICY "Predictions visible after lock or own"
  ON public.predictions FOR SELECT USING (
    auth.uid() = user_id
    OR (SELECT kickoff_at FROM public.matches WHERE id = match_id)
       <= now() + interval '10 minutes'
  );

-- SCORER PREDICTIONS (artilheiro) — consistencia com o resto
DROP POLICY IF EXISTS "Scorer predictions viewable by everyone" ON public.scorer_predictions;
CREATE POLICY "Scorer predictions visible after lock or own"
  ON public.scorer_predictions FOR SELECT USING (
    auth.uid() = user_id
    OR (SELECT kickoff_at FROM public.matches WHERE id = match_id)
       <= now() + interval '10 minutes'
  );
