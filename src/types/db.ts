export type TournamentFormat = "league" | "knockout" | "groups_knockout";

export type TournamentStatus = "draft" | "active" | "finished";

export type MatchStatus =
  | "scheduled"
  | "pending_validation"
  | "confirmed"
  | "disputed";

export type Tournament = {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  created_by: string;
  max_players: number;
  start_date: string;
  created_at: string;
};

export type TournamentPlayer = {
  tournament_id: string;
  player_id: string;
  group_name: string | null;
  joined_at: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  home_player_id: string;
  away_player_id: string;
  home_score: number | null;
  away_score: number | null;
  round: number;
  status: MatchStatus;
  played_at: string | null;
  confirmed_by_home: boolean;
  confirmed_by_away: boolean;
  created_at: string;
};

