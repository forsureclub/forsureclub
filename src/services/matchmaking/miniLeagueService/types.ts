
/**
 * Type definitions for mini league functionality
 */

export interface MiniLeague {
  id: string;
  name: string;
  sport: string;
  location: string;
  start_date: string;
  status: string;
  player_count: number;
  weeks_between_matches: number;
}

export interface LeaguePlayer {
  league_id: string;
  player_id: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  points: number;
}

export interface LeagueCreationResult {
  id: string;
  name: string;
  rounds: number;
}

export interface LeagueMatch {
  id: string;
  played_at: string;
  status: string;
  round_number: number;
  sport: string;
  location: string;
  match_players: {
    player_id: string;
    has_confirmed: boolean;
    performance_rating: number | null;
  }[];
}
