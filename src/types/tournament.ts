
export interface BracketPlayer {
  id: string;
  name: string;
  eloRating: number;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  player1?: BracketPlayer | null;
  player2?: BracketPlayer | null;
  winner?: string | null;
  nextMatchId?: string | null;
  round: number;
  matchNumber: number;
}

export interface TournamentBracket {
  id: string;
  name: string;
  matches: BracketMatch[];
  rounds: number;
  roundNames?: string[];
}
