
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the league standings after a match is completed
 */
export async function updateLeagueStandings(matchId: string, leagueId: string): Promise<void> {
  try {
    // Get match results
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        match_players (
          player_id,
          performance_rating
        )
      `)
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;
    
    if (!match || !match.match_players || match.match_players.length !== 2) {
      throw new Error("Invalid match data");
    }
    
    // Determine winner based on performance rating
    const players = match.match_players;
    let winnerId: string | null = null;
    
    if (players[0].performance_rating && players[1].performance_rating) {
      winnerId = players[0].performance_rating > players[1].performance_rating 
        ? players[0].player_id 
        : players[1].player_id;
    }
    
    if (!winnerId) {
      return; // No winner determined yet
    }
    
    // Update both players' stats
    for (const player of players) {
      const isWinner = player.player_id === winnerId;
      
      // Update league_players record with incremented values
      const { error: updateError } = await supabase
        .from("league_players")
        .update({
          matches_played: isWinner || !isWinner ? 1 : 0, // Increment by 1 for both players
          matches_won: isWinner ? 1 : 0, // Increment by 1 for winner only
          matches_lost: !isWinner ? 1 : 0, // Increment by 1 for loser only
          points: isWinner ? 3 : 0 // Add 3 points for winner only
        })
        .eq("league_id", leagueId)
        .eq("player_id", player.player_id)
        .select();

      if (updateError) {
        console.error("Error updating league player stats:", updateError);
        throw updateError;
      }
    }
  } catch (error) {
    console.error("Error updating league standings:", error);
    throw error;
  }
}
