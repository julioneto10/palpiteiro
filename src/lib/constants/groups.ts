/**
 * Bolão principal (Bolão dos guerreiros). É o bolão "oficial" exibido como
 * ranking padrão do app — a pontuação dele usa a scoring_config do próprio
 * bolão (vencedor 1 / placar exato 3, sem artilheiro), recalculada em
 * group_members.total_points pelo recompute. NÃO confundir com o
 * global_leaderboard, que soma a pontuação PADRÃO (3/5/2) de todos os bolões.
 */
export const GUERREIROS_GROUP_ID = "7a8cb3af-7238-4df1-b267-fe192d69843e";
