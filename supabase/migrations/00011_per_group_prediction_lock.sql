-- ============================================================
-- 00011_per_group_prediction_lock.sql
-- Trava de palpites POR BOLAO.
--
-- O palpite e unico por (usuario, jogo) na tabela `predictions` — nao e
-- por bolao. Entao "travar um bolao" = bloquear a ESCRITA de palpite de
-- qualquer usuario que seja MEMBRO de um bolao com predictions_locked = true.
-- Leitura (SELECT) continua liberada — o ranking e a auditoria seguem visiveis.
--
-- A trava NAO substitui a trava por jogo (kickoff_at > now()); ela soma:
-- depois de aplicada, ligar/desligar e so um UPDATE em groups.predictions_locked
-- (nao precisa de nova migration).
-- ============================================================

-- 1. Flag por bolao
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS predictions_locked BOOLEAN NOT NULL DEFAULT false;

-- 2. O usuario pertence a algum bolao travado?
--    SECURITY DEFINER pra enxergar group_members/groups sem depender da RLS
--    do proprio usuario (e evitar recursao de policy). STABLE: nao escreve.
CREATE OR REPLACE FUNCTION public.user_in_locked_group(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    JOIN public.groups g ON g.id = gm.group_id
    WHERE gm.user_id = uid
      AND g.predictions_locked
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Recria as policies de ESCRITA somando "and not user_in_locked_group".
--    Mantem 1:1 a checagem de kickoff existente (00002_rls_policies.sql).

-- PREDICTIONS ------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own predictions before kickoff" ON public.predictions;
CREATE POLICY "Users can insert own predictions before kickoff"
  ON public.predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
    AND NOT public.user_in_locked_group(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own predictions before kickoff" ON public.predictions;
CREATE POLICY "Users can update own predictions before kickoff"
  ON public.predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
    AND NOT public.user_in_locked_group(auth.uid())
  );

-- SCORER PREDICTIONS -----------------------------------------
DROP POLICY IF EXISTS "Users can insert own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can insert own scorer predictions before kickoff"
  ON public.scorer_predictions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
    AND NOT public.user_in_locked_group(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can update own scorer predictions before kickoff"
  ON public.scorer_predictions FOR UPDATE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
    AND NOT public.user_in_locked_group(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own scorer predictions before kickoff" ON public.scorer_predictions;
CREATE POLICY "Users can delete own scorer predictions before kickoff"
  ON public.scorer_predictions FOR DELETE USING (
    auth.uid() = user_id
    AND (SELECT kickoff_at FROM public.matches WHERE id = match_id) > now()
    AND NOT public.user_in_locked_group(auth.uid())
  );

-- 4. Trava o Bolao dos guerreiros agora.
--    Pra liberar depois: UPDATE public.groups SET predictions_locked = false
--    WHERE id = '7a8cb3af-7238-4df1-b267-fe192d69843e';
UPDATE public.groups
  SET predictions_locked = true
  WHERE id = '7a8cb3af-7238-4df1-b267-fe192d69843e';
