
import { supabase } from "@/integrations/supabase/client";
import { BracketMatch, BracketPlayer } from "@/types/tournament";

export interface TournamentAchievement {
  type: "winner" | "runnerUp" | "semifinalist";
  tournamentId: string;
  tournamentName: string;
  date: string;
}

/**
 * Fetch recent tournament achievements for a specific player
 */
export async function fetchPlayerAchievements(playerId: string): Promise<TournamentAchievement[]> {
  try {
    // Fetch recently completed tournaments
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, name, sport, start_date, bracket_data, status')
      .eq('status', 'completed')
      .order('start_date', { ascending: false });
    
    if (error || !tournaments) {
      console.error("Error fetching tournament achievements:", error);
      return [];
    }

    const achievements: TournamentAchievement[] = [];
    
    // Process each tournament to check for player achievements
    for (const tournament of tournaments) {
      const bracketData = tournament.bracket_data as any;
      if (!bracketData || !bracketData.matches) continue;
      
      const matches = bracketData.matches as BracketMatch[];
      
      // Find the final match
      const finalMatch = matches.find(m => m.round === bracketData.rounds);
      
      if (finalMatch) {
        // Check if player is winner
        if (finalMatch.winner === playerId) {
          achievements.push({
            type: "winner",
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            date: tournament.start_date
          });
          continue; // Skip to next tournament if player is winner
        }
        
        // Check if player is runner-up
        const isRunnerUp = (finalMatch.player1?.id === playerId || finalMatch.player2?.id === playerId) && 
                           finalMatch.player1 && finalMatch.player2;
        
        if (isRunnerUp) {
          achievements.push({
            type: "runnerUp",
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            date: tournament.start_date
          });
          continue; // Skip to next tournament if player is runner-up
        }
      }
      
      // Check if player reached semifinals
      const semifinalMatches = matches.filter(m => m.round === bracketData.rounds - 1);
      
      for (const semifinalMatch of semifinalMatches) {
        if (
          (semifinalMatch.player1?.id === playerId || semifinalMatch.player2?.id === playerId) && 
          semifinalMatch.winner !== playerId
        ) {
          achievements.push({
            type: "semifinalist",
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            date: tournament.start_date
          });
          break; // Found semifinalist status, no need to check other matches
        }
      }
    }
    
    return achievements;
  } catch (error) {
    console.error("Error processing tournament achievements:", error);
    return [];
  }
}

/**
 * Update player ELO ratings based on tournament results
 */
export async function updateRatingsFromTournament(tournamentId: string): Promise<boolean> {
  try {
    // First, get the tournament data
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('bracket_data, sport')
      .eq('id', tournamentId)
      .single();
    
    if (tournamentError || !tournament || !tournament.bracket_data) {
      console.error("Error fetching tournament for ratings update:", tournamentError);
      return false;
    }
    
    const bracketData = tournament.bracket_data as any;
    if (!bracketData.matches) return false;
    
    const matches = bracketData.matches as BracketMatch[];
    
    // Get the player IDs for all players who competed
    const playerIds = new Set<string>();
    matches.forEach(match => {
      if (match.player1?.id) playerIds.add(match.player1.id);
      if (match.player2?.id) playerIds.add(match.player2.id);
    });
    
    // Get current ELO ratings for all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, elo_rating')
      .in('id', Array.from(playerIds))
      .eq('sport', tournament.sport);
    
    if (playersError) {
      console.error("Error fetching player ratings:", playersError);
      return false;
    }
    
    // Create a map of player IDs to ELO ratings
    const playerRatings = new Map<string, number>();
    players.forEach((player: any) => {
      playerRatings.set(player.id, player.elo_rating || 1500);
    });
    
    // Process each match where we have a winner
    const updatedRatings = new Map<string, number>(playerRatings);
    
    for (const match of matches.filter(m => m.winner)) {
      if (!match.player1?.id || !match.player2?.id || !match.winner) continue;
      
      // Get current ratings
      const player1Rating = playerRatings.get(match.player1.id) || 1500;
      const player2Rating = playerRatings.get(match.player2.id) || 1500;
      
      // Calculate expected outcome
      const expected1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
      const expected2 = 1 - expected1;
      
      // Determine K-factor (impact of match)
      // Higher rounds have more impact
      const kFactor = 16 + (match.round * 4); 
      
      // Calculate new ratings
      if (match.winner === match.player1.id) {
        const newPlayer1Rating = Math.round(player1Rating + kFactor * (1 - expected1));
        const newPlayer2Rating = Math.round(player2Rating + kFactor * (0 - expected2));
        updatedRatings.set(match.player1.id, newPlayer1Rating);
        updatedRatings.set(match.player2.id, newPlayer2Rating);
      } else {
        const newPlayer1Rating = Math.round(player1Rating + kFactor * (0 - expected1));
        const newPlayer2Rating = Math.round(player2Rating + kFactor * (1 - expected2));
        updatedRatings.set(match.player1.id, newPlayer1Rating);
        updatedRatings.set(match.player2.id, newPlayer2Rating);
      }
    }
    
    // Update all player ratings in the database
    for (const [playerId, newRating] of updatedRatings.entries()) {
      const { error: updateError } = await supabase
        .from('players')
        .update({ elo_rating: newRating })
        .eq('id', playerId);
      
      if (updateError) {
        console.error(`Error updating rating for player ${playerId}:`, updateError);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating ratings from tournament:", error);
    return false;
  }
}
