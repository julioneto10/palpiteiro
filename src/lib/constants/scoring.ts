export const DEFAULT_SCORING = {
  // Padrao do sistema: 1 pt vencedor + 2 pts placar exato (exato total = 3),
  // sem artilheiro. Mesma pontuacao do Bolão dos guerreiros — agora e o padrao
  // de todo bolao novo e o fallback de boloes sem config propria.
  correct_winner: 1,
  exact_score: 2,
  correct_scorer: 0,
  multipliers: {
    group: 1.0,
    round_of_32: 1.0,
    round_of_16: 1.5,
    quarter_final: 2.0,
    semi_final: 2.5,
    third_place: 1.5,
    final: 3.0,
  },
} as const;

/**
 * Hint de "Pontuacao possivel" mostrado no formulario de palpite. Reflete a
 * config do bolao ativo (Bolão dos guerreiros): 1 pt vencedor + 2 pts placar
 * exato (exato total = 1+2 = 3), sem artilheiro. A pontuacao REAL de cada
 * bolao continua sendo a sua scoring_config no banco (usada no recompute).
 */
export const PREDICTION_HINT_SCORING = {
  correct_winner: 1,
  exact_score: 2,
  correct_scorer: 0,
} as const;

/**
 * Margem de seguranca: os palpites de um jogo fecham este tanto de tempo
 * ANTES do kickoff (nao no apito). Aplicada nas actions e na UI. O backstop
 * no banco (RLS) usa kickoff > now(); pra casar exatamente, ver migration
 * 00012 (opcional — o app ja enforce os 10 min em toda escrita).
 */
export const PREDICTION_CUTOFF_MS = 10 * 60 * 1000; // 10 minutos

export type ScoringConfig = {
  correct_winner: number;
  exact_score: number;
  correct_scorer: number;
  multipliers: Record<MatchStage, number>;
};

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Fase de Grupos",
  round_of_32: "32 avos de Final",
  round_of_16: "Oitavas de Final",
  quarter_final: "Quartas de Final",
  semi_final: "Semifinal",
  third_place: "Disputa de 3o Lugar",
  final: "Final",
};

export function getScoringConfig(
  customConfig: Partial<ScoringConfig> | null | undefined
): ScoringConfig {
  if (!customConfig) return { ...DEFAULT_SCORING };
  return {
    correct_winner: customConfig.correct_winner ?? DEFAULT_SCORING.correct_winner,
    exact_score: customConfig.exact_score ?? DEFAULT_SCORING.exact_score,
    correct_scorer: customConfig.correct_scorer ?? DEFAULT_SCORING.correct_scorer,
    multipliers: {
      ...DEFAULT_SCORING.multipliers,
      ...customConfig.multipliers,
    },
  };
}
