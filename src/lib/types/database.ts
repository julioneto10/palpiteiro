export type MatchStatus =
  | "scheduled"
  | "live"
  | "half_time"
  | "finished"
  | "postponed"
  | "cancelled";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type GroupType = "open" | "private";
export type GroupMemberRole = "owner" | "admin" | "member";
export type DisputeStatus = "pending" | "accepted" | "rejected" | "active" | "finished";
export type MessageType = "text" | "prediction_share" | "provocation" | "system";
export type ReactionType =
  | "fire"
  | "clown"
  | "crying"
  | "trophy"
  | "goat"
  | "shocked"
  | "laughing"
  | "thumbs_up";
export type NotificationType =
  | "match_reminder"
  | "prediction_result"
  | "dispute_challenge"
  | "group_invite"
  | "reaction"
  | "provocation"
  | "system";
export type EventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_miss"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "var_decision"
  | "kick_off"
  | "half_time"
  | "full_time";

export interface Team {
  id: string;
  name: string;
  name_en: string | null;
  code: string;
  flag_url: string | null;
  group_letter: string | null;
  confederation: string | null;
  fifa_ranking: number | null;
  created_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  shirt_number: number | null;
  position: PlayerPosition | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  external_id: string | null;
  stage: MatchStage;
  group_letter: string | null;
  match_number: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  kickoff_at: string;
  stadium: string | null;
  city: string | null;
  country: string | null;
  score_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: EventType;
  minute: number | null;
  extra_minute: number | null;
  player_id: string | null;
  assist_player_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  favorite_team_id: string | null;
  phone: string | null;
  bio: string | null;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  exact_scores: number;
  referral_code: string | null;
  referred_by: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type ResultAuditAction =
  | "set_result"
  | "update_result"
  | "clear_result"
  | "settle_bracket";

export interface MatchResultAudit {
  id: string;
  match_id: string;
  actor_id: string | null;
  action: ResultAuditAction;
  old_home: number | null;
  old_away: number | null;
  new_home: number | null;
  new_away: number | null;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}

export interface BracketPrediction {
  id: string;
  user_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_team_id: string | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentResult {
  id: number;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_team_id: string | null;
  settled_at: string | null;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number;
  is_correct_winner: boolean | null;
  is_exact_score: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ScorerPrediction {
  id: string;
  user_id: string;
  match_id: string;
  player_id: string;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
}

export interface ScoringConfig {
  correct_winner: number;
  exact_score: number;
  correct_scorer: number;
  multipliers: Record<MatchStage, number>;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  type: GroupType;
  invite_code: string;
  max_members: number;
  stake_amount: number | null;
  stake_currency: string;
  scoring_config: ScoringConfig | null;
  avatar_url: string | null;
  is_active: boolean;
  predictions_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  total_points: number;
  rank: number | null;
  joined_at: string;
}

export interface Dispute {
  id: string;
  challenger_id: string;
  opponent_id: string;
  match_id: string | null;
  group_id: string | null;
  status: DisputeStatus;
  stake_description: string | null;
  challenger_points: number;
  opponent_points: number;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: MessageType;
  prediction_id: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  prediction_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface GlobalLeaderboardEntry {
  user_id: string;
  total_points: number;
  total_predictions: number;
  correct_winners: number;
  exact_scores: number;
  correct_scorers: number;
  rank: number | null;
  updated_at: string;
}
