
import { supabase } from "@/integrations/supabase/client";
import { getPlayerEloRating } from "./eloSystem";
import { Json } from "@/integrations/supabase/types";

interface BracketPlayer {
  id: string;
  name: string;
  eloRating: number;
  seed?: number;
}

interface BracketMatch {
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

interface BracketData {
  matches: BracketMatch[];
  rounds: number;
  roundNames: string[];
}

/**
 * Creates a single elimination tournament bracket for 16 players
 * Seeds the top 4 players based on ELO rating and randomizes the rest
 */
export async function createSingleEliminationBracket(
  tournamentId: string, 
  tournamentName: string,
  sport: string
): Promise<TournamentBracket> {
  try {
    // Fetch all players for this sport
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, elo_rating')
      .eq('sport', sport)
      .order('elo_rating', { ascending: false });
    
    if (playersError || !players) {
      throw new Error(`Error fetching players: ${playersError?.message}`);
    }

    // Ensure we have at least 16 players
    if (players.length < 16) {
      throw new Error(`Not enough players for a 16-player bracket: found ${players.length}`);
    }

    // Take the top 16 players by ELO
    let bracketPlayers: BracketPlayer[] = players.slice(0, 16).map(p => ({
      id: p.id,
      name: p.name,
      eloRating: p.elo_rating || 1500,
    }));

    // Assign seeds to the top 4 players
    for (let i = 0; i < 4; i++) {
      bracketPlayers[i].seed = i + 1;
    }

    // Randomize the remaining players
    const seededPlayers = bracketPlayers.slice(0, 4);
    const unseededPlayers = bracketPlayers.slice(4);
    shuffleArray(unseededPlayers);
    
    // Combine seeded and shuffled unseeded players
    bracketPlayers = [...seededPlayers, ...unseededPlayers];

    // Place players in the bracket according to standard seeding rules
    // For a 16-player bracket, the standard seeding pattern is:
    // 1 vs 16, 8 vs 9, 5 vs 12, 4 vs 13, 3 vs 14, 6 vs 11, 7 vs 10, 2 vs 15
    const seedPositions = [
      0, 15, 7, 8, 3, 12, 4, 11, 2, 13, 5, 10, 6, 9, 1, 14
    ];
    
    // Create the bracket structure - 15 matches in total for 16 players
    const roundCount = Math.log2(16);
    const matches: BracketMatch[] = [];
    
    // Create matches for the first round (8 matches)
    for (let i = 0; i < 8; i++) {
      const player1Index = seedPositions[i * 2];
      const player2Index = seedPositions[i * 2 + 1];
      
      matches.push({
        id: `R1M${i + 1}`,
        player1: bracketPlayers[player1Index],
        player2: bracketPlayers[player2Index],
        round: 1,
        matchNumber: i + 1,
        nextMatchId: `R2M${Math.floor(i/2) + 1}`
      });
    }
    
    // Create matches for subsequent rounds (4 in round 2, 2 in round 3, 1 final)
    for (let round = 2; round <= roundCount; round++) {
      const matchesInRound = Math.pow(2, roundCount - round);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          id: `R${round}M${i + 1}`,
          round: round,
          matchNumber: i + 1,
          nextMatchId: round < roundCount ? `R${round + 1}M${Math.floor(i/2) + 1}` : undefined
        });
      }
    }
    
    const bracketData: BracketData = {
      matches,
      rounds: roundCount,
      roundNames: ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final']
    };
    
    // Store the bracket in Supabase
    // Convert to a plain object that can be stored as JSON
    const bracketDataJson = JSON.parse(JSON.stringify(bracketData)) as Json;
    
    const { error: bracketError } = await supabase
      .from('tournaments')
      .update({
        bracket_data: bracketDataJson
      })
      .eq('id', tournamentId);
      
    if (bracketError) {
      throw new Error(`Error saving bracket: ${bracketError.message}`);
    }

    return {
      id: tournamentId,
      name: tournamentName,
      matches: bracketData.matches,
      rounds: bracketData.rounds,
      roundNames: bracketData.roundNames
    };
  } catch (error) {
    console.error("Error creating tournament bracket:", error);
    throw error;
  }
}

/**
 * Advance a player to the next round in the bracket
 */
export async function advancePlayerInBracket(
  tournamentId: string,
  matchId: string,
  winnerId: string
): Promise<void> {
  try {
    // Get current bracket data
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('bracket_data')
      .eq('id', tournamentId)
      .single();
    
    if (tournamentError || !tournament) {
      throw new Error(`Error fetching tournament bracket: ${tournamentError?.message}`);
    }
    
    const bracketData = tournament.bracket_data as BracketData | null;
    if (!bracketData || !bracketData.matches) {
      throw new Error('Tournament bracket not found or is invalid');
    }
    
    const matches = bracketData.matches;
    
    // Find the current match
    const matchIndex = matches.findIndex((m: BracketMatch) => m.id === matchId);
    if (matchIndex === -1) {
      throw new Error(`Match ${matchId} not found in bracket`);
    }
    
    const match = matches[matchIndex];
    
    // Verify winner is one of the players in the match
    if (match.player1?.id !== winnerId && match.player2?.id !== winnerId) {
      throw new Error(`Player ${winnerId} is not part of match ${matchId}`);
    }
    
    // Set the winner
    match.winner = winnerId;
    
    // If there's a next match, advance the player
    if (match.nextMatchId) {
      const nextMatchIndex = matches.findIndex((m: BracketMatch) => m.id === match.nextMatchId);
      if (nextMatchIndex !== -1) {
        const nextMatch = matches[nextMatchIndex];
        const winnerPlayer = match.player1?.id === winnerId ? match.player1 : match.player2;
        
        // Assign to player1 or player2 spot based on match number
        if (match.matchNumber % 2 === 1) {
          nextMatch.player1 = winnerPlayer;
        } else {
          nextMatch.player2 = winnerPlayer;
        }
        
        matches[nextMatchIndex] = nextMatch;
      }
    }
    
    matches[matchIndex] = match;
    bracketData.matches = matches;
    
    // Update the bracket in the database
    // Convert to a plain object that can be stored as JSON
    const bracketDataJson = JSON.parse(JSON.stringify(bracketData)) as Json;
    
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ bracket_data: bracketDataJson })
      .eq('id', tournamentId);
      
    if (updateError) {
      throw new Error(`Error updating bracket: ${updateError.message}`);
    }
    
  } catch (error) {
    console.error("Error advancing player in bracket:", error);
    throw error;
  }
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
